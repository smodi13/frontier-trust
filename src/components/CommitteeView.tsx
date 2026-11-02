"use client";
import Link from "next/link";
import { NOTES, RISKS } from "@/data/sources";
import { CASE_IDS, COMPANY_IDS, COMPANY_LABEL, fmtPct, fmtUsd, fmtX, type CaseId } from "@/engine";
import { resetModel, useModel } from "@/state/store";
import { PriceChart } from "./Charts";
import { KindBadge, Notice, Section, SourceRefs } from "./ui";

const CASE_LABEL: Record<CaseId, string> = { bear: "Bear", base: "Base", bull: "Bull" };

const EVIDENCE: { text: string; src: string[] }[] = [
  { text: "Vanta's 2026 ARR anchor was directly disclosed by the company (Apr 2026) and the business has meaningful scale and 16,000 reported customers.", src: ["S02"] },
  { text: "Chainguard's 2026 ARR anchor is an external estimate (Sacra, Jun 2026); the last company-disclosed ARR was $40M in Apr 2025.", src: ["S07", "S08"] },
  { text: "Chainguard disclosed a $280M growth financing in Oct 2025 without instrument terms, amount outstanding or priority relative to equity.", src: ["S09"] },
  { text: "Docker made a hardened-image catalog free and open in Dec 2025, pressuring Chainguard's free-to-paid conversion and pricing.", src: ["S11", "S12"] },
  { text: "Both last equity valuations are from 2025 financings and are not November 2026 tradable prices.", src: ["S03", "S07"] },
];

const GATES: [string, string][] = [
  ["Gate 1 · Financial data room", "Monthly ARR and recognized revenue from 2024 through latest 2026, cohort NRR/GRR by vintage and enterprise tier, bookings and pipeline, gross-margin bridge by product, deferred revenue movements, cash-flow statement and a 24-month plan, reconciled independently. No recommendation without clean denominator definitions."],
  ["Gate 2 · Commercial and technical validation", "At least 10 independent buyer / lost-customer interviews per candidate and competitive win rates. Vanta: enterprise GRC and third-party-risk adoption, migration friction. Chainguard: benchmark hardened-image breadth, SLAs, FIPS variants and Docker replacement trials; validate Canva only with permission."],
  ["Gate 3 · Security, governance and legal", "Incidents, penetration tests, IP licensing exposure, regulatory claims, contractual liabilities, key-person risk and board processes. For Chainguard, the complete 2025 growth-financing documents and an outstanding senior-claim schedule."],
  ["Gate 4 · Deal terms and valuation", "Live, dated primary or secondary pricing; cap table by security class; full preferred waterfall; option refresh and follow-on dilution. Rerun all return scenarios and test downside protection."],
  ["Gate 5 · Decision evidence", "A minimum factual evidence package, allowable valuation, key operating covenants, first-100-day priorities and monitoring metrics. Do not proceed if seller price or terms cannot clear the approved return requirement after independent validation."],
];

const QUESTIONS: [string, string][] = [
  ["Both", "Can you provide a signed ARR bridge, monthly cohort NRR/GRR and a billing-to-revenue reconciliation?"],
  ["Vanta", "What share of ARR comes from enterprise or regulated customers versus startups, by product and geography, and what are renewal economics by segment?"],
  ["Vanta", "What are audited gross margin, SBC, CAC payback and cash burn, and how do cohorts' profitability compare?"],
  ["Vanta", "How do win/loss outcomes and pricing compare with named rivals in strategic enterprise accounts?"],
  ["Chainguard", "Can you provide a monthly ARR ledger, cohorts and pipeline conversion that support the third-party $100M estimate?"],
  ["Chainguard", "What are the terms, outstanding balance, covenants, seniority and redemption rights of the 2025 growth financing?"],
  ["Chainguard", "How is free-to-paid conversion and pricing holding up against Docker's free hardened-image tier, and what do win/loss calls show?"],
  ["Chainguard", "What are top-20 customer ARR, top-10 exposure and gross churn, and how does sales capacity scale beyond developer-led adoption?"],
  ["Both", "What is the fully diluted capitalization, preference waterfall, option-pool refresh and expected follow-on dilution?"],
];

const REJECT: { text: string; src: string[] }[] = [
  { text: "ARR does not reconcile to billings and recognized revenue, or retention and cohort data are weaker than headlines imply (register: STOP without reconciled SaaS KPIs).", src: ["S02"] },
  { text: "The seller's price or terms cannot clear the approved return requirement after independent validation; no evidence supports the growth, multiple, dilution or net-cash improvements needed to justify the modeled prices.", src: ["S03", "S07"] },
  { text: "Chainguard's 2025 growth financing creates senior claims that are not reserved for, or its ARR estimate is not confirmed (register: reserve or block investment approval; do not underwrite until confirmed).", src: ["S08", "S09"] },
  { text: "Cap table, preference stack, warrants or participation terms are unknown or adverse (register: block final investment recommendation).", src: ["S03"] },
  { text: "Docker's free tier or incumbent GRC vendors compress pricing and exit multiples below what the entry price requires.", src: ["S05", "S11"] },
  { text: "A material security breach or compliance failure impairs trust-based products.", src: ["S12"] },
];

