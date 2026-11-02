import raw from "./valuation.json";
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
