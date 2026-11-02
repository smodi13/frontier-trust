import { describe, expect, it } from "vitest";
import cache from "../workbook-cache.json";
import {
  CASE_IDS, COMPANY_IDS, SENS_EXIT_MULTIPLES, SENS_GROWTH_SHIFTS, SENS_TARGET_IRRS,
  evaluate, getDefaults, irrGrid, maxEntryGrid, type CaseId, type CompanyId,
} from "..";

/** Oracles = values cached in the original Excel workbook (extracted by scripts/extract_workbook.py). */
const close = (a: number | null, b: unknown) => expect(a).toBeCloseTo(b as number, 8);
const inp = getDefaults();
const res = evaluate(inp, "primary");
const sec = evaluate(inp, "secondary");
const key = (co: CompanyId, k: CaseId) => `${co}.${k}`;

describe("workbook parity — forecasts (every row, every year, every case)", () => {
  for (const co of COMPANY_IDS) for (const k of CASE_IDS) {
    it(`${co} ${k}`, () => {
      const f = res.companies[co].forecasts[k];
      const o = (cache.forecast as Record<string, Record<string, (number | null)[]>>)[key(co, k)];
      for (const name of Object.keys(o) as (keyof typeof f)[]) {
        for (let t = 0; t < 6; t++) {
          const want = o[name as string][t];
          if (want === null || want === undefined) continue; // blank cell in the workbook
          close((f[name] as (number | null)[])[t], want);
        }
      }
    });
  }
});

describe("workbook parity — returns", () => {
  for (const co of COMPANY_IDS) for (const k of CASE_IDS) {
    it(`${co} ${k}`, () => {
      const r = res.companies[co].returns[k];
      const rs = sec.companies[co].returns[k];
      const o = (cache.returns as Record<string, Record<string, unknown>>)[key(co, k)];
      close(r.probability, o.prob);
      close(r.ownershipPrimary, o.ownPrimary);
      close(r.ownershipSecondary, o.ownSecondary);
      close(r.exitArr, o.arr2031);
      close(r.exitEv, o.exitEV);
      close(r.exitEquity, o.exitEquity);
      close(r.proceedsPrimary, o.proceedsPrimary);
      close(r.moicPrimary, o.moicPrimary);
      close(r.irrPrimary, o.irrPrimary);
      close(r.proceedsSecondary, o.proceedsSecondary);
      close(r.moicSecondary, o.moicSecondary);
      close(r.irrSecondary, o.irrSecondary);
      close(r.maxPrePrimary, o.maxPrePrimary);
      close(r.maxEntrySecondary, o.maxEntrySecondary);
      close(r.discountPrimary, o.discount);
      close(r.weightedProceeds, o.pwProceeds);
      close(r.targetMoic, o.targetMoic);
      expect(r.meetsHurdle ? "PASS" : "FAIL").toBe(o.pass);
      // secondary view of the same engine
      close(rs.irr, o.irrSecondary);
      close(rs.maxEntry, o.maxEntrySecondary);
    });
  }
});

describe("workbook parity — dashboard and matrices", () => {
  it("dashboard KPIs", () => {
    const d = cache.dashboard as Record<string, number | string>;
    const v = res.companies.vanta, c = res.companies.chainguard;
    close(v.returns.base.exitEquity, d["B.10"]); close(c.returns.base.exitEquity, d["C.10"]);
    close(v.returns.base.exitOwnership, d["B.12"]); close(c.returns.base.exitOwnership, d["C.12"]);
    close(v.weightedProceeds, d["B.17"]); close(c.weightedProceeds, d["C.17"]);
    close(v.weightedIrr, d["B.18"]); close(c.weightedIrr, d["C.18"]);
    expect(v.gate).toBe(d["B.19"]); expect(c.gate).toBe(d["C.19"]);
  });
  const m = cache.matrix as Record<string, number[][]>;
  for (const [id, co] of [["vanta", "vanta"], ["chainguard", "chainguard"]] as const) {
    it(`${id} IRR sensitivity`, () => {
      const g = irrGrid(inp, inp.companies[co], "base", "primary", SENS_EXIT_MULTIPLES, SENS_GROWTH_SHIFTS);
      g.forEach((row, i) => row.forEach((val, j) => close(val, m[`${id}Irr`][i + 1][j + 1])));
    });
    it(`${id} max-entry sensitivity`, () => {
      const g = maxEntryGrid(inp, inp.companies[co], "base", "primary", SENS_EXIT_MULTIPLES, SENS_TARGET_IRRS);
      g.forEach((row, i) => row.forEach((val, j) => close(val, m[`${id}Max`][i + 1][j + 1])));
    });
  }
});

describe("headline expectations from the brief", () => {
  const v = res.companies.vanta, c = res.companies.chainguard;
  it("Vanta base", () => {
    expect(v.forecasts.base.arr[5]).toBeCloseTo(1105.65, 2);
    expect(v.forecasts.base.fcf[5]).toBeCloseTo(72.65, 2);
    expect(v.returns.base.moicPrimary).toBeCloseTo(1.4742, 4);
    expect(v.returns.base.irrPrimary).toBeCloseTo(0.080715, 5);
    expect(v.returns.base.maxPrePrimary).toBeCloseTo(2921.48, 2);
  });
  it("Chainguard base", () => {
    expect(c.forecasts.base.arr[5]).toBeCloseTo(755.16, 2);
    expect(c.forecasts.base.fcf[5]).toBeCloseTo(-68.67, 2);
    expect(c.returns.base.moicPrimary).toBeCloseTo(1.2871, 4);
    expect(c.returns.base.irrPrimary).toBeCloseTo(0.051776, 5);
    expect(c.returns.base.maxPrePrimary).toBeCloseTo(2020.77, 2);
  });
  it("neither clears the hurdle", () => {
    expect(v.gate).toBe("REPRICE / WATCH");
    expect(c.gate).toBe("REPRICE / WATCH");
  });
});