export function CommitteeView() {
  const { inputs, primary, modified } = useModel();
  const { hurdle, holdYears, checkSize } = inputs;
  const hTxt = fmtPct(hurdle, (hurdle * 100) % 1 === 0 ? 0 : 1);
  const v = primary.companies.vanta, c = primary.companies.chainguard;
  const t = holdYears;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <p className="text-[12.5px] text-mute">Use your browser&apos;s print dialog and choose “Save as PDF”. Navigation and controls are hidden in print.</p>
        <button onClick={() => window.print()} className="rounded bg-navy px-3 py-1.5 text-[13px] font-medium text-white">Print / save as PDF</button>
      </div>
      <div className="mb-1 hidden print:block">
        <p className="text-[11px] font-bold uppercase tracking-widest text-teal">Frontier Trust · Investment committee working paper · research cutoff 2 Nov 2026</p>
      </div>
      {modified && (
        <div className="mb-4">
          <Notice title="Assumptions modified.">
            Figures on this page reflect edited assumptions, not the workbook. <button className="font-semibold underline print:hidden" onClick={resetModel}>Reset to original</button>
          </Notice>
        </div>
      )}

      <Section title="Investment conclusion">
        <div className="card border-l-4 border-l-navy p-4">
          <p className="font-serif text-[20px] leading-snug text-navy">PASS at the hypothetical entry prices. Prioritize Vanta for conditional diligence and reprice.</p>
          <p className="mt-2 max-w-3xl text-[14px]">
            {COMPANY_IDS.every((id) => !primary.companies[id].returns.base.meetsHurdle)
              ? `Neither opportunity clears the illustrative ${hTxt} ${t}-year gross IRR screen at the modeled entry prices of ${fmtUsd(v.returns.base.preMoney, { compact: true })} pre-money for Vanta and ${fmtUsd(c.returns.base.preMoney, { compact: true })} for Chainguard.`
              : `At the current (edited) assumptions at least one company clears the illustrative ${hTxt} screen. The workbook conclusion above no longer holds; clearing a screen is not approval.`}{" "}
            Base-case gross primary IRRs are {fmtPct(v.returns.base.irrPrimary)} (Vanta) and {fmtPct(c.returns.base.irrPrimary)} (Chainguard). The conclusion remains <strong>conditional</strong>: a positive return is not equivalent to passing the hurdle, and nothing here is a recommendation to transact.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {COMPANY_IDS.map((id) => (
              <span key={id} className="rounded border border-line px-2 py-1 text-[12.5px]"><strong>{COMPANY_LABEL[id]}</strong>: <span className={`font-semibold ${primary.companies[id].gate === "PASSES SCREEN" ? "text-teal" : "text-warn-ink"}`}>{primary.companies[id].gate}</span></span>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-mute">The {hTxt} hurdle is an analyst screening assumption, not a Teachers&apos; Venture Growth policy or disclosed requirement.</p>
        </div>
      </Section>

      <Section title="Supporting evidence">
        <ul className="card space-y-1.5 py-3 pl-8 pr-4 text-[14px] [list-style:disc]">
          {EVIDENCE.map((e) => <li key={e.text}>{e.text} <SourceRefs ids={e.src} /></li>)}
        </ul>
      </Section>

      <Section title="Comparative economics" aside={<KindBadge kind="calculated" />}>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[520px]">
            <thead><tr><th>Metric (base case)</th><th className="r">Vanta</th><th className="r">Chainguard</th></tr></thead>
            <tbody>
              {([
                ["2026 ARR anchor", (x) => fmtUsd(x.returns.base.startArr, { dp: 0 }) + (x === v ? " (company)" : " (Sacra est.)")],
                [`${v.forecasts.base.years[t]} modeled ARR`, (x) => fmtUsd(x.returns.base.exitArr)],
                [`${v.forecasts.base.years[t]} FCF proxy`, (x) => fmtUsd(x.forecasts.base.fcf[t])],
                ["Exit EV / ARR", (x) => fmtX(x.returns.base.exitMultiple, 1)],
                ["Exit equity value", (x) => fmtUsd(x.returns.base.exitEquity, { compact: true })],
                ["Assumed dilution", (x) => fmtPct(x.returns.base.dilution, 0)],
                ["Gross primary MOIC", (x) => fmtX(x.returns.base.moicPrimary)],
                ["Gross primary IRR", (x) => fmtPct(x.returns.base.irrPrimary)],
                ["Weighted proceeds → IRR", (x) => `${fmtUsd(x.weightedProceeds)} → ${fmtPct(x.weightedIrr)}`],
              ] as [string, (x: typeof v) => string][]).map(([label, fn]) => (
                <tr key={label}><th scope="row" className="font-normal">{label}</th>{[v, c].map((x, i) => { const s = fn(x); return <td key={i} className={`r num ${s.startsWith("(") || s.startsWith("-") ? "neg" : ""}`}>{s}</td>; })}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card mt-3 overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[520px]">
            <caption className="sr-only">Scenario distribution</caption>
            <thead><tr><th>Scenario · {fmtUsd(checkSize, { dp: 0 })} primary</th><th className="r">Vanta MOIC</th><th className="r">Vanta IRR</th><th className="r">Chainguard MOIC</th><th className="r">Chainguard IRR</th></tr></thead>
            <tbody>
              {CASE_IDS.map((k) => (
                <tr key={k}>
                  <th scope="row" className="font-normal">{CASE_LABEL[k]} ({fmtPct(inputs.probabilities[k], 0)})</th>
                  {[v, c].flatMap((x) => [<td key={x.returns[k].moicPrimary + "m"} className="r num">{fmtX(x.returns[k].moicPrimary)}</td>, <td key={x.returns[k].irrPrimary + "i"} className={`r num ${x.returns[k].irrPrimary < 0 ? "neg" : ""}`}>{fmtPct(x.returns[k].irrPrimary)}</td>])}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Price discipline" aside={<KindBadge kind="calculated" />}>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="card overflow-x-auto" tabIndex={0}>
            <table className="tbl">
              <thead><tr><th>Underwriting metric</th><th className="r">Vanta</th><th className="r">Chainguard</th></tr></thead>
              <tbody>
                {([
                  ["Illustrative modeled pre-money", (x) => fmtUsd(x.returns.base.preMoney, { dp: 0 })],
                  ["Base exit equity", (x) => fmtUsd(x.returns.base.exitEquity, { dp: 0 })],
                  ["Required gross MOIC at hurdle", (x) => fmtX(x.returns.base.targetMoic)],
                  ["Maximum pre-money at hurdle", (x) => fmtUsd(x.returns.base.maxPrePrimary, { dp: 0 })],
                  ["Modeled premium to limit", (x) => fmtUsd(x.returns.base.preMoney - x.returns.base.maxPrePrimary, { dp: 0 })],
                  ["Entry discount needed", (x) => fmtPct(x.returns.base.discountPrimary)],
                ] as [string, (x: typeof v) => string][]).map(([label, fn]) => (
                  <tr key={label}><th scope="row" className="font-normal">{label}</th><td className="r num">{fn(v)}</td><td className="r num">{fn(c)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card p-3"><PriceChart rows={COMPANY_IDS.map((id) => ({ name: COMPANY_LABEL[id], modeled: primary.companies[id].returns.base.preMoney, max: primary.companies[id].returns.base.maxPrePrimary }))} /></div>
        </div>
        <p className="mt-2 max-w-3xl text-[13px] text-slate">
          These limits are discipline thresholds from a model, not estimates of fair market value, and no evidence establishes that securities are available at them. A higher price may be defensible only if verified new evidence materially improves the operating case; explore the trade-offs in the{" "}
          <Link href="/allocation" className="text-teal underline print:no-underline">Capital Allocation Lab</Link>.
        </p>
      </Section>

      <Section title="Underwriting risks" aside={<span className="text-[12px] text-mute">Workbook Risk Register</span>}>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[780px]">
            <thead><tr><th>Company</th><th>Domain</th><th>Potential thesis failure</th><th>Decision consequence</th><th>Src</th></tr></thead>
            <tbody>
              {RISKS.map((r) => (
                <tr key={r.company + r.domain}><td>{r.company}</td><th scope="row" className="font-semibold text-navy">{r.domain}</th><td>{r.failure}</td><td className="font-medium">{r.consequence}</td><td><SourceRefs ids={[r.sourceId]} /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1.5 text-[12px] text-mute">{NOTES.assumptionNotes[1]}</p>
      </Section>

      <Section title="Conditions for proceeding">
        <p className="mb-2 max-w-3xl text-[13.5px]">Return to committee only if all financial gates pass and the negotiated security clears the approved required return.</p>
        <ol className="space-y-2">
          {GATES.map(([h, b]) => (<li key={h} className="card p-3"><h3 className="font-sans text-[13.5px] font-semibold">{h}</h3><p className="text-[13.5px]">{b}</p></li>))}
        </ol>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Key questions for management">
          <ul className="card divide-y divide-line">
            {QUESTIONS.map(([who, q]) => (<li key={q} className="flex gap-2 px-3 py-2 text-[13.5px]"><span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-teal">{who}</span><span>{q}</span></li>))}
          </ul>
        </Section>
        <Section title="Potential reasons to reject both investments">
          <ul className="card space-y-2 py-3 pl-8 pr-4 text-[13.5px] [list-style:disc]">
            {REJECT.map((r) => <li key={r.text}>{r.text} <SourceRefs ids={r.src} /></li>)}
          </ul>
        </Section>
      </div>

      <Notice title="Disclosures.">
        {NOTES.disclaimer} Prices are hypothetical. No data room, management conversations, live quotes, preferred terms or auditor verification were obtained. Figures marked calculated are produced by this application&apos;s engine from labeled analyst assumptions and sourced inputs.
      </Notice>
    </>
  );
}
