import { describe, expect, it } from "vitest";
import cache from "../valuation-cache.json";
import { DEALS, PEERS, dateGapDays, dealType } from "@/data/valuation";
import { COMPANY_IDS, evaluate, getDefaults, peerMultiple, peerStats, rawQuotient, reverseUnderwrite } from "..";

/** Oracles = Excel cached values from Frontier_Trust_Underwriting_With_Market_Comparables.xlsx. */
const close = (a: number | null, b: unknown) => expect(a).toBeCloseTo(b as number, 8);
const stats = peerStats(PEERS);

describe("public peers", () => {
  it("has the eight sourced peers, all observed 2 Nov 2026", () => {
    expect(PEERS.map((p) => p.ticker)).toEqual(["RPD", "TENB", "S", "VRNS", "QLYS", "OKTA", "ZS", "CRWD"]);
    PEERS.forEach((p) => { expect(p.date).toBe("2026-11-02"); expect(p.ev).toBeGreaterThan(0); expect(p.ttmRevenue).toBeGreaterThan(0); });
  });
  it("EV/TTM revenue is calculated and matches the workbook", () => {
    PEERS.forEach((p, i) => close(peerMultiple(p), cache.comps[i]));
  });
  it("median and distribution statistics are formula-derived and match the workbook", () => {
    close(stats.core, cache.stats.core); close(stats.all, cache.stats.all); close(stats.exOutlier, cache.stats.exCrwd);
    close(stats.low, cache.stats.low); close(stats.high, cache.stats.high); close(stats.mean, cache.stats.mean);
    expect(stats.coreCount).toBe(6);
  });
  it("statistics respond to the inputs (not hardcoded)", () => {
    const bumped = PEERS.map((p) => (p.ticker === "QLYS" ? { ...p, ev: p.ev * 2 } : p));
    expect(peerStats(bumped).core).not.toBeCloseTo(stats.core, 3);
    expect(peerStats([]).core).toBe(0);
  });
});

describe("reverse underwriting matches the Exit Multiple Review sheet", () => {
  const inp = getDefaults();
  for (const id of COMPANY_IDS) {
    it(id, () => {
      const r = reverseUnderwrite(inp, id, stats.core);
      const o = (cache.reverse as Record<string, Record<string, number>>)[id];
      for (const [k, key] of [["arrAnchor", "arr0"], ["exitArr", "exitArr"], ["exitMultiple", "exitMultiple"], ["peerMedian", "peerMedian"], ["peerLessModeled", "peerLessModeled"],
        ["preMoney", "preMoney"], ["check", "check"], ["stake", "stake"], ["netDebt", "netDebt"], ["targetMoic", "targetMoic"], ["reqExitEquity", "reqExitEquity"], ["reqExitEv", "reqExitEv"],
        ["reqEvArr", "reqEvArr"], ["reqArr", "reqArr"], ["addArr", "addArr"], ["peerExitEquity", "peerExitEquity"], ["peerMoic", "peerMoic"], ["peerIrr", "peerIrr"], ["peerMaxPre", "peerMaxPre"],
        ["baseIrr", "baseIrr"], ["origMaxPre", "origMaxPre"], ["fcf", "fcf"], ["fcfMargin", "fcfMargin"]] as const) close(r[k] as number, o[key]);
    });
  }
  it("original base case is unchanged", () => {
    const e = evaluate(inp).companies;
    expect(e.vanta.returns.base.moicPrimary).toBeCloseTo(1.4742, 4);
    expect(e.chainguard.returns.base.maxPrePrimary).toBeCloseTo(2020.77, 2);
  });
  it("changing an entry price recalculates required-return economics", () => {
    const a = reverseUnderwrite(inp, "vanta", stats.core);
    const i = getDefaults(); i.companies.vanta.entryPreMoney = 3000;
    const b = reverseUnderwrite(i, "vanta", stats.core);
    expect(b.stake).toBeGreaterThan(a.stake);
    expect(b.reqExitEquity).toBeLessThan(a.reqExitEquity);
    expect(b.reqEvArr).toBeLessThan(a.reqEvArr);
    expect(b.peerIrr).toBeGreaterThan(a.peerIrr);
    expect(b.peerMaxPre).toBeCloseTo(a.peerMaxPre, 6); // max price does not depend on the assumed entry price
  });
  it("changing a forecast alters required exit multiples and ARR", () => {
    const a = reverseUnderwrite(inp, "chainguard", stats.core);
    const i = getDefaults(); i.companies.chainguard.scenarios.base.growth2027 = 0.8;
    const b = reverseUnderwrite(i, "chainguard", stats.core);
    expect(b.exitArr).toBeGreaterThan(a.exitArr);
    expect(b.reqEvArr).toBeLessThan(a.reqEvArr);
    expect(b.addArr).toBeLessThan(a.addArr);
    expect(b.reqArr).toBeCloseTo(a.reqArr, 6); // required ARR at the modeled multiple is forecast-independent
  });
  it("solving at the required multiple yields exactly the hurdle IRR", () => {
    const i = getDefaults();
    const r = reverseUnderwrite(i, "vanta", stats.core);
    i.companies.vanta.scenarios.base.exitMultiple = r.reqEvArr;
    expect(evaluate(i).companies.vanta.returns.base.irrPrimary).toBeCloseTo(i.hurdle, 9);
  });
  it("zero equity at peer median gives -100% IRR", () => {
    const i = getDefaults(); i.companies.chainguard.scenarios.base.exitNetDebt = 99999;
    const r = reverseUnderwrite(i, "chainguard", stats.core);
    expect(r.peerExitEquity).toBe(0); expect(r.peerIrr).toBe(-1);
  });
});

describe("private deal signals", () => {
  it("raw quotients are calculated and match the workbook", () => {
    DEALS.forEach((d, i) => close(rawQuotient(d.price, d.arr), cache.deals[i]));
    expect(rawQuotient(1, 0)).toBe(0);
  });
  it("flags date mismatches and separates equity from M&A", () => {
    expect(DEALS.map((d) => dateGapDays(d.priceDate, d.arrDate))).toEqual([280, 0, null, null]);
    expect(DEALS.map((d) => dealType(d.transaction))).toEqual(["Equity financing valuation (post-money)", "Equity financing valuation (post-money)", "Equity financing valuation (post-money)", "Acquisition price (M&A)"]);
    expect(DEALS[0].validity).toMatch(/MISMATCH/);
    expect(DEALS[3].validity).toMatch(/BOUND ONLY/);
  });
});
