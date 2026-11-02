import { HISTORICAL, SOURCE_BY_ID } from "./sources";

export const EVENT_CATEGORIES = [
  "ARR milestone", "Capital raising", "Valuation mark", "Competitive development", "Product announcement", "Customer reference",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export const COMPANY_FILTERS = ["Vanta", "Chainguard", "Docker", "Market"] as const;

export interface MonitorEvent {
  id: string;
  company: string;
  category: EventCategory;
  /** Date as provided by the source; partial/undated values are kept verbatim. */
  dateLabel: string;
  sortKey: string;
  headline: string;
  origin: "register" | "user";
  sourceId?: string;
  userUrl?: string;
  addedAt?: string; // ISO timestamp, user entries only
}

const src = (id: string) => SOURCE_BY_ID[id];
const ev = (id: string, company: string, category: EventCategory, sourceId: string, headline?: string, dateOverride?: string): MonitorEvent => {
  const s = src(sourceId);
  const dateLabel = dateOverride ?? s.date;
  return { id, company, category, dateLabel, sortKey: /^\d{4}-\d{2}(-\d{2})?/.test(dateLabel) ? dateLabel.slice(0, 10) : "2026-11-02", headline: headline ?? s.establishes, origin: "register", sourceId };
};
const hv = (company: string, measure: string) => HISTORICAL.find((h) => h.company === company && h.measure === measure)!;
const arr = (id: string, company: string, measure: string): MonitorEvent => {
  const h = hv(company, measure);
  return { id, company, category: "ARR milestone", dateLabel: h.date, sortKey: h.date.slice(0, 10), headline: `${h.measure}: $${h.value}M — ${h.interpretation}`, origin: "register", sourceId: h.sourceId };
};

/** Only facts already in the workbook's Sources / Historical Inputs sheets. */
export const SEEDED_EVENTS: MonitorEvent[] = [
  arr("e-ch-arr-2025", "Chainguard", "2025 disclosed ARR"),
  ev("e-ch-d", "Chainguard", "Capital raising", "S07"),
  ev("e-ch-cust", "Chainguard", "Customer reference", "S17", "150+ customers disclosed in a press interview; cohort data unavailable"),
  ev("e-va-d", "Vanta", "Capital raising", "S03"),
  ev("e-ch-fin", "Chainguard", "Capital raising", "S09"),
  ev("e-dk-free", "Docker", "Competitive development", "S11"),
  arr("e-va-arr-2025", "Vanta", "2025 YE ARR"),
  arr("e-va-arr-2026", "Vanta", "2026 ARR run-rate"),
  ev("e-va-cust", "Vanta", "Customer reference", "S02", "16,000 customers reported (unsegmented count)"),
  ev("e-va-forrester", "Vanta", "Competitive development", "S05"),
  arr("e-ch-arr-2026", "Chainguard", "June 2026 ARR run-rate"),
  ev("e-ch-prod", "Chainguard", "Product announcement", "S18"),
  ev("e-ch-canva", "Chainguard", "Customer reference", "S10", "Canva customer case study (vendor-published)", "Undated; viewed 2026-11-02"),
  ev("e-ch-gcp", "Chainguard", "Customer reference", "S15", "Google Cloud customer review of Chainguard", "Viewed 2026-11-02"),
  ev("e-va-prod", "Vanta", "Product announcement", "S16", "GRC product page: continuous controls monitoring and workflows (vendor perspective)", "Viewed 2026-11-02"),
  ev("e-dk-docs", "Docker", "Product announcement", "S12", "Docker hardened-image tiers documented: Free, Select and Enterprise", "Viewed 2026-11-02"),
  ev("e-ch-price", "Chainguard", "Product announcement", "S13", "Chainguard pricing page: based on engineering team size and multiple products", "Viewed 2026-11-02"),
].sort((a, b) => a.sortKey.localeCompare(b.sortKey) || a.id.localeCompare(b.id));

export interface Watch { company: string; item: string; why: string; sourceId: string }
/** Forward-looking items from the workbook Risk Register / memo scorecard. These are NOT events. */
export const WATCHLIST: Watch[] = [
  { company: "Vanta", item: "Live financing round or firm secondary indication, with full term sheet", why: "Replaces the July 2025 mark with a dated price (register: entry price).", sourceId: "S03" },
  { company: "Vanta", item: "Signed ARR bridge, cohort NRR/GRR and billing-to-revenue tie", why: "Gate for any proposal (register: revenue quality).", sourceId: "S02" },
  { company: "Vanta", item: "Segmented ARR by customer size, product and geography", why: "Tests the enterprise cross-sell assumption.", sourceId: "S16" },
  { company: "Chainguard", item: "Company confirmation of ARR against the Sacra estimate", why: "Do not underwrite until confirmed (register: data quality).", sourceId: "S08" },
  { company: "Chainguard", item: "Terms and outstanding balance of the 2025 growth financing", why: "Determines senior claims ahead of equity (register: financing structure).", sourceId: "S09" },
  { company: "Chainguard", item: "Docker tier or pricing changes and observed win/loss against free hardened images", why: "Directly affects price premium and exit multiple.", sourceId: "S11" },
  { company: "Both", item: "Fully diluted capitalization and preference waterfall", why: "Blocks a final recommendation if unknown (register: cap table).", sourceId: "S03" },
];

export const SCORECARD: [string, string][] = [
  ["ARR, GRR, NRR and churn by cohort", "Separate new logos from real durable expansion"],
  ["Cash burn, runway and committed facilities", "Prevent hidden dependence on follow-on financing"],
  ["Gross margin, sales efficiency and FCF bridge", "Test operating leverage rather than revenue alone"],
  ["Enterprise ACV and win/loss vs named rivals", "Validate pricing power and wedge durability"],
  ["Debt, prefs, option pool and ownership", "Refresh risk of dilution and exit value leakage"],
  ["Security incidents and trust disclosures", "Track catastrophic franchise risk"],
];

// --- user-entered (local, hypothetical) entries -------------------------------------------------
export const USER_KEY = "frontier-trust:monitoring:v1";
const isCat = (x: unknown): x is EventCategory => EVENT_CATEGORIES.includes(x as EventCategory);
const safeUrl = (u: unknown) => {
  if (typeof u !== "string" || !u.trim()) return undefined;
  try { const p = new URL(u.trim()); return p.protocol === "https:" || p.protocol === "http:" ? p.href : undefined; } catch { return undefined; }
};
export function sanitizeUserEvents(raw: unknown): MonitorEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r): MonitorEvent[] => {
    const o = (r ?? {}) as Record<string, unknown>;
    if (typeof o.id !== "string" || typeof o.headline !== "string" || !o.headline.trim() || typeof o.dateLabel !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(o.dateLabel) || !isCat(o.category) || typeof o.company !== "string") return [];
    return [{
      id: o.id, company: (o.company as string).slice(0, 40), category: o.category, dateLabel: o.dateLabel, sortKey: o.dateLabel,
      headline: o.headline.trim().slice(0, 300), origin: "user", userUrl: safeUrl(o.userUrl), addedAt: typeof o.addedAt === "string" ? o.addedAt : undefined,
    }];
  });
}
