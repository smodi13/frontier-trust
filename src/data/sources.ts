import wb from "./workbook.json";

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
}

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
  quality: QUALITY_BY_CLASSIFICATION[s.classification] ?? "Unclassified",
  isoDate: iso(s.date),
}));
export const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s])) as Record<string, SourceRecord>;

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
