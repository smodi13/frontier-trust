export interface Limit { min: number; max: number; step: number }
/** Constraints for editable controls. Bounds are UI/validation guard rails, not financial assumptions. */
export const LIMITS = {
  checkSize: { min: 10, max: 1000, step: 5 },
  hurdle: { min: 0.05, max: 0.6, step: 0.005 },
  holdYears: { min: 1, max: 10, step: 1 },
  probability: { min: 0, max: 1, step: 0.05 },
  entryPreMoney: { min: 100, max: 20000, step: 50 },
  dilution: { min: 0, max: 0.6, step: 0.01 },
  revenueRecognition: { min: 0.5, max: 1, step: 0.01 },
  grossMargin: { min: 0.3, max: 1, step: 0.01 },
  costRatio: { min: 0, max: 1, step: 0.01 },
  costStep: { min: 0, max: 0.1, step: 0.005 },
  daPct: { min: 0, max: 0.2, step: 0.005 },
  capexPct: { min: 0, max: 0.2, step: 0.005 },
  nwcPct: { min: 0, max: 0.2, step: 0.005 },
  taxRate: { min: 0, max: 0.5, step: 0.01 },
  growth2027: { min: 0, max: 1.5, step: 0.01 },
  decay: { min: 0, max: 0.2, step: 0.005 },
  exitMultiple: { min: 0.5, max: 30, step: 0.5 },
  exitNetDebt: { min: -2000, max: 3000, step: 25 },
} as const satisfies Record<string, Limit>;
export type LimitKey = keyof typeof LIMITS;

export const clamp = (v: number, { min, max }: Limit) => Math.min(max, Math.max(min, v));
