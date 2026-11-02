import { BASE_YEAR, FORECAST_YEARS } from "./defaults";
import type { CompanyInputs, Forecast, ScenarioDrivers } from "./types";

/** Annual ARR growth for forecast year i (0 = first forecast year): MAX(0, g0 + shift - decay*i). */
export const growthAt = (s: ScenarioDrivers, i: number, shift = 0) => Math.max(0, s.growth2027 + shift - s.decay * i);

/** ARR at the end of year `years` (1-based) from the snapshot. */
export const arrAfter = (startArr: number, s: ScenarioDrivers, years: number, shift = 0) => {
  let arr = startArr;
  for (let i = 0; i < years; i++) arr *= 1 + growthAt(s, i, shift);
  return arr;
};

/** Mirrors the workbook's Vanta/Chainguard Forecast sheets. `years` defaults to the workbook's five. */
export function buildForecast(c: CompanyInputs, s: ScenarioDrivers, years = FORECAST_YEARS): Forecast {
  const n = Math.max(years, 1);
  const f: Forecast = {
    years: [], arr: [c.startArr], growth: [null], revenue: [c.startArr * c.revenueRecognition],
    grossProfit: [null], sm: [null], rd: [null], ga: [null], ebitda: [null], da: [null], ebit: [null],
    tax: [null], capex: [null], nwc: [null], fcf: [null], fcfMargin: [null],
  };
  f.years.push(BASE_YEAR);
  for (let i = 0; i < n; i++) {
    const g = growthAt(s, i);
    const arr = f.arr[i] * (1 + g);
    const revenue = arr * c.revenueRecognition;
    const grossProfit = revenue * c.grossMargin;
    const sm = -revenue * Math.max(0, c.smStart - c.smStep * i);
    const rd = -revenue * Math.max(0, c.rdStart - c.rdStep * i);
    const ga = -revenue * Math.max(0, c.gaStart - c.gaStep * i);
    const ebitda = grossProfit + sm + rd + ga;
    const da = -revenue * c.daPct;
    const ebit = ebitda + da;
    const tax = -Math.max(0, ebit) * c.taxRate;
    const capex = -revenue * c.capexPct;
    const nwc = -Math.max(0, revenue - f.revenue[i]) * c.nwcPct;
    const fcf = ebit + tax + capex + nwc - da; // D&A is a non-cash add-back
    f.years.push(BASE_YEAR + i + 1);
    f.arr.push(arr); f.growth.push(g); f.revenue.push(revenue); f.grossProfit.push(grossProfit);
    f.sm.push(sm); f.rd.push(rd); f.ga.push(ga); f.ebitda.push(ebitda); f.da.push(da); f.ebit.push(ebit);
    f.tax.push(tax); f.capex.push(capex); f.nwc.push(nwc); f.fcf.push(fcf);
    f.fcfMargin.push(revenue ? fcf / revenue : 0);
  }
  return f;
}
