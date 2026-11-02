"use client";
import Link from "next/link";
import { ScenarioIrrChart, PriceChart } from "./Charts";
import { KindBadge, Kpi, Notice, Section, Val } from "./ui";
import { COMPANY_IDS, COMPANY_LABEL, fmtPct, fmtUsd, fmtX, type CompanyId } from "@/engine";
import { resetModel, useModel } from "@/state/store";

const PRIORITY = "Vanta is the first commercial diligence priority, subject to price and evidence requirements.";
const STEPS = [
  ["Opportunity identification", "/opportunities"], ["Company screening", "/opportunities"], ["Commercial diligence", "/companies/vanta"],
  ["Financial underwriting", "/underwriting"], ["Scenario analysis", "/underwriting"], ["Capital allocation", "/allocation"],
  ["Investment committee decision", "/committee"], ["Portfolio monitoring", "/monitoring"], ["Research provenance", "/evidence"],
] as const;

export function OverviewView() {
  const { inputs, primary, modified } = useModel();
  const { hurdle, holdYears } = inputs;
  const h = `${fmtPct(hurdle, (hurdle * 100) % 1 === 0 ? 0 : 1)} ${holdYears}-year gross IRR`;
  const passing = COMPANY_IDS.filter((c) => primary.companies[c].returns.base.meetsHurdle);
  const headline =
    passing.length === 0
      ? `Neither company clears the illustrative ${h} screening threshold at the modeled entry prices.`
      : passing.length === 2
        ? `Under the current assumptions both companies clear the illustrative ${h} screening threshold at the modeled entry prices.`
        : `Under the current assumptions only ${COMPANY_LABEL[passing[0]]} clears the illustrative ${h} screening threshold at the modeled entry prices.`;

  return (
    <>
      <header className="mb-5 border-b border-line pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal">1 · Investment overview</p>
        <h1 className="mt-1 text-[34px] leading-tight font-semibold">Frontier Trust</h1>
        <p className="font-serif text-[19px] text-slate">A $100 Million AI Trust Infrastructure Allocation Decision</p>
      </header>

      <div className="card mb-5 border-l-4 border-l-navy p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-mute">Investment conclusion · base case · {fmtUsd(inputs.checkSize, { dp: 0 })} primary check</p>
        <p className="mt-1 font-serif text-[21px] leading-snug text-navy" data-testid="conclusion">{headline}</p>
        <p className="mt-1.5 text-[15px] text-ink" data-testid="priority">{PRIORITY}</p>
        <p className="mt-2 text-[12.5px] text-mute">
          A positive return is not the same as clearing the screen. The conclusion is conditional on price, financial disclosure and the diligence gates on the{" "}
          <Link className="text-teal underline" href="/committee">Investment Committee</Link> page.
        </p>
        {modified && (
          <div className="mt-3">
            <Notice title="Assumptions modified.">
              The figures below reflect your edits, not the workbook. <button className="font-semibold underline" onClick={resetModel}>Reset to original</button>
            </Notice>
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2">
        {COMPANY_IDS.map((id: CompanyId) => {
          const r = primary.companies[id].returns.base;
          const g = primary.companies[id].gate;
          return (
            <section key={id} aria-labelledby={`${id}-k`} className="card p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 id={`${id}-k`} className="text-[19px] font-semibold">{COMPANY_LABEL[id]}</h2>
                <span className={`rounded px-2 py-0.5 text-[11px] font-bold tracking-wide ${r.meetsHurdle ? "bg-teal text-white" : "bg-warn-bg text-warn-ink"}`}>{g}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Kpi label="Gross primary MOIC" value={fmtX(r.moicPrimary)} kind="calculated" negative={r.moicPrimary < 1} />
                <Kpi label="Gross primary IRR" value={fmtPct(r.irrPrimary)} kind="calculated" negative={r.irrPrimary < 0} />
                <Kpi label={`Max pre-money at ${fmtPct(hurdle, 0)} hurdle`} value={fmtUsd(r.maxPrePrimary, { compact: true })} kind="calculated" />
                <Kpi label="Modeled entry pre-money" value={fmtUsd(r.preMoney, { compact: true })} kind="hypothetical" sub={`${fmtPct(r.discountPrimary)} discount needed`} />
              </div>
              <p className="mt-2 text-[12px] text-mute">
                {id === "vanta"
                  ? "2026 ARR anchor is company-disclosed (Apr 2026); the $4.15B valuation is from Jul 2025."
                  : "2026 ARR anchor is a Sacra estimate (Jun 2026), not a company disclosure."}
              </p>
            </section>
          );
        })}
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Section title="Gross IRR by scenario" aside={<KindBadge kind="calculated" />}>
          <div className="card p-3"><ScenarioIrrChart result={primary} hurdle={hurdle} /></div>
        </Section>
        <Section title="Price discipline" aside={<KindBadge kind="calculated" />}>
          <div className="card p-3">
            <PriceChart rows={COMPANY_IDS.map((c) => ({ name: COMPANY_LABEL[c], modeled: primary.companies[c].returns.base.preMoney, max: primary.companies[c].returns.base.maxPrePrimary }))} />
          </div>
        </Section>
      </div>

      <Section title="Base-case comparison" aside={<span className="text-[12px] text-mute">USD · 25% / 50% / 25% bear / base / bull weighting applies to the weighted rows</span>}>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl">
            <thead><tr><th>Metric</th><th className="r">Vanta</th><th className="r">Chainguard</th></tr></thead>
            <tbody>
              {(
                [
                  ["2026 ARR snapshot", (c) => fmtUsd(c.startArr, { dp: 0 }), "Vanta: company disclosure · Chainguard: third-party estimate"],
                  [`${primary.companies.vanta.returns.base.exitYear} ARR (base)`, (c) => fmtUsd(c.exitArr, { dp: 1 }), ""],
                  ["Exit EV / ARR (base)", (c) => fmtX(c.exitMultiple, 1), "analyst assumption"],
                  ["Exit equity value (base)", (c) => fmtUsd(c.exitEquity, { compact: true }), ""],
                  ["Gross primary MOIC", (c) => fmtX(c.moicPrimary), ""],
                  ["Gross primary IRR", (c) => fmtPct(c.irrPrimary), ""],
                  ["Max primary pre-money at hurdle", (c) => fmtUsd(c.maxPrePrimary, { compact: true }), ""],
                ] as [string, (c: (typeof primary.companies.vanta.returns)["base"]) => string, string][]
              ).map(([label, f, note]) => (
                <tr key={label}>
                  <th scope="row" className="font-normal text-ink">{label}{note && <span className="block text-[11px] text-mute">{note}</span>}</th>
                  {COMPANY_IDS.map((id) => <td key={id} className="r num">{f(primary.companies[id].returns.base)}</td>)}
                </tr>
              ))}
              <tr>
                <th scope="row" className="font-normal text-ink">{primary.companies.vanta.returns.base.exitYear} FCF proxy (base)</th>
                {COMPANY_IDS.map((id) => {
                  const v = primary.companies[id].forecasts.base.fcf[inputs.holdYears];
                  return <td key={id} className="r"><Val v={v}>{fmtUsd(v)}</Val></td>;
                })}
              </tr>
              <tr>
                <th scope="row" className="font-normal text-ink">Probability-weighted proceeds → IRR</th>
                {COMPANY_IDS.map((id) => <td key={id} className="r num">{fmtUsd(primary.companies[id].weightedProceeds)} → {fmtPct(primary.companies[id].weightedIrr)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <div className="mb-6"><Notice title="Read before relying on any figure.">
        Entry prices are hypothetical and do not imply that shares are available. Forecasts, margins, dilution, net debt and exit multiples are analyst assumptions, not company guidance.
        The {fmtPct(hurdle, 0)} hurdle is an analyst screening assumption, not a Teachers&apos; Venture Growth requirement. ARR is not GAAP revenue. Returns are gross, before fees, taxes and FX.
      </Notice></div>

      <Section title="Analytical workflow">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(([label, href], i) => (
            <li key={label}>
              <Link href={href} className="card flex items-center gap-2.5 px-3 py-2 hover:border-teal">
                <span className="font-mono text-[11px] text-teal">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[13px] font-medium text-navy">{label}</span>
              </Link>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
