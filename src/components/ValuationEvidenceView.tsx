"use client";
import Link from "next/link";
import { DOWNLOADS, downloadHref } from "@/data/downloads";
import { DEALS, PEERS, VAL_NOTES, dateGapDays, dealType } from "@/data/valuation";
import { COMPANY_IDS, COMPANY_LABEL, fmtNum, fmtPct, fmtUsd, fmtX, peerMultiple, peerStats, rawQuotient, reverseUnderwrite, type ReverseUnderwriting } from "@/engine";
import { resetModel, useModel } from "@/state/store";
import { KindBadge, Notice, Section, StaticDownloadsNotice } from "./ui";

const stats = peerStats(PEERS); // fixed 2 Nov 2026 inputs → computed here, never stored
const maxMultiple = stats.high;
const ext = DOWNLOADS.find((d) => d.extension)!;
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");

type RowDef = { label: string; note?: string; kind: "company" | "calculated" | "assumption" | "hypothetical" | "press"; label?: string; get: (r: ReverseUnderwriting) => string; neg?: (r: ReverseUnderwriting) => boolean };
const ROWS: RowDef[] = [
  { label: "Existing exit multiple (EV / ARR)", kind: "assumption", get: (r) => fmtX(r.exitMultiple, 1) },
  { label: "Required exit multiple for the target gross IRR", note: "Solved holding modeled ARR, stake, net debt and hold fixed", kind: "calculated", get: (r) => fmtX(r.reqEvArr, 2) },
  { label: "Modeled exit ARR", kind: "calculated", get: (r) => fmtUsd(r.exitArr) },
  { label: "Required ARR at the modeled exit multiple", note: "Solved holding the multiple fixed", kind: "calculated", get: (r) => fmtUsd(r.reqArr) },
  { label: "Incremental ARR required", kind: "calculated", get: (r) => fmtUsd(r.addArr), neg: (r) => r.addArr < 0 },
  { label: "Public core-peer median EV / TTM revenue", note: "Fixed 2 Nov 2026 market observation", kind: "press", label: "Third-party market data", get: (r) => fmtX(r.peerMedian, 2) },
  { label: "Peer median less modeled multiple", kind: "calculated", get: (r) => `${r.peerLessModeled >= 0 ? "+" : ""}${fmtX(r.peerLessModeled, 2)}`, neg: (r) => r.peerLessModeled < 0 },
  { label: "Gross MOIC at the peer median", kind: "calculated", get: (r) => fmtX(r.peerMoic), neg: (r) => r.peerMoic < 1 },
  { label: "Gross IRR at the peer median", kind: "calculated", get: (r) => fmtPct(r.peerIrr), neg: (r) => r.peerIrr < 0 },
  { label: "Max pre-money at the peer median", kind: "calculated", get: (r) => fmtUsd(r.peerMaxPre, { compact: true }) },
  { label: "Base-case gross IRR (original model)", kind: "calculated", get: (r) => fmtPct(r.baseIrr), neg: (r) => r.baseIrr < 0 },
  { label: "Original max pre-money at hurdle", kind: "calculated", get: (r) => fmtUsd(r.origMaxPre, { compact: true }) },
  { label: "Modeled entry pre-money", kind: "hypothetical", get: (r) => fmtUsd(r.preMoney, { compact: true }) },
  { label: "Discount required vs modeled entry", kind: "calculated", get: (r) => fmtPct(r.discount) },
  { label: "Exit-year FCF proxy", kind: "calculated", get: (r) => fmtUsd(r.fcf), neg: (r) => (r.fcf ?? 0) < 0 },
  { label: "Exit-year FCF margin proxy", kind: "calculated", get: (r) => fmtPct(r.fcfMargin), neg: (r) => (r.fcfMargin ?? 0) < 0 },
];

