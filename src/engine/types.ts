export const COMPANY_IDS = ["vanta", "chainguard"] as const;
export const CASE_IDS = ["bear", "base", "bull"] as const;
export type CompanyId = (typeof COMPANY_IDS)[number];
export type CaseId = (typeof CASE_IDS)[number];
export type EntryType = "primary" | "secondary";

export interface ScenarioDrivers {
  growth2027: number; // first forecast-year ARR growth
  decay: number; // annual growth step-down (absolute, e.g. 0.05 = 5 ppt)
  exitMultiple: number; // exit EV / ARR
  exitNetDebt: number; // $M, negative = net cash
}

export interface CompanyInputs {
  startArr: number; // $M, sourced 2026 ARR snapshot (read-only in UI)
  entryPreMoney: number; // $M, hypothetical
  dilution: number; // cumulative ownership dilution entry -> exit
  revenueRecognition: number; // revenue proxy / ending ARR
  grossMargin: number;
  smStart: number;
  rdStart: number;
  gaStart: number;
  smStep: number;
  rdStep: number;
  gaStep: number;
  daPct: number;
  capexPct: number;
  nwcPct: number; // incremental working capital / revenue growth
  taxRate: number;
  scenarios: Record<CaseId, ScenarioDrivers>;
}

export interface ModelInputs {
  checkSize: number; // $M
  hurdle: number; // required gross IRR
  holdYears: number; // integer years
  probabilities: Record<CaseId, number>;
  companies: Record<CompanyId, CompanyInputs>;
}

/** Arrays indexed 0..N; index 0 = 2026 snapshot (null where the workbook leaves the cell blank). */
export interface Forecast {
  years: number[];
  arr: number[];
  growth: (number | null)[];
  revenue: number[];
  grossProfit: (number | null)[];
  sm: (number | null)[];
  rd: (number | null)[];
  ga: (number | null)[];
  ebitda: (number | null)[];
  da: (number | null)[];
  ebit: (number | null)[];
  tax: (number | null)[];
  capex: (number | null)[];
  nwc: (number | null)[];
  fcf: (number | null)[];
  fcfMargin: (number | null)[];
}

export interface CaseReturns {
  probability: number;
  startArr: number;
  preMoney: number;
  check: number;
  postMoney: number;
  ownershipPrimary: number;
  ownershipSecondary: number;
  initialOwnership: number; // for selected entry type
  dilution: number;
  exitOwnership: number;
  exitYear: number;
  exitArr: number;
  exitMultiple: number;
  exitEv: number;
  exitNetDebt: number;
  exitEquity: number;
  proceedsPrimary: number;
  proceedsSecondary: number;
  proceeds: number; // selected entry type
  moicPrimary: number;
  moicSecondary: number;
  moic: number;
  irrPrimary: number;
  irrSecondary: number;
  irr: number;
  targetMoic: number;
  maxPrePrimary: number;
  maxEntrySecondary: number;
  maxEntry: number; // selected entry type
  discountPrimary: number;
  discount: number; // selected entry type, vs modeled pre-money
  meetsHurdle: boolean; // selected entry type
  weightedProceeds: number; // probability * proceeds (selected entry type)
}

export interface CompanyResult {
  forecasts: Record<CaseId, Forecast>;
  returns: Record<CaseId, CaseReturns>;
  weightedProceeds: number;
  weightedIrr: number; // IRR of probability-weighted proceeds
  gate: "PASSES SCREEN" | "REPRICE / WATCH";
}

export interface ModelResult {
  entry: EntryType;
  probabilitySum: number;
  companies: Record<CompanyId, CompanyResult>;
}
