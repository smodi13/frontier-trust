import { caseReturns, irrFromMoic } from "./returns";
import type { CompanyId, ModelInputs, Forecast } from "./types";
import { buildForecast } from "./forecast";
import { horizon } from "./returns";

/** Public-market peer: sourced EV and TTM revenue are inputs; every ratio and statistic is calculated here. */
export interface Peer { ev: number; ttmRevenue: number; core: boolean; outlier: boolean }

/** Workbook: IFERROR(EV / TTM sales, 0). */
export const peerMultiple = (p: Pick<Peer, "ev" | "ttmRevenue">) => (p.ttmRevenue ? p.ev / p.ttmRevenue : 0);

export const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export interface PeerStats { all: number; exOutlier: number; core: number; low: number; high: number; mean: number; count: number; coreCount: number }
export function peerStats(peers: Peer[]): PeerStats {
  const m = peers.map(peerMultiple);
  const sel = (f: (p: Peer) => boolean) => peers.flatMap((p, i) => (f(p) ? [m[i]] : []));
  return {
    all: median(m), exOutlier: median(sel((p) => !p.outlier)), core: median(sel((p) => p.core)),
    low: m.length ? Math.min(...m) : 0, high: m.length ? Math.max(...m) : 0,
    mean: m.length ? m.reduce((a, b) => a + b, 0) / m.length : 0, count: m.length, coreCount: sel((p) => p.core).length,
  };
}

/** Raw price / ARR quotient (workbook IFERROR(price/ARR, 0)). A quotient, not an exit multiple. */
export const rawQuotient = (price: number, arr: number) => (arr ? price / arr : 0);

export interface ReverseUnderwriting {
  exitYear: number; arrAnchor: number; exitArr: number; exitMultiple: number; peerMedian: number; peerLessModeled: number;
  preMoney: number; check: number; stake: number; netDebt: number; targetMoic: number;
  reqExitEquity: number; reqExitEv: number; reqEvArr: number; reqArr: number; addArr: number;
  peerExitEquity: number; peerMoic: number; peerIrr: number; peerMaxPre: number;
  baseIrr: number; origMaxPre: number; discount: number; fcf: number | null; fcfMargin: number | null;
}

/** Workbook "Exit Multiple Review": solve for the exit multiple / ARR that delivers the hurdle IRR, and re-run the base case
 * at the public-peer median EV/TTM-revenue. Entry is primary; all other inputs come from the live model state. */
export function reverseUnderwrite(inp: ModelInputs, id: CompanyId, peerMedian: number, f?: Forecast): ReverseUnderwriting {
  const c = inp.companies[id];
  const fc = f ?? buildForecast(c, c.scenarios.base, horizon(inp.holdYears));
  const r = caseReturns(inp, c, fc, "base", "primary");
  const check = inp.checkSize;
  const stake = r.exitOwnership; // initial primary ownership × (1 − dilution)
  const reqExitEquity = stake ? (check * r.targetMoic) / stake : 0;
  const reqExitEv = reqExitEquity + r.exitNetDebt;
  const peerExitEquity = Math.max(0, r.exitArr * peerMedian - r.exitNetDebt);
  const peerMoic = check ? (peerExitEquity * stake) / check : 0;
  const t = inp.holdYears;
  return {
    exitYear: r.exitYear, arrAnchor: c.startArr, exitArr: r.exitArr, exitMultiple: r.exitMultiple, peerMedian, peerLessModeled: peerMedian - r.exitMultiple,
    preMoney: r.preMoney, check, stake, netDebt: r.exitNetDebt, targetMoic: r.targetMoic,
    reqExitEquity, reqExitEv,
    reqEvArr: r.exitArr ? reqExitEv / r.exitArr : 0,
    reqArr: r.exitMultiple ? reqExitEv / r.exitMultiple : 0,
    addArr: (r.exitMultiple ? reqExitEv / r.exitMultiple : 0) - r.exitArr,
    peerExitEquity, peerMoic, peerIrr: peerMoic > 0 ? irrFromMoic(peerMoic, t) : -1,
    peerMaxPre: Math.max(0, (peerExitEquity * (1 - c.dilution)) / r.targetMoic - check),
    baseIrr: r.irrPrimary, origMaxPre: r.maxPrePrimary, discount: r.discountPrimary,
    fcf: fc.fcf[t], fcfMargin: fc.fcfMargin[t],
  };
}
