import { describe, expect, it } from "vitest";
import {
  arrAfter, buildForecast, evaluate, fmtPct, fmtUsd, fmtX, getDefaults, growthAt, irrFromMoic, irrGrid,
  maxEntryGrid, sanitizeInputs, type ModelInputs,
} from "..";

const base = () => getDefaults();
const vanta = (i = base()) => i.companies.vanta;

describe("ARR, growth decay, operating build", () => {
  it("ARR trajectory compounds the decaying growth rates", () => {
    const f = buildForecast(vanta(), vanta().scenarios.base);
    expect(f.arr.slice(0, 3).map((x) => +x.toFixed(4))).toEqual([300, 420, 567]);
    expect(f.growth.slice(1).map((g) => +(g as number).toFixed(6))).toEqual([0.4, 0.35, 0.3, 0.25, 0.2]);
  });
  it("growth never goes below zero", () => {
    const s = { growth2027: 0.1, decay: 0.05, exitMultiple: 5, exitNetDebt: 0 };
    expect([0, 1, 2, 3].map((i) => growthAt(s, i))).toEqual([0.1, 0.05, 0, 0]);
    expect(arrAfter(100, s, 4)).toBeCloseTo(100 * 1.1 * 1.05, 9);
  });
  it("revenue proxy = ARR × recognition factor (incl. 2026 snapshot)", () => {
    const f = buildForecast(vanta(), vanta().scenarios.base);
    expect(f.revenue[0]).toBeCloseTo(285, 9);
    expect(f.revenue[1]).toBeCloseTo(399, 9);
  });
  it("operating margin: 2027 EBITDA = GP − S&M − R&D − G&A", () => {
    const f = buildForecast(vanta(), vanta().scenarios.base);
    expect(f.ebitda[1]).toBeCloseTo(399 * (0.82 - 0.42 - 0.3 - 0.18), 9);
  });
  it("cost intensity floors at zero", () => {
    const c = { ...vanta(), smStart: 0.02, smStep: 0.05 };
    const f = buildForecast(c, c.scenarios.base);
    expect(f.sm[3]).toBeCloseTo(0, 12);
  });
  it("FCF = EBIT − tax − capex − ΔNWC + D&A; taxes only on positive EBIT", () => {
    const f = buildForecast(vanta(), vanta().scenarios.base);
    expect(f.tax[1]).toBe(-0); expect(f.tax[5]).toBeLessThan(0);
    const t = 5;
    expect(f.fcf[t]).toBeCloseTo((f.ebit[t] as number) + (f.tax[t] as number) + (f.capex[t] as number) + (f.nwc[t] as number) - (f.da[t] as number), 9);
    expect(f.fcfMargin[t]).toBeCloseTo((f.fcf[t] as number) / f.revenue[t], 12);
  });
});

describe("ownership, exit and returns mechanics", () => {
  const r = evaluate(base()).companies.vanta.returns.base;
  it("primary vs secondary ownership", () => {
    expect(r.ownershipPrimary).toBeCloseTo(100 / 5100, 12);
    expect(r.ownershipSecondary).toBeCloseTo(100 / 5000, 12);
    expect(r.ownershipPrimary).toBeLessThan(r.ownershipSecondary);
  });
  it("dilution reduces exit ownership", () => {
    expect(r.exitOwnership).toBeCloseTo((100 / 5100) * 0.85, 12);
  });
  it("exit EV, equity, proceeds, MOIC, IRR", () => {
    expect(r.exitEv).toBeCloseTo(1105.65 * 8, 6);
    expect(r.exitEquity).toBeCloseTo(8845.2, 6);
    expect(r.proceeds).toBeCloseTo(147.42, 6);
    expect(r.moic).toBeCloseTo(1.4742, 9);
    expect(r.irr).toBeCloseTo(1.4742 ** 0.2 - 1, 12);
  });
  it("max entry: re-pricing at the maximum yields exactly the hurdle IRR", () => {
    const i = base(); i.companies.vanta.entryPreMoney = r.maxPrePrimary;
    expect(evaluate(i).companies.vanta.returns.base.irr).toBeCloseTo(i.hurdle, 9);
    const s = base(); s.companies.vanta.entryPreMoney = r.maxEntrySecondary;
    expect(evaluate(s, "secondary").companies.vanta.returns.base.irr).toBeCloseTo(s.hurdle, 9);
  });
  it("probability-weighted proceeds", () => {
    const v = evaluate(base()).companies.vanta;
    const manual = 0.25 * v.returns.bear.proceeds + 0.5 * v.returns.base.proceeds + 0.25 * v.returns.bull.proceeds;
    expect(v.weightedProceeds).toBeCloseTo(manual, 9);
    expect(v.weightedIrr).toBeCloseTo((manual / 100) ** 0.2 - 1, 12);
  });
  it("zero / negative exit equity floors at zero, IRR = −100%", () => {
    const i = base(); i.companies.vanta.scenarios.base.exitNetDebt = 99999; // beyond UI bounds on purpose
    const x = evaluate(i).companies.vanta.returns.base;
    expect(x.exitEquity).toBe(0); expect(x.proceeds).toBe(0); expect(x.moic).toBe(0);
    expect(x.irr).toBe(-1); expect(x.maxPrePrimary).toBe(0); expect(x.meetsHurdle).toBe(false);
  });
  it("net cash increases exit equity (negative net debt)", () => {
    const bull = evaluate(base()).companies.vanta.returns.bull;
    expect(bull.exitEquity).toBeCloseTo(bull.exitEv + 100, 9);
  });
  it("positive IRR below the hurdle is not a pass", () => {
    expect(r.irr).toBeGreaterThan(0);
    expect(r.meetsHurdle).toBe(false);
    expect(evaluate(base()).companies.vanta.gate).toBe("REPRICE / WATCH");
  });
  it("irrFromMoic guards invalid input", () => {
    expect(irrFromMoic(0, 5)).toBe(-1);
    expect(irrFromMoic(NaN, 5)).toBe(-1);
  });
  it("hold period changes exit year and ARR used", () => {
    const i = base(); i.holdYears = 3;
    const x = evaluate(i).companies.vanta.returns.base;
    expect(x.exitYear).toBe(2029);
    expect(x.exitArr).toBeCloseTo(737.1, 9);
    i.holdYears = 7;
    const y = evaluate(i).companies.vanta.returns.base;
    expect(y.exitYear).toBe(2033);
    expect(y.exitArr).toBeGreaterThan(1105.65);
  });
});

