import { describe, expect, it } from "vitest";
import { LINK_CHECKS, LINK_LABEL, linkCheck } from "../linkchecks";
import { ALL_SOURCES, SOURCES } from "../sources";
import { DEALS, PEERS, RAPID7_ARR, RAPID7_CAVEAT, VALUATION_SOURCES, VAL_SOURCE_BY_ID, idForUrl, peerSourceIds } from "../valuation";
import wb from "../workbook.json";
import { evaluate, getDefaults, peerMultiple, peerStats } from "@/engine";

describe("V-series valuation evidence register", () => {
  it("has stable sequential identifiers V01–V18, distinct from S and X", () => {
    expect(VALUATION_SOURCES.map((v) => v.id)).toEqual(Array.from({ length: 18 }, (_, i) => `V${String(i + 1).padStart(2, "0")}`));
    expect(new Set([...ALL_SOURCES.map((s) => s.id), ...VALUATION_SOURCES.map((v) => v.id)]).size).toBe(21 + 18);
  });
  it("keeps the 18 original S records intact", () => {
    expect(SOURCES.map((s) => s.id)).toEqual(wb.sources.map((s) => s.id));
    SOURCES.forEach((s, i) => expect([s.entity, s.evidence, s.establishes, s.date]).toEqual([wb.sources[i].entity, wb.sources[i].evidence, wb.sources[i].establishes, wb.sources[i].date]));
  });
  it("covers every peer source URL with a separate record per distinct document", () => {
    const urls = VALUATION_SOURCES.map((v) => v.url);
    expect(new Set(urls).size).toBe(18);
    PEERS.forEach((p) => { expect(urls).toContain(p.quoteUrl); expect(urls).toContain(p.operatingUrl); });
    expect(VAL_SOURCE_BY_ID.V17.url).toBe(DEALS[3].priceUrl);
    expect(VAL_SOURCE_BY_ID.V18.url).toBe(DEALS[3].arrUrl);
  });
  it("every record has all required fields; undeterminable ones are null, never invented", () => {
    for (const v of VALUATION_SOURCES) {
      for (const k of ["id", "company", "title", "metric", "organization", "url", "classification", "limitations"] as const) expect(v[k], `${v.id}.${k}`).toBeTruthy();
      expect(v.url).toMatch(/^https:\/\//);
      if (v.role === "market-data") { expect(v.observationDate).toBe("2026-11-02"); expect(v.publicationDate).toBeNull(); }
      else expect(v.observationDate).toBeNull();
    }
    // only one record carries a publication date, and it states its basis
    expect(VALUATION_SOURCES.filter((v) => v.publicationDate).map((v) => [v.id, v.publicationDateBasis])).toEqual([["V18", "URL path"]]);
    expect(VAL_SOURCE_BY_ID.V08.reportingPeriod).toBeNull();
  });
  it("peer and deal figures cross-link to source IDs whose URLs match", () => {
    for (const p of PEERS) {
      const ids = peerSourceIds(p.ticker);
      expect(VAL_SOURCE_BY_ID[ids.market].url).toBe(p.quoteUrl);
      expect(VAL_SOURCE_BY_ID[ids.operating].url).toBe(p.operatingUrl);
    }
    expect(DEALS.flatMap((d) => [d.priceUrl, d.arrUrl]).map(idForUrl)).toEqual(["S03", "S02", "S07", "S07", "S07", "S08", "V17", "V18"]);
  });
});

describe("Rapid7 clarification", () => {
  it("distinguishes ARR growth from TTM revenue growth and leaves the calculation untouched", () => {
    expect(RAPID7_CAVEAT).toMatch(/\$824M/); expect(RAPID7_CAVEAT).toMatch(/down 2\.0%/); expect(RAPID7_CAVEAT).toMatch(/trailing-twelve-month revenue growth/);
    expect(RAPID7_CAVEAT).toMatch(/not substituted/); expect(RAPID7_CAVEAT).toContain(PEERS[0].caveat);
    expect(RAPID7_ARR.arrYoy).toBe(-0.02);
    const rpd = PEERS[0];
    expect(rpd.yoy).toBe(0.001);
    expect(peerMultiple(rpd)).toBeCloseTo(1260 / 855.92, 12);
    expect(peerStats(PEERS).core).toBeCloseTo(8.4375666926923, 9);
  });
});

describe("link-check classifications", () => {
  const all = [...ALL_SOURCES.map((s) => s.url), ...VALUATION_SOURCES.map((v) => v.url)];
  it("every displayed external source has a recorded check", () => {
    all.forEach((u) => expect(linkCheck(u).status, u).not.toBe("unchecked"));
  });
  it("uses only the four defined classifications with consistent HTTP codes", () => {
    for (const c of Object.values(LINK_CHECKS)) {
      expect(["accessible", "redirected", "restricted", "broken"]).toContain(c.status);
      if (c.status === "accessible") expect(c.http! >= 200 && c.http! < 300).toBe(true);
      if (c.status === "broken") expect([404, 410, null]).toContain(c.http);
    }
    expect(LINK_LABEL.restricted).toBe("Access restricted / verification inconclusive");
  });
  it("records HTTP 403 as inconclusive: neither verified nor broken", () => {
    const f403 = Object.entries(LINK_CHECKS).filter(([, c]) => c.http === 403);
    expect(f403.length).toBeGreaterThan(0);
    f403.forEach(([, c]) => expect(c.status).toBe("restricted"));
    expect(Object.values(LINK_CHECKS).filter((c) => c.status === "broken")).toHaveLength(0);
    for (const k of ["tenable-announces-second", "crowdstrike-reports-second", "sec.gov"]) expect(Object.entries(LINK_CHECKS).filter(([u]) => u.includes(k)).every(([, c]) => c.status === "restricted")).toBe(true);
  });
});

describe("financial outputs unchanged", () => {
  it("base case and peer-derived outputs are identical to the approved values", () => {
    const e = evaluate(getDefaults()).companies;
    expect(e.vanta.returns.base.moicPrimary).toBeCloseTo(1.4742, 4);
    expect(e.vanta.returns.base.irrPrimary).toBeCloseTo(0.080715, 6);
    expect(e.vanta.returns.base.maxPrePrimary).toBeCloseTo(2921.48, 2);
    expect(e.chainguard.returns.base.moicPrimary).toBeCloseTo(1.2871, 4);
    expect(e.chainguard.returns.base.irrPrimary).toBeCloseTo(0.051776, 6);
    expect(e.chainguard.returns.base.maxPrePrimary).toBeCloseTo(2020.77, 2);
    expect(peerStats(PEERS).core).toBeCloseTo(8.4375666927, 8);
  });
});
