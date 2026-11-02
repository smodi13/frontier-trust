const MINUS = "-";
const ok = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);
/** Strip binary-float noise (e.g. 1105.6499999999999) before rounding so display matches the workbook. */
const settle = (v: number) => Number(v.toPrecision(12));
const clean = (v0: number, dp: number) => { const v = settle(v0); return Math.abs(v) < 0.5 * 10 ** -dp ? 0 : v; }; // avoid "-0.0"

export const fmtPct = (v: number | null | undefined, dp = 1) =>
  !ok(v) ? "n/a" : `${clean(v * 100, dp) < 0 ? MINUS : ""}${Math.abs(clean(v * 100, dp)).toFixed(dp)}%`;
export const fmtX = (v: number | null | undefined, dp = 2) => (!ok(v) ? "n/a" : `${v.toFixed(dp)}x`);
export const fmtNum = (v: number | null | undefined, dp = 0) =>
  !ok(v) ? "n/a" : clean(v, dp).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** $M amounts; accounting-style parentheses for negatives. `compact` shows $B at >= $1,000M. */
export function fmtUsd(vM: number | null | undefined, opts: { dp?: number; compact?: boolean } = {}) {
  if (!ok(vM)) return "n/a";
  const { dp = 1, compact = false } = opts;
  const abs = Math.abs(settle(vM));
  const body = compact && abs >= 1000 ? `$${settle(abs / 1000).toFixed(2)}B` : `$${abs.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp })}M`;
  return clean(vM, compact && abs >= 1000 ? 5 : dp) < 0 ? `(${body})` : body;
}
export const isNeg = (v: number | null | undefined) => ok(v) && v < 0;
