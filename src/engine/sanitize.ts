import { getDefaults } from "./defaults";
import { clamp, LIMITS, type LimitKey } from "./limits";
import { CASE_IDS, COMPANY_IDS, type ModelInputs } from "./types";

const num = (raw: unknown, fallback: number, key: LimitKey) =>
  typeof raw === "number" && Number.isFinite(raw) ? clamp(raw, LIMITS[key]) : fallback;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

const COMPANY_KEYS: Record<string, LimitKey> = {
  entryPreMoney: "entryPreMoney", dilution: "dilution", revenueRecognition: "revenueRecognition",
  grossMargin: "grossMargin", smStart: "costRatio", rdStart: "costRatio", gaStart: "costRatio",
  smStep: "costStep", rdStep: "costStep", gaStep: "costStep", daPct: "daPct", capexPct: "capexPct",
  nwcPct: "nwcPct", taxRate: "taxRate",
};

/** Merge untrusted stored state onto workbook defaults. Invalid/missing fields fall back to defaults —
 * never to invented values. The sourced 2026 ARR snapshot is never overridable. */
export function sanitizeInputs(raw: unknown): ModelInputs {
  const d = getDefaults();
  const r = obj(raw);
  d.checkSize = num(r.checkSize, d.checkSize, "checkSize");
  d.hurdle = num(r.hurdle, d.hurdle, "hurdle");
  d.holdYears = Math.round(num(r.holdYears, d.holdYears, "holdYears"));
  const p = obj(r.probabilities);
  for (const k of CASE_IDS) d.probabilities[k] = num(p[k], d.probabilities[k], "probability");
  const cs = obj(r.companies);
  for (const id of COMPANY_IDS) {
    const c = d.companies[id];
    const rc = obj(cs[id]);
    for (const [field, limit] of Object.entries(COMPANY_KEYS)) {
      (c as unknown as Record<string, number>)[field] = num(rc[field], (c as unknown as Record<string, number>)[field], limit);
    }
    const sc = obj(rc.scenarios);
    for (const k of CASE_IDS) {
      const rs = obj(sc[k]);
      const s = c.scenarios[k];
      s.growth2027 = num(rs.growth2027, s.growth2027, "growth2027");
      s.decay = num(rs.decay, s.decay, "decay");
      s.exitMultiple = num(rs.exitMultiple, s.exitMultiple, "exitMultiple");
      s.exitNetDebt = num(rs.exitNetDebt, s.exitNetDebt, "exitNetDebt");
    }
  }
  return d;
}
