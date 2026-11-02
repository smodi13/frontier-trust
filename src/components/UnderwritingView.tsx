"use client";
import { useState } from "react";
import { hist } from "@/data/sources";
import {
  CASE_IDS, COMPANY_IDS, COMPANY_LABEL, LIMITS, fmtPct, fmtUsd, fmtX, isNeg,
  type CaseId, type CompanyId, type Forecast, type CompanyInputs,
} from "@/engine";
import { resetModel, updateInputs, useModel } from "@/state/store";
import { ArrChart, FcfChart } from "./Charts";
import { LockedField, NumberField } from "./Field";
import { ProbabilityFields } from "./ProbabilityFields";
import { Segmented } from "./Selectors";
import { KindBadge, Legend, Notice, Section, SourceRefs } from "./ui";

const CASE_LABEL: Record<CaseId, string> = { bear: "Bear", base: "Base", bull: "Bull" };
type Num = Exclude<keyof CompanyInputs, "scenarios" | "startArr">;

const FIELDS: { group: string; items: { key: Num; label: string; unit: "pct" | "ppt" | "usd"; limit: keyof typeof LIMITS; kind?: "hypothetical"; hint?: string }[] }[] = [
  { group: "Transaction (hypothetical)", items: [
    { key: "entryPreMoney", label: "Entry pre-money valuation", unit: "usd", limit: "entryPreMoney", kind: "hypothetical", hint: "Not a live price; no availability implied." },
    { key: "dilution", label: "Cumulative future dilution", unit: "pct", limit: "dilution" },
  ] },
  { group: "Revenue and margin", items: [
    { key: "revenueRecognition", label: "Revenue proxy / ending ARR", unit: "pct", limit: "revenueRecognition", hint: "Illustrative recognition convention, not GAAP revenue." },
    { key: "grossMargin", label: "Gross margin", unit: "pct", limit: "grossMargin" },
  ] },
  { group: "Operating expense intensity (first forecast year)", items: [
    { key: "smStart", label: "S&M / revenue", unit: "pct", limit: "costRatio" },
    { key: "rdStart", label: "R&D / revenue", unit: "pct", limit: "costRatio" },
    { key: "gaStart", label: "G&A / revenue", unit: "pct", limit: "costRatio" },
    { key: "smStep", label: "S&M reduction per year", unit: "ppt", limit: "costStep" },
    { key: "rdStep", label: "R&D reduction per year", unit: "ppt", limit: "costStep" },
    { key: "gaStep", label: "G&A reduction per year", unit: "ppt", limit: "costStep" },
  ] },
  { group: "Cash flow conversion", items: [
    { key: "daPct", label: "D&A / revenue", unit: "pct", limit: "daPct" },
    { key: "capexPct", label: "Capex / revenue", unit: "pct", limit: "capexPct" },
    { key: "nwcPct", label: "Incremental WC / revenue growth", unit: "pct", limit: "nwcPct" },
    { key: "taxRate", label: "Cash tax rate on positive EBIT", unit: "pct", limit: "taxRate" },
  ] },
];

type Line = { label: string; get: (f: Forecast, i: number) => number | null; fmt?: "pct"; bold?: boolean };
const LINES: Line[] = [
  { label: "Ending ARR", get: (f, i) => f.arr[i], bold: true },
  { label: "Annual ARR growth", get: (f, i) => f.growth[i], fmt: "pct" },
  { label: "Revenue proxy", get: (f, i) => f.revenue[i] },
  { label: "Gross profit proxy", get: (f, i) => f.grossProfit[i] },
  { label: "Sales and marketing", get: (f, i) => f.sm[i] },
  { label: "Research and development", get: (f, i) => f.rd[i] },
  { label: "General and administrative", get: (f, i) => f.ga[i] },
  { label: "EBITDA proxy", get: (f, i) => f.ebitda[i], bold: true },
  { label: "D&A", get: (f, i) => f.da[i] },
  { label: "EBIT proxy", get: (f, i) => f.ebit[i], bold: true },
  { label: "Cash taxes", get: (f, i) => f.tax[i] },
  { label: "Capital expenditures", get: (f, i) => f.capex[i] },
  { label: "Incremental working capital", get: (f, i) => f.nwc[i] },
  { label: "Free cash flow proxy", get: (f, i) => f.fcf[i], bold: true },
  { label: "FCF margin proxy", get: (f, i) => f.fcfMargin[i], fmt: "pct" },
];

