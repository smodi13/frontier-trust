import wb from "@/data/workbook.json";
import type { CompanyId, CompanyInputs, ModelInputs } from "./types";

/** Sourced + analyst inputs come straight from the workbook extract (src/data/workbook.json). */
const hist = (company: string, measure: string): number => {
  const row = wb.historical.find((h) => h.company === company && h.measure === measure);
  if (!row || typeof row.value !== "number") throw new Error(`Missing sourced input: ${company} / ${measure}`);
  return row.value;
};

const build = (name: "Vanta" | "Chainguard", startArr: number): CompanyInputs => ({
  startArr,
  ...wb.companies[name],
  scenarios: wb.scenarios[name],
});

export const DEFAULT_INPUTS: ModelInputs = {
  checkSize: wb.globals.checkSize,
  hurdle: wb.globals.hurdle,
  holdYears: wb.globals.holdYears,
  probabilities: wb.globals.probabilities,
  companies: {
    vanta: build("Vanta", hist("Vanta", "2026 ARR run-rate")),
    chainguard: build("Chainguard", hist("Chainguard", "June 2026 ARR run-rate")),
  },
};

export const getDefaults = (): ModelInputs => structuredClone(DEFAULT_INPUTS);

/** Structural constants: the workbook's snapshot year and forecast length, and its sensitivity grid axes. */
export const BASE_YEAR = 2026;
export const FORECAST_YEARS = 5;
export const SENS_GROWTH_SHIFTS = [-0.1, -0.05, 0, 0.05, 0.1];
export const SENS_EXIT_MULTIPLES = [5, 7, 9, 11, 13];
export const SENS_TARGET_IRRS = [0.15, 0.2, 0.25, 0.3, 0.35];

export const COMPANY_LABEL: Record<CompanyId, string> = { vanta: "Vanta", chainguard: "Chainguard" };
