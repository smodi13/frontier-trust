import { buildForecast } from "./forecast";
import {
  CASE_IDS, COMPANY_IDS,
  type CaseId, type CaseReturns, type CompanyId, type CompanyInputs, type EntryType, type Forecast,
  type ModelInputs, type ModelResult,
} from "./types";
import { FORECAST_YEARS } from "./defaults";

const div = (a: number, b: number) => (b ? a / b : 0);
/** MOIC^(1/years) - 1, with the workbook's IFERROR(...,-1) behaviour. */
export const irrFromMoic = (moic: number, years: number) => {
  const r = moic ** (1 / years) - 1;
  return Number.isFinite(r) ? r : -1;
};
export const targetMoic = (hurdle: number, years: number) => (1 + hurdle) ** years;
export const exitEquityValue = (exitEv: number, netDebt: number) => Math.max(0, exitEv - netDebt);
export const horizon = (holdYears: number) => Math.max(FORECAST_YEARS, holdYears);

/** Entry equity value the check is measured against: primary = post-money, secondary = pre-money (existing equity). */
export const entryEquity = (pre: number, check: number, entry: EntryType) => (entry === "primary" ? pre + check : pre);

export function caseReturns(
  inp: ModelInputs, c: CompanyInputs, f: Forecast, caseId: CaseId, entry: EntryType,
): CaseReturns {
  const s = c.scenarios[caseId];
  const { checkSize: check, holdYears: hold, hurdle } = inp;
  const postMoney = c.entryPreMoney + check;
  const ownershipPrimary = div(check, postMoney);
  const ownershipSecondary = div(check, c.entryPreMoney);
  const exitArr = f.arr[hold];
  const exitEv = exitArr * s.exitMultiple;
  const exitEquity = exitEquityValue(exitEv, s.exitNetDebt);
  const retained = 1 - c.dilution;
  const proceedsPrimary = exitEquity * ownershipPrimary * retained;
  const proceedsSecondary = exitEquity * ownershipSecondary * retained;
  const moicPrimary = div(proceedsPrimary, check);
  const moicSecondary = div(proceedsSecondary, check);
  const irrPrimary = irrFromMoic(moicPrimary, hold);
  const irrSecondary = irrFromMoic(moicSecondary, hold);
  const tMoic = targetMoic(hurdle, hold);
  const maxEntrySecondary = Math.max(0, (exitEquity * retained) / tMoic);
  const maxPrePrimary = Math.max(0, (exitEquity * retained) / tMoic - check);
  const isP = entry === "primary";
  const irr = isP ? irrPrimary : irrSecondary;
  const proceeds = isP ? proceedsPrimary : proceedsSecondary;
  const probability = inp.probabilities[caseId];
  const initialOwnership = isP ? ownershipPrimary : ownershipSecondary;
  const maxEntry = isP ? maxPrePrimary : maxEntrySecondary;
  return {
    probability, startArr: c.startArr, preMoney: c.entryPreMoney, check, postMoney,
    ownershipPrimary, ownershipSecondary, initialOwnership, dilution: c.dilution,
    exitOwnership: initialOwnership * retained, exitYear: f.years[hold], exitArr,
    exitMultiple: s.exitMultiple, exitEv, exitNetDebt: s.exitNetDebt, exitEquity,
    proceedsPrimary, proceedsSecondary, proceeds,
    moicPrimary, moicSecondary, moic: isP ? moicPrimary : moicSecondary,
    irrPrimary, irrSecondary, irr, targetMoic: tMoic, maxPrePrimary, maxEntrySecondary, maxEntry,
    discountPrimary: c.entryPreMoney ? 1 - maxPrePrimary / c.entryPreMoney : 0,
    discount: c.entryPreMoney ? 1 - maxEntry / c.entryPreMoney : 0,
    meetsHurdle: irr >= hurdle,
    weightedProceeds: proceeds * probability,
  };
}

export function evaluate(inp: ModelInputs, entry: EntryType = "primary"): ModelResult {
  const companies = {} as ModelResult["companies"];
  for (const id of COMPANY_IDS) {
    const c = inp.companies[id];
    const forecasts = {} as Record<CaseId, Forecast>;
    const returns = {} as Record<CaseId, CaseReturns>;
    for (const k of CASE_IDS) {
      forecasts[k] = buildForecast(c, c.scenarios[k], horizon(inp.holdYears));
      returns[k] = caseReturns(inp, c, forecasts[k], k, entry);
    }
    const weightedProceeds = CASE_IDS.reduce((a, k) => a + returns[k].weightedProceeds, 0);
    const weightedIrr = irrFromMoic(div(weightedProceeds, inp.checkSize), inp.holdYears);
    companies[id as CompanyId] = {
      forecasts, returns, weightedProceeds, weightedIrr,
      gate: returns.base.meetsHurdle ? "PASSES SCREEN" : "REPRICE / WATCH",
    };
  }
  return {
    entry, companies,
    probabilitySum: CASE_IDS.reduce((a, k) => a + inp.probabilities[k], 0),
  };
}