export function ValuationEvidenceView() {
  const { inputs, primary, modified } = useModel();
  const rev = Object.fromEntries(COMPANY_IDS.map((id) => [id, reverseUnderwrite(inputs, id, stats.core, primary.companies[id].forecasts.base)])) as Record<(typeof COMPANY_IDS)[number], ReverseUnderwriting>;
  const sorted = [...PEERS].sort((a, b) => peerMultiple(a) - peerMultiple(b));
  const hurdle = fmtPct(inputs.hurdle, (inputs.hurdle * 100) % 1 === 0 ? 0 : 1);
  const exitYear = rev.vanta.exitYear;

  return (
    <>
      <div className="mb-5"><Notice title="EV / revenue is not EV / ARR.">{VAL_NOTES.interpretation.join(" ")} Public EV / TTM revenue ratios are historical market observations; the model&apos;s exit valuation is a 2031 EV / ARR assumption. They are shown as context only and set no assumption in the model.</Notice></div>

      <Section title="1 · Public market comparables" id="comps" aside={<span className="text-[12px] text-mute">Fixed inputs · market close 2 Nov 2026 · <KindBadge kind="calculated" label="Ratios calculated" /></span>}>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[1180px]">
            <caption className="sr-only">Eight public market comparables with enterprise value, TTM revenue and calculated EV to TTM revenue</caption>
            <thead><tr><th>Company</th><th>Ticker</th><th className="r">EV ($M)</th><th className="r">TTM revenue ($M)</th><th className="r">EV / TTM revenue</th><th className="r">TTM revenue growth (YoY)</th><th>Comparison category</th><th>Median set</th><th>Observed</th><th>Evidence</th><th>Limitation</th></tr></thead>
            <tbody>
              {PEERS.map((p) => (
                <tr key={p.ticker} id={`peer-${p.ticker}`}>
                  <th scope="row" className="font-semibold text-navy">{p.company}</th><td className="font-mono">{p.ticker}</td>
                  <td className="r num">{fmtNum(p.ev)}</td><td className="r num">{fmtNum(p.ttmRevenue, 1)}</td>
                  <td className="r num font-semibold">{fmtX(peerMultiple(p), 2)}</td><td className="r num">{fmtPct(p.yoy)}</td>
                  <td>{p.role}</td>
                  <td className="text-[12px]">{p.core ? <strong className="text-teal">Core peer</strong> : <span className="text-mute">Not in core median</span>}</td>
                  <td className="num whitespace-nowrap">{p.date}</td>
                  <td className="text-[12px]">
                    <a href={p.quoteUrl} target="_blank" rel="noopener noreferrer" aria-label={`${p.company} market data source`} className="block text-teal underline">Market data ({host(p.quoteUrl)})</a>
                    <a href={p.operatingUrl} target="_blank" rel="noopener noreferrer" aria-label={`${p.company} operating evidence`} className="block text-teal underline">Operating evidence ({host(p.operatingUrl)})</a>
                  </td>
                  <td className="text-[12.5px]">{p.caveat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[12px] text-mute">EV and TTM revenue: {VAL_NOTES.inputSource} Revenue growth is the sourced TTM sales YoY figure. Peer equity valuations reflect different debt, cash, growth, FCF, dilution and company-specific risk.</p>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="card p-3" data-testid="peer-stats">
            <h3 className="mb-2 font-sans text-[14px] font-semibold">Distribution statistics <KindBadge kind="calculated" /></h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
              {([
                ["Core peer median", stats.core, "Excludes the stressed floor and the premium outlier (RPD, CRWD)"],
                ["Median, all 8", stats.all, ""],
                ["Median, excluding CrowdStrike", stats.exOutlier, ""],
                ["Low, all 8", stats.low, ""], ["High, all 8", stats.high, ""], ["Mean, all 8", stats.mean, "Skewed by the outlier"],
              ] as [string, number, string][]).map(([k, v, n]) => (
                <div key={k} className="contents"><dt className={k === "Core peer median" ? "font-semibold text-navy" : ""}>{k}{n && <span className="block text-[11px] text-mute">{n}</span>}</dt><dd className={`num text-right ${k === "Core peer median" ? "text-[18px] font-semibold text-navy" : ""}`}>{fmtX(v, 2)}</dd></div>
              ))}
            </dl>
            <p className="mt-2 text-[12px] text-mute">The core median is the reference used in the reverse-underwriting section. It is an alternative heuristic, not a forecast or a justified exit multiple.</p>
          </div>
          <div className="card p-3">
            <h3 className="mb-2 font-sans text-[14px] font-semibold">Full peer distribution (EV / TTM revenue)</h3>
            <ul className="space-y-1" aria-label="Peer multiples from lowest to highest">
              {sorted.map((p) => (
                <li key={p.ticker} className="flex items-center gap-2 text-[12.5px]">
                  <span className="w-24 shrink-0 truncate">{p.company}</span>
                  <span className="h-3 flex-1 rounded-sm bg-slate-100"><span className={`block h-3 rounded-sm ${p.core ? "bg-teal" : "bg-slate-400"}`} style={{ width: `${(peerMultiple(p) / maxMultiple) * 100}%` }} /></span>
                  <span className="num w-14 text-right">{fmtX(peerMultiple(p), 1)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] text-mute"><span className="inline-block h-2 w-2 bg-teal align-middle" /> core peer · <span className="inline-block h-2 w-2 bg-slate-400 align-middle" /> outside the core median</p>
          </div>
        </div>
      </Section>

      <Section title="2 · Private transaction signals" id="deals" aside={<span className="text-[12px] text-mute">Historical only · price and ARR dates shown separately</span>}>
        <div className="mb-2"><Notice title="Raw quotients are not exit multiples.">{VAL_NOTES.dealsSubtitle}</Notice></div>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[1100px]">
            <caption className="sr-only">Private transaction signals with price dates, ARR evidence dates and raw quotients</caption>
            <thead><tr><th>Target</th><th>Transaction</th><th>Price type</th><th className="r">Price / valuation ($M)</th><th>Price date</th><th className="r">ARR reference ($M)</th><th>ARR evidence date</th><th>Date alignment</th><th className="r">Raw quotient (not a multiple)</th><th>Validity / qualification</th><th>Sources</th></tr></thead>
            <tbody>
              {DEALS.map((d) => {
                const gap = dateGapDays(d.priceDate, d.arrDate);
                return (
                  <tr key={d.transaction}>
                    <th scope="row" className="font-semibold text-navy">{d.target}</th><td>{d.transaction}</td>
                    <td className="text-[12.5px]">{dealType(d.transaction)}</td>
                    <td className="r num">{fmtNum(d.price)}</td><td className="num whitespace-nowrap">{d.priceDate}</td>
                    <td className="r num">{fmtNum(d.arr)}</td><td className="whitespace-nowrap">{d.arrDate}</td>
                    <td className="text-[12.5px]">{gap === null ? <strong className="text-warn-ink">Not like-for-like (ARR date not an exact day)</strong> : gap === 0 ? "Same day" : <strong className="text-warn-ink">Mismatch: ARR evidence {gap} days after price</strong>}</td>
                    <td className="r num text-mute">{fmtX(rawQuotient(d.price, d.arr), 2)}</td>
                    <td className="text-[12.5px] font-medium">{d.validity}</td>
                    <td className="text-[12px]">
                      <a href={d.priceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${d.transaction}: price source`} className="block text-teal underline">Price ({host(d.priceUrl)})</a>
                      {d.arrUrl !== d.priceUrl && <a href={d.arrUrl} target="_blank" rel="noopener noreferrer" aria-label={`${d.transaction}: ARR source`} className="block text-teal underline">ARR ({host(d.arrUrl)})</a>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] text-slate">{VAL_NOTES.dealCautions.map((c) => <li key={c}>{c}</li>)}</ul>
        <p className="mt-1 text-[12px] text-mute">Equity-financing valuations are shown separately from the acquisition price; neither is an enterprise value or an exit multiple. Security rights and capital structure are unknown. No private signal sets the model&apos;s exit multiple.</p>
      </Section>

      <Section title="3 · Reverse underwriting" id="reverse" aside={<KindBadge kind="calculated" label="Live from engine" />}>
        <p className="mb-2 max-w-3xl text-[13.5px]">What exit multiple, or what ARR, would the base case need to reach the {hurdle} gross IRR hurdle over {inputs.holdYears} years, and how do the base case and the public peer median compare? Rows recalculate when you edit assumptions on the{" "}
          <Link href="/underwriting" className="text-teal underline">Underwriting</Link> or <Link href="/allocation" className="text-teal underline">Allocation</Link> pages; public peer inputs stay fixed at 2 Nov 2026.</p>
        {modified && <div className="mb-2"><Notice title="Assumptions modified.">Figures reflect your edits. <button className="font-semibold underline" onClick={resetModel}>Reset to original</button></Notice></div>}
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[620px]">
            <caption className="sr-only">Reverse underwriting for Vanta and Chainguard, base case</caption>
            <thead><tr><th>Metric (base case, {exitYear} exit)</th><th>Provenance</th>{COMPANY_IDS.map((id) => <th key={id} className="r">{COMPANY_LABEL[id]}</th>)}</tr></thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="font-normal">{row.label}{row.note && <span className="block text-[11.5px] text-mute">{row.note}</span>}</th>
                  <td><KindBadge kind={row.kind} label={row.label} /></td>
                  {COMPANY_IDS.map((id) => <td key={id} className={`r num ${row.neg?.(rev[id]) ? "neg" : ""}`}>{row.get(rev[id])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px] text-slate">{VAL_NOTES.reverseNotes.map((n) => <li key={n}>{n}</li>)}</ul>
        <div className="mt-3"><Notice title="Investment conclusion unchanged.">This section does not change the entry prices, growth, exit multiples, net debt, dilution or the committee recommendation. A required multiple above the modeled multiple is a price-discipline signal, not evidence that either company is worth more or less.</Notice></div>
      </Section>

      <Section title="Research extension workbook" id="download">
        <div className="mb-3"><StaticDownloadsNotice modified={modified} /></div>
        <div className="card p-3">
          <p className="font-semibold text-navy">{ext.title}</p>
          <p className="text-[12.5px] text-mute">{ext.description} · {kb(ext.bytes)}</p>
          <p className="mt-1 break-all font-mono text-[10.5px] text-mute">sha256 {ext.sha256}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <a href={downloadHref(ext.file)} download className="rounded bg-navy px-3 py-1.5 text-[13px] font-medium text-white">Download extension workbook (XLSX)</a>
            <Link href="/evidence#downloads" className="text-[13px] text-teal underline">All original documents, including the original workbook</Link>
          </div>
        </div>
      </Section>
    </>
  );
}
