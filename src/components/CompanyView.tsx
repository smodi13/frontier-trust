"use client";
import { COMPANIES, type Fact } from "@/data/companies";
import { RISKS, SOURCE_BY_ID } from "@/data/sources";
import { COMPANY_LABEL, fmtPct, fmtUsd, fmtX, type CompanyId } from "@/engine";
import { useModel } from "@/state/store";
import { KindBadge, Legend, Notice, PageHeader, Section, SourceRefs } from "./ui";

const Paras = ({ items }: { items: { text: string; src: string[] }[] }) => (
  <div className="space-y-2">{items.map((p) => <p key={p.text} className="max-w-3xl text-[14px]">{p.text} <SourceRefs ids={p.src} /></p>)}</div>
);
const FactTable = ({ items }: { items: Fact[] }) => (
  <div className="card overflow-x-auto" tabIndex={0}>
    <table className="tbl">
      <thead><tr><th>Item</th><th>Value</th><th>Provenance</th><th>Source</th></tr></thead>
      <tbody>
        {items.map((f) => (
          <tr key={f.label}>
            <th scope="row" className="font-normal">{f.label}{f.note && <span className="block text-[11.5px] text-mute">{f.note}</span>}</th>
            <td className="num font-semibold text-navy">{f.value}</td>
            <td><KindBadge kind={f.kind} /></td>
            <td><SourceRefs ids={f.src} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);


export function CompanyView({ id }: { id: CompanyId }) {
  const c = COMPANIES[id];
  const { primary, inputs } = useModel();
  const base = primary.companies[id].returns.base;
  const fc = primary.companies[id].forecasts.base;
  const t = inputs.holdYears;
  const risks = RISKS.filter((r) => r.company === COMPANY_LABEL[id] || r.company === "Both");
  return (
    <>
      <PageHeader eyebrow="3 · Commercial diligence" title={c.name}>{c.tagline}. Public-information research only: no data room, management access or audited financials were obtained.</PageHeader>
      <div className="mb-5"><Notice title={c.anchorNotice.title}>{c.anchorNotice.body}</Notice></div>
      <div className="mb-5"><Legend /></div>

      <Section title="Business model"><Paras items={c.businessModel} /></Section>
      <Section title="Products"><Paras items={c.products} /></Section>
      <Section title="Market positioning"><Paras items={c.positioning} /></Section>
      <Section title="Public operating evidence" id="evidence"><FactTable items={c.facts} /></Section>
      <Section title="Funding disclosures" id="funding"><FactTable items={c.funding} /></Section>
      <Section title="Competitive environment"><Paras items={c.competition} /></Section>
      <Section title="Growth thesis (what needs to be true)"><Paras items={c.thesis} /></Section>

      <Section title="Modeled base case" aside={<KindBadge kind="calculated" />}>
        <div className="card p-3">
          <p className="mb-2 text-[12.5px] text-mute">Calculated live from the underwriting engine using analyst assumptions (not company guidance, not facts). Edit assumptions on the Underwriting page.</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] md:grid-cols-4">
            {([
              [`${fc.years[t]} ARR`, fmtUsd(fc.arr[t])], [`${fc.years[t]} FCF proxy`, fmtUsd(fc.fcf[t])], ["Gross primary MOIC", fmtX(base.moicPrimary)], ["Gross primary IRR", fmtPct(base.irrPrimary)],
              ["Exit EV / ARR", fmtX(base.exitMultiple, 1)], ["Max pre-money at hurdle", fmtUsd(base.maxPrePrimary, { compact: true })], ["Hypothetical pre-money", fmtUsd(base.preMoney, { compact: true })], ["Hurdle result", primary.companies[id].gate],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}><dt className="text-[11px] uppercase tracking-wide text-mute">{k}</dt><dd className={`num font-semibold ${v.startsWith("(") || v.startsWith("-") ? "neg" : "text-navy"}`}>{v}</dd></div>
            ))}
          </dl>
        </div>
      </Section>

      <Section title="Risks and failure modes" id="risks" aside={<span className="text-[12px] text-mute">Workbook Risk Register · statuses are research work, not audited findings</span>}>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[760px]">
            <thead><tr><th>Domain</th><th>Potential thesis failure</th><th>Public evidence / indicator</th><th>Decision consequence</th><th>Src</th></tr></thead>
            <tbody>
              {risks.map((r) => (
                <tr key={r.domain + r.failure}>
                  <th scope="row" className="font-semibold text-navy">{r.domain}{r.company === "Both" && <span className="block text-[11px] font-normal text-mute">Both companies</span>}</th>
                  <td>{r.failure}</td><td>{r.evidence}</td><td className="font-medium">{r.consequence}</td><td><SourceRefs ids={[r.sourceId]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Open diligence requirements" id="diligence">
        <ul className="card list-disc space-y-1 py-3 pl-8 pr-4 text-[14px]">
          {c.diligence.map((d) => <li key={d}>{d}</li>)}
          {risks.filter((r) => r.company === "Both").map((r) => <li key={r.domain}>{r.requirement} <span className="text-mute">({r.domain})</span></li>)}
        </ul>
      </Section>

      <Section title="Key public references">
        <ul className="card divide-y divide-line">
          {c.links.map((l) => (
            <li key={l.href} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-teal underline">{l.label}</a>
              <SourceRefs ids={[l.src]} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Evidence provenance" id="provenance">
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[620px]">
            <thead><tr><th>ID</th><th>Evidence</th><th>Classification</th><th>Date</th></tr></thead>
            <tbody>
              {c.provenance.map((sid) => {
                const s = SOURCE_BY_ID[sid];
                return (
                  <tr key={sid}><td><SourceRefs ids={[sid]} /></td><td>{s.evidence} <span className="text-mute">— {s.establishes}</span></td><td>{s.classification}</td><td className="num whitespace-nowrap">{s.date}</td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