export function UnderwritingView() {
  const { inputs, primary, modified } = useModel();
  const [co, setCo] = useState<CompanyId>("vanta");
  const [cs, setCs] = useState<CaseId>("base");
  const c = inputs.companies[co];
  const res = primary.companies[co];
  const f = res.forecasts[cs];
  const years = f.years.slice(0, inputs.holdYears + 1);
  const arrH = hist(COMPANY_LABEL[co], co === "vanta" ? "2026 ARR run-rate" : "June 2026 ARR run-rate");
  const set = (fn: (d: typeof inputs) => void) => updateInputs(fn);
  const sc = c.scenarios[cs];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented label="Company" value={co} onChange={setCo} options={COMPANY_IDS.map((x) => ({ value: x, label: COMPANY_LABEL[x] }))} />
          <Segmented label="Scenario" value={cs} onChange={setCs} options={CASE_IDS.map((x) => ({ value: x, label: CASE_LABEL[x] }))} />
        </div>
        <button onClick={resetModel} disabled={!modified} className="rounded border border-navy px-3 py-1.5 text-[13px] font-medium text-navy disabled:opacity-40">Reset all to original</button>
      </div>
      <div className="mb-4"><Legend /></div>

      <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
        <aside aria-label={`${COMPANY_LABEL[co]} assumptions`} className="card self-start p-3.5">
          <h2 className="mb-1 text-[16px] font-semibold">{COMPANY_LABEL[co]} inputs</h2>
          <LockedField label="2026 ARR snapshot" display={fmtUsd(c.startArr, { dp: 0 })} kind={arrH.dataType === "Company disclosure" ? "company" : "estimate"}>
            <SourceRefs ids={[arrH.sourceId]} /> {arrH.date}
          </LockedField>

          <h3 className="mt-3 border-t border-line pt-2 text-[13px] font-semibold">{CASE_LABEL[cs]} case drivers</h3>
          <NumberField label="First-year ARR growth (2027)" unit="pct" limit={LIMITS.growth2027} value={sc.growth2027} onChange={(v) => set((d) => { d.companies[co].scenarios[cs].growth2027 = v; })} />
          <NumberField label="Annual growth decay" unit="ppt" limit={LIMITS.decay} value={sc.decay} onChange={(v) => set((d) => { d.companies[co].scenarios[cs].decay = v; })} />
          <NumberField label="Exit EV / ARR" unit="x" limit={LIMITS.exitMultiple} value={sc.exitMultiple} onChange={(v) => set((d) => { d.companies[co].scenarios[cs].exitMultiple = v; })} />
          <NumberField label="Exit net debt / (net cash)" unit="usd" limit={LIMITS.exitNetDebt} value={sc.exitNetDebt} onChange={(v) => set((d) => { d.companies[co].scenarios[cs].exitNetDebt = v; })} hint="Analyst scenario value; negative = net cash. Not a reported balance." />

          {FIELDS.map((g) => (
            <div key={g.group}>
              <h3 className="mt-3 border-t border-line pt-2 text-[13px] font-semibold">{g.group}</h3>
              {g.items.map((it) => (
                <NumberField key={it.key} label={it.label} unit={it.unit} limit={LIMITS[it.limit]} kind={it.kind ?? "assumption"} hint={it.hint}
                  value={c[it.key]} onChange={(v) => set((d) => { d.companies[co][it.key] = v; })} />
              ))}
            </div>
          ))}

          <h3 className="mt-3 border-t border-line pt-2 text-[13px] font-semibold">Shared across companies</h3>
          <NumberField label="Investment check size" unit="usd" limit={LIMITS.checkSize} value={inputs.checkSize} onChange={(v) => set((d) => { d.checkSize = v; })} kind="hypothetical" />
          <NumberField label="Required gross IRR (hurdle)" unit="pct" limit={LIMITS.hurdle} value={inputs.hurdle} onChange={(v) => set((d) => { d.hurdle = v; })} hint="Analyst screening hurdle, not a TVG requirement." />
          <NumberField label="Holding period" unit="years" limit={LIMITS.holdYears} value={inputs.holdYears} onChange={(v) => set((d) => { d.holdYears = Math.round(v); })} hint="Whole years from the 2026 snapshot." />
          <ProbabilityFields />
        </aside>

        <div className="min-w-0">
          <Section title={`${COMPANY_LABEL[co]} — ${CASE_LABEL[cs]} case operating build`} aside={<span className="text-[12px] text-mute">USD millions · <KindBadge kind="calculated" /> from assumptions · not GAAP</span>}>
            <div className="card overflow-x-auto" tabIndex={0}>
              <table className="tbl min-w-[640px]">
                <caption className="sr-only">{COMPANY_LABEL[co]} {CASE_LABEL[cs]} case operating forecast</caption>
                <thead>
                  <tr><th>Metric</th>{years.map((y, i) => <th key={y} className="r">{i === 0 ? `${y} snapshot` : `${y}E`}</th>)}</tr>
                </thead>
                <tbody>
                  {LINES.map((ln) => (
                    <tr key={ln.label} className={ln.bold ? "bg-slate-50/70" : ""}>
                      <th scope="row" className={ln.bold ? "font-semibold text-navy" : "font-normal"}>{ln.label}</th>
                      {years.map((y, i) => {
                        const v = ln.get(f, i);
                        return <td key={y} className={`r num ${isNeg(v) ? "neg" : ""} ${ln.bold ? "font-semibold" : ""}`}>{v === null ? "—" : ln.fmt === "pct" ? fmtPct(v) : fmtUsd(v)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1.5 text-[12px] text-mute">The 2026 column is an ARR snapshot, not a reported income statement. FCF proxy excludes SBC, billing timing and working-capital proof.</p>
          </Section>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <Section title="ARR by scenario"><div className="card p-3"><ArrChart forecasts={res.forecasts} /></div></Section>
            <Section title="FCF proxy by scenario"><div className="card p-3"><FcfChart forecasts={res.forecasts} /></div></Section>
          </div>

          <Section title="Returns by scenario" aside={<span className="text-[12px] text-mute">{fmtUsd(inputs.checkSize, { dp: 0 })} primary check · gross</span>}>
            <div className="card overflow-x-auto" tabIndex={0}>
              <table className="tbl min-w-[560px]">
                <thead><tr><th>Metric</th>{CASE_IDS.map((k) => <th key={k} className="r">{CASE_LABEL[k]}</th>)}</tr></thead>
                <tbody>
                  {([
                    ["Probability", (r) => fmtPct(r.probability, 0)],
                    [`${f.years[inputs.holdYears]} ARR`, (r) => fmtUsd(r.exitArr)],
                    ["Exit EV / ARR", (r) => fmtX(r.exitMultiple, 1)],
                    ["Exit enterprise value", (r) => fmtUsd(r.exitEv)],
                    ["Exit net debt / (cash)", (r) => fmtUsd(r.exitNetDebt)],
                    ["Exit equity value", (r) => fmtUsd(r.exitEquity)],
                    ["Gross proceeds (primary)", (r) => fmtUsd(r.proceedsPrimary)],
                    ["Gross MOIC", (r) => fmtX(r.moicPrimary)],
                    ["Gross IRR", (r) => fmtPct(r.irrPrimary)],
                    ["Max pre-money at hurdle", (r) => fmtUsd(r.maxPrePrimary, { compact: true })],
                    ["Meets hurdle?", (r) => (r.meetsHurdle ? "PASS" : "FAIL")],
                  ] as [string, (r: (typeof res.returns)["base"]) => string][]).map(([label, fn]) => (
                    <tr key={label}>
                      <th scope="row" className="font-normal">{label}</th>
                      {CASE_IDS.map((k) => { const t = fn(res.returns[k]); return <td key={k} className={`r num ${t.startsWith("(") || t.startsWith("-") ? "neg" : ""}`}>{t}</td>; })}
                    </tr>
                  ))}
                  <tr className="bg-slate-50/70">
                    <th scope="row" className="font-semibold text-navy">Probability-weighted proceeds → IRR</th>
                    <td colSpan={3} className="r num font-semibold">{fmtUsd(res.weightedProceeds)} → {fmtPct(res.weightedIrr)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2"><Notice>A positive IRR below the hurdle is a FAIL. The probability-weighted IRR applies one IRR to weighted proceeds; it is not the mean of scenario IRRs.</Notice></div>
          </Section>
        </div>
      </div>
    </>
  );
}
