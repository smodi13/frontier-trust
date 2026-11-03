import raw from "./valuation.json";
import vsrc from "./valuation-sources.json";
import { ALL_SOURCES } from "./sources";
import type { Peer } from "@/engine";

/** Fixed public-market inputs observed 2 Nov 2026 (workbook "Public Market Comps"). Not live data. */
export interface PeerRecord extends Peer {
  company: string; ticker: string; yoy: number; role: string; date: string; quoteUrl: string; operatingUrl: string; definition: string; caveat: string;
}
export const PEERS = raw.peers as PeerRecord[];
export interface DealSignal { target: string; transaction: string; price: number; arr: number; arrDate: string; priceDate: string; validity: string; priceUrl: string; arrUrl: string }
export const DEALS = raw.deals as DealSignal[];
export const VAL_NOTES = raw.notes;

/** Descriptive security type of the price, derived from the workbook's transaction text. */
export const dealType = (t: string) =>
  /post-money|series|equity/i.test(t) ? "Equity financing valuation (post-money)" : /purchase price|acquisition/i.test(t) ? "Acquisition price (M&A)" : "Unclassified";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
/** Days between price date and ARR evidence date; null when either date is not an exact day. */
export const dateGapDays = (a: string, b: string) => (ISO.test(a) && ISO.test(b) ? Math.round((Date.parse(b) - Date.parse(a)) / 864e5) : null);

/** V-series evidence register for the valuation extension (separate from S01–S18 and X01–X03). */
export interface ValuationSource {
  id: string; company: string; ticker: string | null; role: string; title: string; titleBasis: "url" | "description"; metric: string; organization: string;
  reportingPeriod: string | null; publicationDate: string | null; publicationDateBasis?: string; observationDate: string | null; url: string; classification: string; limitations: string;
}
export const VALUATION_SOURCES = vsrc as ValuationSource[];
export const VAL_SOURCE_BY_ID = Object.fromEntries(VALUATION_SOURCES.map((v) => [v.id, v])) as Record<string, ValuationSource>;
export const NOT_ESTABLISHED = "Not established";

/** Evidence-quality grouping for filtering (descriptive, not a score); mirrors the labels used for S-records. */
export const valuationQuality = (v: ValuationSource) =>
  v.classification.startsWith("Third-party market data") ? "Third-party market data (aggregator)" : v.classification === "Press report" ? "Press report (unverified)" : "Primary — issuer / institution";

/** Citation ID for a displayed URL, searched across all registers (S, X, V). */
export const idForUrl = (url: string): string | undefined =>
  [...ALL_SOURCES.map((s) => [s.id, s.url]), ...VALUATION_SOURCES.map((v) => [v.id, v.url])].find(([, u]) => u === url)?.[0];
export const peerSourceIds = (ticker: string) => ({
  market: VALUATION_SOURCES.find((v) => v.ticker === ticker && v.role === "market-data")!.id,
  operating: VALUATION_SOURCES.find((v) => v.ticker === ticker && v.role === "operating-evidence")!.id,
});

/** Rapid7 clarification: ARR growth and TTM revenue growth are different metrics over different periods. Display only. */
export const RAPID7_ARR = { arrMillions: 824, arrYoy: -0.02, period: "Q2 2026" } as const;
export const RAPID7_CAVEAT = "Different metrics and periods, not a contradiction: Rapid7's official Q2 2026 release reported ARR of $824M, down 2.0% year over year, while the +0.1% in this row is trailing-twelve-month revenue growth from the comparable dataset. The valuation ratio uses EV / TTM revenue; ARR growth is not substituted for revenue growth. Workbook caveat (unchanged): “Negative ARR growth; include as stressed floor, not a primary high-growth anchor”.";
