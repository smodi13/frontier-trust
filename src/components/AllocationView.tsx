"use client";
import { useState } from "react";
import {
  CASE_IDS, COMPANY_IDS, COMPANY_LABEL, LIMITS, SENS_EXIT_MULTIPLES, SENS_GROWTH_SHIFTS, SENS_TARGET_IRRS,
  fmtPct, fmtUsd, fmtX, irrGrid, isNeg, maxEntryGrid, type CaseId, type CompanyId, type EntryType,
} from "@/engine";
import { resetModel, setEntry, updateInputs, useModel } from "@/state/store";
import { ScenarioIrrChart } from "./Charts";
import { NumberField } from "./Field";
import { ProbabilityFields } from "./ProbabilityFields";
import { Segmented } from "./Selectors";
import { KindBadge, Kpi, Notice, Section } from "./ui";

const CASE_LABEL: Record<CaseId, string> = { bear: "Bear", base: "Base", bull: "Bull" };

export function AllocationView() {
  const { inputs, entry, selected, modified } = useModel();
  const [co, setCo] = useState<CompanyId>("vanta");
  const [cs, setCs] = useState<CaseId>("base");
  const c = inputs.companies[co];
  const sc = c.scenarios[cs];
  const res = selected.companies[co];
  const r = res.returns[cs];
  const primary = entry === "primary";
  const set = updateInputs;
  const irrG = irrGrid(inputs, c, cs, entry, SENS_EXIT_MULTIPLES, SENS_GROWTH_SHIFTS);
  const maxG = maxEntryGrid(inputs, c, cs, entry, SENS_EXIT_MULTIPLES, SENS_TARGET_IRRS);
  const hurdleTxt = fmtPct(inputs.hurdle, (inputs.hurdle * 100) % 1 === 0 ? 0 : 1);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Company" value={co} onChange={setCo} options={COMPANY_IDS.map((x) => ({ value: x, label: COMPANY_LABEL[x] }))} />
          <Segmented label="Scenario" value={cs} onChange={setCs} options={CASE_IDS.map((x) => ({ value: x, label: CASE_LABEL[x] }))} />
          <Segmented<EntryType> label="Entry type" value={entry} onChange={setEntry} options={[{ value: "primary", label: "Primary (new shares)" }, { value: "secondary", label: "Secondary (existing shares)" }]} />
        </div>
        <button onClick={resetModel} disabled={!modified} className="rounded border border-navy px-3 py-1.5 text-[13px] font-medium text-navy disabled:opacity-40">Reset all to original</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside aria-label="Allocation controls" className="card self-start p-3.5">
          <h2 className="text-[16px] font-semibold">Controls</h2>
          <p className="mb-1 text-[12px] text-mute">Edits recalculate immediately and persist in this browser only.</p>
          <h3 className="mt-2 border-t border-line pt-2 text-[13px] font-semibold">Security and price</h3>
          <NumberField label="Investment check size" unit="usd" limit={LIMITS.checkSize} kind="hypothetical" value={inputs.checkSize} onChange={(v) => set((d) => { d.checkSize = v; })} slider />
          <NumberField label={primary ? "Pre-money valuation" : "Entry equity value (secondary price)"} unit="usd" limit={LIMITS.entryPreMoney} kind="hypothetical" value={c.entryPreMoney}
            onChange={(v) => set((d) => { d.companies[co].entryPreMoney = v; })} slider
            hint={primary ? "Primary: post-money = pre-money + check." : "Secondary: no new money; the check buys existing shares at this equity value."} />
          <NumberField label="Holding period" unit="years" limit={LIMITS.holdYears} value={inputs.holdYears} onChange={(v) => set((d) => { d.holdYears = Math.round(v); })} slider />
          <NumberField label="Ownership dilution to exit" unit="pct" limit={LIMITS.dilution} value={c.dilution} onChange={(v) => set((d) => { d.companies[co].dilution = v; })} slider />
          <NumberField label="Required gross IRR" unit="pct" limit={LIMITS.hurdle} value={inputs.hurdle} onChange={(v) => set((d) => { d.hurdle = v; })} slider hint="Analyst screening hurdle, not a TVG requirement." />

          <h3 className="mt-3 border-t border-line pt-2 text-[13px] font-semibold">{CASE_LABEL[cs]} case operating and exit</h3>
          <NumberField label="First-year ARR growth" unit="pct" limit={LIMITS.growth2027} value={sc.growth2027} onChange={(v) => set((d) => { d.companies[co].scenarios[cs].growth2027 = v; })} slider />
          <NumberField label="Annual growth decay" unit="ppt" limit={LIMITS.decay} value={sc.decay} onChange={(v) => set((d) => { d.companies[co].scenarios[cs].decay = v; })} slider />
          <NumberField label="Exit EV / ARR" unit="x" limit={LIMITS.exitMultiple} value={sc.exitMultiple} onChange={(v) => set((d) => { d.companies[co].scenarios[cs].exitMultiple = v; })} slider />
          <NumberField label="Exit net debt / (net cash)" unit="usd" limit={LIMITS.exitNetDebt} value={sc.exitNetDebt} onChange={(v) => set((d) => { d.companies[co].scenarios[cs].exitNetDebt = v; })} slider hint="Analyst assumption; negative = net cash." />

          <h3 className="mt-3 border-t border-line pt-2 text-[13px] font-semibold">Scenario weights</h3>
          <ProbabilityFields />
        </aside>

        <div className="min-w-0">
          <div className={`mb-4 rounded border px-4 py-3 ${r.meetsHurdle ? "border-teal bg-teal-soft" : "border-amber-500/60 bg-warn-bg"}`} role="status" data-testid="verdict">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-mute">{COMPANY_LABEL[co]} · {CASE_LABEL[cs]} · {primary ? "primary" : "secondary"} · {fmtUsd(inputs.checkSize, { dp: 0 })} check</p>
            <p className="font-serif text-[19px] text-navy">
              Gross IRR <span className={`num font-semibold ${r.irr < 0 ? "neg" : ""}`}>{fmtPct(r.irr)}</span> vs {hurdleTxt} hurdle: <strong>{r.meetsHurdle ? "clears the screen" : "does not clear the screen"}</strong>
            </p>
            <p className="text-[12.5px] text-slate">
              {r.meetsHurdle
                ? "Clearing a screening hurdle is not an approval; capital structure, rights and evidence gates still apply."
                : r.irr > 0
                  ? "A positive return is not the same as passing the hurdle."
                  : "This case loses capital or earns nothing at this price."}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Kpi label="Initial ownership" value={fmtPct(r.initialOwnership, 2)} kind="calculated" sub={primary ? "check ÷ post-money" : "check ÷ entry equity"} />
            <Kpi label="Exit ownership" value={fmtPct(r.exitOwnership, 2)} kind="calculated" sub={`after ${fmtPct(r.dilution, 0)} dilution`} />
            <Kpi label={`Exit equity (${r.exitYear})`} value={fmtUsd(r.exitEquity, { compact: true })} kind="calculated" sub={`EV ${fmtUsd(r.exitEv, { compact: true })}`} />
            <Kpi label="Investment proceeds" value={fmtUsd(r.proceeds)} kind="calculated" negative={r.proceeds < inputs.checkSize} />
            <Kpi label="Gross MOIC" value={fmtX(r.moic)} kind="calculated" negative={r.moic < 1} />
            <Kpi label="Gross IRR" value={fmtPct(r.irr)} kind="calculated" negative={r.irr < 0} />
            <Kpi label={primary ? "Max pre-money at hurdle" : "Max entry equity value at hurdle"} value={fmtUsd(r.maxEntry, { compact: true })} kind="calculated" />
            <Kpi label="Discount vs modeled entry" value={fmtPct(r.discount)} kind="calculated" sub={r.discount < 0 ? "headroom: modeled price below the maximum" : "required reduction to reach hurdle"} />
          </div>

          <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <Section title="Probability-weighted outcome" aside={<KindBadge kind="calculated" />}>
              <div className="card p-3">
                <dl className="grid grid-cols-2 gap-3">
                  <div><dt className="text-[11px] uppercase tracking-wide text-mute">Weighted proceeds ({COMPANY_LABEL[co]})</dt><dd className="num text-[22px] font-semibold text-navy" data-testid="weighted">{fmtUsd(res.weightedProceeds)}</dd></div>
                  <div><dt className="text-[11px] uppercase tracking-wide text-mute">IRR of weighted proceeds</dt><dd className={`num text-[22px] font-semibold ${res.weightedIrr < 0 ? "neg" : "text-navy"}`}>{fmtPct(res.weightedIrr)}</dd></div>
                </dl>
                <p className="mt-2 text-[12px] text-mute">Weights {CASE_IDS.map((k) => `${CASE_LABEL[k]} ${fmtPct(inputs.probabilities[k], 0)}`).join(" · ")} (sum {fmtPct(selected.probabilitySum, 0)}). Not an actuarial expected IRR.</p>
              </div>
            </Section>
            <Section title="Gross IRR by scenario (both companies)">
              <div className="card p-3"><ScenarioIrrChart result={selected} hurdle={inputs.hurdle} /></div>
            </Section>
          </div>

          <Section title="Return mechanics" aside={<span className="text-[12px] text-mute">each step is calculated; formula shown</span>}>
            <div className="card overflow-x-auto" tabIndex={0}>
              <table className="tbl min-w-[560px]">
                <thead><tr><th>Step</th><th>Formula</th><th className="r">Value</th></tr></thead>
                <tbody>
                  {([
                    ["Entry equity value", primary ? "pre-money + check (post-money)" : "pre-money equity value (no new money)", fmtUsd(primary ? r.postMoney : r.preMoney)],
                    ["Initial ownership", primary ? "check ÷ (pre-money + check)" : "check ÷ entry equity value", fmtPct(r.initialOwnership, 3)],
                    ["Exit ownership", "initial ownership × (1 − dilution)", fmtPct(r.exitOwnership, 3)],
                    [`Exit ARR (${r.exitYear})`, "ARR compounded at decaying growth", fmtUsd(r.exitArr)],
                    ["Exit enterprise value", "exit ARR × exit EV/ARR", fmtUsd(r.exitEv)],
                    ["Exit equity value", "MAX(0, EV − net debt)", fmtUsd(r.exitEquity)],
                    ["Investment proceeds", "exit equity × exit ownership", fmtUsd(r.proceeds)],
                    ["Gross MOIC", "proceeds ÷ check", fmtX(r.moic, 3)],
                    ["Gross IRR", "MOIC ^ (1 / years) − 1", fmtPct(r.irr, 2)],
                    ["Required MOIC", "(1 + required IRR) ^ years", fmtX(r.targetMoic, 3)],
                    [primary ? "Max pre-money" : "Max entry equity value", primary ? "MAX(0, exit equity × (1 − dilution) ÷ required MOIC − check)" : "MAX(0, exit equity × (1 − dilution) ÷ required MOIC)", fmtUsd(r.maxEntry)],
                  ] as [string, string, string][]).map(([a, b, v]) => (
                    <tr key={a}><th scope="row" className="font-normal">{a}</th><td className="font-mono text-[12px] text-slate">{b}</td><td className={`r num font-semibold ${v.startsWith("(") || v.startsWith("-") ? "neg" : ""}`}>{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {r.exitEquity === 0 && <div className="mt-2"><Notice title="Zero exit equity.">Net debt exceeds exit enterprise value, so equity is floored at zero: proceeds are zero and IRR is −100%.</Notice></div>}
          </Section>

          <Section title={`Sensitivity: gross ${primary ? "primary" : "secondary"} IRR`} aside={<span className="text-[12px] text-mute">{COMPANY_LABEL[co]} · {CASE_LABEL[cs]} drivers · shift applies to growth in every year</span>}>
            <Grid
              caption={`Gross IRR sensitivity: exit EV/ARR by first-year growth shift (${COMPANY_LABEL[co]})`}
              corner="Exit EV/ARR ↓ · growth shift →"
              cols={SENS_GROWTH_SHIFTS.map((s) => `${s > 0 ? "+" : s < 0 ? "−" : ""}${Math.abs(s * 100).toFixed(0)} ppt`)}
              rows={SENS_EXIT_MULTIPLES.map((m) => fmtX(m, 1))}
              cells={irrG.map((row) => row.map((v) => ({ text: fmtPct(v), neg: isNeg(v), ok: v >= inputs.hurdle })))}
              legend={`✓ = at or above the ${hurdleTxt} hurdle at the modeled entry price`}
            />
          </Section>
          <Section title={`Sensitivity: maximum ${primary ? "pre-money" : "entry equity value"} ($)`} aside={<span className="text-[12px] text-mute">{COMPANY_LABEL[co]} · {CASE_LABEL[cs]} ARR and net debt</span>}>
            <Grid
              caption={`Maximum entry value by required IRR and exit EV/ARR (${COMPANY_LABEL[co]})`}
              corner="Exit EV/ARR ↓ · required IRR →"
              cols={SENS_TARGET_IRRS.map((x) => fmtPct(x, 0))}
              rows={SENS_EXIT_MULTIPLES.map((m) => fmtX(m, 1))}
              cells={maxG.map((row) => row.map((v) => ({ text: fmtUsd(v, { dp: 0 }), neg: false, ok: v >= c.entryPreMoney })))}
              legend={`✓ = maximum is at or above the modeled entry value of ${fmtUsd(c.entryPreMoney, { dp: 0 })}`}
            />
          </Section>
        </div>
      </div>
    </>
  );
}

function Grid({ caption, corner, cols, rows, cells, legend }: { caption: string; corner: string; cols: string[]; rows: string[]; cells: { text: string; neg: boolean; ok: boolean }[][]; legend: string }) {
  return (
    <div className="card overflow-x-auto" tabIndex={0}>
      <table className="tbl min-w-[520px]">
        <caption className="sr-only">{caption}</caption>
        <thead><tr><th>{corner}</th>{cols.map((c) => <th key={c} scope="col" className="r">{c}</th>)}</tr></thead>
        <tbody>
          {cells.map((row, i) => (
            <tr key={rows[i]}>
              <th scope="row" className="num font-semibold text-navy">{rows[i]}</th>
              {row.map((c, j) => (
                <td key={j} className={`r num ${c.neg ? "neg" : ""} ${c.ok ? "bg-teal-soft font-semibold" : ""}`}>{c.text}{c.ok && <span aria-label="meets threshold"> ✓</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-3 py-1.5 text-[11.5px] text-mute">{legend}. Axes are the workbook&apos;s fixed sensitivity grid.</p>
    </div>
  );
}
