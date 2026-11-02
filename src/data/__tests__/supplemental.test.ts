import { describe, expect, it } from "vitest";
import wb from "../workbook.json";
import { SEEDED_EVENTS } from "../monitoring";
import { ALL_SOURCES, SOURCES, SOURCE_BY_ID, SUPPLEMENTAL_SOURCES, URL_OVERRIDES } from "../sources";
import { evaluate, getDefaults } from "@/engine";

describe("supplemental sources", () => {
  it("adds exactly three Oct 14 2026 Chainguard company announcements with canonical URLs", () => {
    expect(SUPPLEMENTAL_SOURCES.map((s) => [s.id, s.url])).toEqual([
      ["X01", "https://www.chainguard.dev/unchained/introducing-chainguard-harness"],
      ["X02", "https://www.chainguard.dev/unchained/introducing-chainguard-workspaces"],
      ["X03", "https://www.chainguard.dev/unchained/introducing-chainguard-checks"],
    ]);
    for (const s of SUPPLEMENTAL_SOURCES) {
      expect(s.classification).toBe("Company announcement");
      expect(s.date).toBe("2026-10-14");
      expect(s.collection).toBe("supplemental");
      expect(s.quality).not.toMatch(/independent/i);
      expect(s.establishes).not.toMatch(/\bARR\b|profit|revenue/i); // no inferred traction
    }
  });
  it("keeps the 18 original records separate and intact", () => {
    expect(SOURCES).toHaveLength(18);
    expect(SOURCES.every((s) => s.collection === "original")).toBe(true);
    expect(ALL_SOURCES).toHaveLength(21);
    expect(new Set(ALL_SOURCES.map((s) => s.id)).size).toBe(21);
    SOURCES.forEach((s, i) => {
      const w = wb.sources[i];
      expect([s.id, s.entity, s.evidence, s.classification, s.establishes, s.date]).toEqual([w.id, w.entity, w.evidence, w.classification, w.establishes, w.date]);
      if (!URL_OVERRIDES[s.id]) expect(s.url).toBe(w.url);
    });
  });
  it("uses canonical URLs for S14 and S18 while recording the workbook value", () => {
    expect(SOURCE_BY_ID.S14.url).toBe("https://www.otpp.com/en-ca/about-us/news-and-insights/2026/ontario-teachers-delivers-total-fund-net-return-in-first-half-of-2026/");
    expect(SOURCE_BY_ID.S18.url).toBe("https://www.chainguard.dev/unchained/adopt-hardened-containers-without-changing-your-pipelines-tooling-or-environment");
    expect(SOURCE_BY_ID.S14.workbookUrl).toBe(wb.sources[13].url);
    expect(SOURCE_BY_ID.S18.workbookUrl).toBe(wb.sources[17].url);
    for (const s of ALL_SOURCES) expect(s.url).not.toMatch(/wip\.otpp\.com|chainguard\.app/);
  });
  it("monitoring includes the supplemental events with supplemental origin", () => {
    const ev = SEEDED_EVENTS.filter((e) => e.origin === "supplemental");
    expect(ev.map((e) => e.sourceId)).toEqual(["X01", "X02", "X03"]);
    expect(SEEDED_EVENTS.filter((e) => e.origin === "register").length).toBeGreaterThan(10);
  });
});

describe("base-case regression (calculated, not hardcoded in the app)", () => {
  it("is unchanged by the supplemental evidence", () => {
    const r = evaluate(getDefaults()).companies;
    expect(r.vanta.returns.base.moicPrimary).toBeCloseTo(1.4742, 4);
    expect(r.vanta.returns.base.irrPrimary).toBeCloseTo(0.080715, 6);
    expect(r.vanta.returns.base.maxPrePrimary).toBeCloseTo(2921.48, 2);
    expect(r.chainguard.returns.base.moicPrimary).toBeCloseTo(1.2871, 4);
    expect(r.chainguard.returns.base.irrPrimary).toBeCloseTo(0.051776, 6);
    expect(r.chainguard.returns.base.maxPrePrimary).toBeCloseTo(2020.77, 2);
  });
  it("modeled assumptions still equal the workbook", () => {
    const d = getDefaults();
    expect([d.companies.vanta.entryPreMoney, d.companies.chainguard.entryPreMoney]).toEqual([5000, 4000]);
    expect([d.companies.vanta.dilution, d.companies.chainguard.dilution]).toEqual([0.15, 0.2]);
    expect([d.companies.vanta.scenarios.base.exitMultiple, d.companies.chainguard.scenarios.base.exitMultiple]).toEqual([8, 9]);
    expect([d.companies.vanta.scenarios.base.exitNetDebt, d.companies.chainguard.scenarios.base.exitNetDebt]).toEqual([0, 200]);
    expect(d.hurdle).toBe(0.2);
  });
});
