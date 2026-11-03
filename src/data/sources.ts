import wb from "./workbook.json";
import overrides from "./url-overrides.json";

export type Kind = "company" | "estimate" | "press" | "assumption" | "hypothetical" | "calculated" | "independent";

export interface SourceRecord {
  id: string;
  entity: string;
  evidence: string;
  classification: string;
  establishes: string;
  date: string;
  url: string;
  /** App-level grouping of the workbook's "Source classification" (a label, not a score). */
  quality: string;
  /** ISO date used for sorting/filtering; null when the workbook gives no exact day. */
  isoDate: string | null;
  /** "original" = workbook Sources sheet (18 records); "supplemental" = added after the workbook. */
  collection: "original" | "supplemental";
  /** URL exactly as recorded in the workbook, kept when the displayed URL is a canonical override. */
  workbookUrl?: string;
  /** Supplemental records only: what kind of date `date` is, and when the link was last checked. */
  dateKind?: "Publication date";
  viewed?: string;
}

/** Canonical display destinations. The workbook itself is never modified; these override only what the app links to. */
export const URL_OVERRIDES: Record<string, string> = overrides;

/** Transparent grouping of workbook classifications into evidence-quality labels (see methodology on /evidence). */
export const QUALITY_BY_CLASSIFICATION: Record<string, string> = {
  Official: "Primary — issuer / institution",
  "Institutional release": "Primary — issuer / institution",
  "Company disclosure": "Primary — issuer / institution",
  "Company release": "Primary — issuer / institution",
  "Company announcement": "Primary — issuer / institution",
  "Vendor primary": "Vendor-controlled",
  "Vendor case study": "Vendor-controlled",
  "Company website": "Vendor-controlled",
  "Competitor announcement": "Competitor-reported",
  "Competitor documentation": "Competitor-reported",
  "Third-party estimate": "Third-party estimate (unaudited)",
  "Press interview": "Press report (unverified)",
  "Independent / excerpt": "Independent, secondhand excerpt",
  "Independent customer hosting": "Independent, secondhand excerpt",
};

const iso = (d: string) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);

export const SOURCES: SourceRecord[] = wb.sources.map((s) => ({
  ...s,
  url: URL_OVERRIDES[s.id] ?? s.url,
  workbookUrl: URL_OVERRIDES[s.id] && URL_OVERRIDES[s.id] !== s.url ? s.url : undefined,
  collection: "original" as const,
  quality: QUALITY_BY_CLASSIFICATION[s.classification] ?? "Unclassified",
  isoDate: iso(s.date),
}));
/** Supplemental public announcements (X-series IDs), kept separate from the 18 original workbook records. */
const LINK_CHECKED = "2026-11-02";
const supp = (n: number, evidence: string, establishes: string, slug: string): SourceRecord => ({
  id: `X0${n}`, entity: "Chainguard", evidence, classification: "Company announcement", establishes,
  date: "2026-10-14", isoDate: "2026-10-14", dateKind: "Publication date", viewed: LINK_CHECKED,
  url: `https://www.chainguard.dev/unchained/${slug}`,
  quality: "Vendor announcement (no adoption or revenue evidence)", collection: "supplemental",
});
export const SUPPLEMENTAL_SOURCES: SourceRecord[] = [
  supp(1, "Chainguard Harness announcement (Oct 2026)", "Company introduced an AI-based vulnerability hunting and remediation offering; the initial announcement opened a beta waitlist.", "introducing-chainguard-harness"),
  supp(2, "Chainguard Workspaces announcement (Oct 2026)", "Company announced isolated microVM-based development environments for developers and AI coding agents.", "introducing-chainguard-workspaces"),
  supp(3, "Chainguard Checks announcement (Oct 2026)", "Company announced a beta product enabling developers and AI agents to run code validation checks earlier in development workflows.", "introducing-chainguard-checks"),
];
export const ALL_SOURCES = [...SOURCES, ...SUPPLEMENTAL_SOURCES];
export const SOURCE_BY_ID = Object.fromEntries(ALL_SOURCES.map((s) => [s.id, s])) as Record<string, SourceRecord>;

export interface HistoricalInput {
  company: string; measure: string; dataType: string; value: number; units: string; date: string;
  sourceId: string; quality: string; interpretation: string; url: string;
}
export const HISTORICAL = wb.historical as HistoricalInput[];
export const hist = (company: string, measure: string): HistoricalInput => {
  const h = HISTORICAL.find((x) => x.company === company && x.measure === measure);
  if (!h) throw new Error(`Unknown sourced input ${company}/${measure}`);
  return h;
};
export const kindOfDataType = (t: string): Kind =>
  t === "Company disclosure" ? "company" : t === "Third-party estimate" ? "estimate" : "press";

export interface Opportunity { name: string; region: string; segment: string; url: string; priority: string; limitation: string }
export const OPPORTUNITIES = wb.opportunities as Opportunity[];
export interface Risk { company: string; domain: string; failure: string; evidence: string; requirement: string; consequence: string; sourceId: string }
export const RISKS = wb.risks as Risk[];
export const NOTES = wb.notes;
