import { arrAfter } from "./forecast";
import { entryEquity, exitEquityValue, irrFromMoic } from "./returns";
import type { CaseId, CompanyInputs, EntryType, ModelInputs } from "./types";

/** Re-underwrites ARR, exit equity and ownership for each cell (workbook 'Valuation Matrix' logic).
 * Rows = exit EV/ARR, columns = additive shift to the first-year growth rate (decay unchanged). */
export function irrGrid(inp: ModelInputs, c: CompanyInputs, caseId: CaseId, entry: EntryType, multiples: number[], shifts: number[]) {
  const s = c.scenarios[caseId];
  const eqEntry = entryEquity(c.entryPreMoney, inp.checkSize, entry);
  return multiples.map((m) =>
    shifts.map((sh) => {
      const exitEq = exitEquityValue(arrAfter(c.startArr, s, inp.holdYears, sh) * m, s.exitNetDebt);
      return irrFromMoic(eqEntry ? (exitEq * (1 - c.dilution)) / eqEntry : 0, inp.holdYears);
    }),
  );
}

/** Maximum entry value (primary: pre-money; secondary: purchase price) vs required IRR and exit multiple. */
export function maxEntryGrid(inp: ModelInputs, c: CompanyInputs, caseId: CaseId, entry: EntryType, multiples: number[], irrs: number[]) {
  const s = c.scenarios[caseId];
  const exitArr = arrAfter(c.startArr, s, inp.holdYears);
  return multiples.map((m) =>
    irrs.map((r) => {
      const value = (exitEquityValue(exitArr * m, s.exitNetDebt) * (1 - c.dilution)) / (1 + r) ** inp.holdYears;
      return Math.max(0, entry === "primary" ? value - inp.checkSize : value);
    }),
  );
}