describe("sensitivities", () => {
  it("centre cell equals the model IRR; grid recalculates when inputs change", () => {
    const i = base();
    const g = irrGrid(i, vanta(i), "base", "primary", [8], [0]);
    expect(g[0][0]).toBeCloseTo(evaluate(i).companies.vanta.returns.base.irrPrimary, 12);
    i.companies.vanta.entryPreMoney = 3000;
    expect(irrGrid(i, vanta(i), "base", "primary", [8], [0])[0][0]).toBeGreaterThan(g[0][0]);
  });
  it("higher growth shift and multiple both raise IRR", () => {
    const i = base();
    const g = irrGrid(i, vanta(i), "base", "primary", [5, 13], [-0.1, 0.1]);
    expect(g[0][1]).toBeGreaterThan(g[0][0]); expect(g[1][0]).toBeGreaterThan(g[0][0]);
  });
  it("max-entry grid at the model's hurdle/multiple equals Returns max pre-money", () => {
    const i = base();
    expect(maxEntryGrid(i, vanta(i), "base", "primary", [8], [0.2])[0][0]).toBeCloseTo(2921.484375, 6);
  });
});

describe("state integrity", () => {
  it("changing an assumption updates dependents, and only the right ones", () => {
    const before = evaluate(base());
    const i = base(); i.companies.vanta.scenarios.base.exitMultiple = 10;
    const after = evaluate(i);
    expect(after.companies.vanta.returns.base.irr).toBeGreaterThan(before.companies.vanta.returns.base.irr);
    expect(after.companies.vanta.returns.base.maxPrePrimary).toBeGreaterThan(before.companies.vanta.returns.base.maxPrePrimary);
    // no leakage: other company and other cases untouched
    expect(after.companies.chainguard).toEqual(before.companies.chainguard);
    expect(after.companies.vanta.returns.bear).toEqual(before.companies.vanta.returns.bear);
  });
  it("a fresh getDefaults() restores the original results (reset)", () => {
    const i = base(); i.checkSize = 250; i.companies.chainguard.dilution = 0.4;
    expect(evaluate(i).companies.chainguard.returns.base.irr).not.toBeCloseTo(0.0517757, 3);
    expect(evaluate(base()).companies.chainguard.returns.base.irr).toBeCloseTo(0.0517757, 6);
  });
  it("getDefaults returns independent copies", () => {
    const a = base(), b = base(); a.companies.vanta.scenarios.base.growth2027 = 0.9;
    expect(b.companies.vanta.scenarios.base.growth2027).toBe(0.4);
  });
  it("sanitize: missing/corrupt values fall back to workbook defaults, never invented numbers", () => {
    expect(sanitizeInputs(null)).toEqual(base());
    expect(sanitizeInputs("garbage")).toEqual(base());
    const bad = { checkSize: "100", hurdle: NaN, companies: { vanta: { dilution: null, scenarios: { base: { growth2027: undefined } } } } };
    expect(sanitizeInputs(bad)).toEqual(base());
  });
  it("sanitize: clamps out-of-range values and never overrides sourced ARR", () => {
    const x = sanitizeInputs({ hurdle: 9, holdYears: 4.6, companies: { vanta: { startArr: 1, dilution: -3 } } }) as ModelInputs;
    expect(x.hurdle).toBe(0.6); expect(x.holdYears).toBe(5);
    expect(x.companies.vanta.startArr).toBe(300); expect(x.companies.vanta.dilution).toBe(0);
  });
  it("sanitize round-trips valid state (refresh-safe)", () => {
    const i = base(); i.holdYears = 7; i.companies.vanta.scenarios.bull.exitMultiple = 14;
    expect(sanitizeInputs(JSON.parse(JSON.stringify(i)))).toEqual(i);
  });
});

describe("formatting", () => {
  it("shows negative returns correctly", () => {
    expect(fmtPct(-0.139027)).toBe("-13.9%");
    expect(fmtPct(0.0807)).toBe("8.1%");
    expect(fmtPct(-0.0001)).toBe("0.0%");
    expect(fmtUsd(-68.67)).toBe("($68.7M)");
    expect(fmtUsd(2921.48, { compact: true })).toBe("$2.92B");
    expect(fmtUsd(100, { dp: 0 })).toBe("$100M");
    expect(fmtX(8, 1)).toBe("8.0x");
    expect(fmtPct(undefined)).toBe("n/a");
  });
});
