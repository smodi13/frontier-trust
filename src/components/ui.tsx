import Link from "next/link";
import type { ReactNode } from "react";
import type { Kind } from "@/data/sources";
import { isNeg } from "@/engine";
import { LINK_LABEL, linkCheck, type LinkStatus } from "@/data/linkchecks";

const KIND: Record<Kind, { label: string; cls: string }> = {
  company: { label: "Company disclosure", cls: "bg-teal-soft text-teal border-teal/40" },
  independent: { label: "Independent source", cls: "bg-teal-soft text-teal border-teal/40" },
  estimate: { label: "Third-party estimate", cls: "bg-warn-bg text-warn-ink border-amber-400/60" },
  press: { label: "Press report", cls: "bg-slate-100 text-slate border-slate-400/50" },
  assumption: { label: "Analyst assumption", cls: "bg-white text-navy-2 border-navy-2/50" },
  hypothetical: { label: "Hypothetical pricing", cls: "bg-white text-navy-2 border-dashed border-navy-2/60" },
  calculated: { label: "Calculated", cls: "bg-navy text-white border-navy" },
};

export function KindBadge({ kind, label }: { kind: Kind; label?: string }) {
  const k = KIND[kind];
  return (
    <span className={`inline-block whitespace-nowrap rounded border px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-wide ${k.cls}`}>
      {label ?? k.label}
    </span>
  );
}

/** Clickable citation chips linking to the evidence record(s). */
export function SourceRefs({ ids }: { ids: string[] }) {
  return (
    <span className="inline-flex flex-wrap gap-1 align-baseline">
      {ids.map((id) => (
        <Link
          key={id}
          href={`/evidence#${id}`}
          aria-label={`Evidence record ${id}`}
          className="rounded border border-line bg-white px-1 py-px font-mono text-[10.5px] font-semibold text-navy-2 hover:bg-teal-soft"
        >
          {id}
        </Link>
      ))}
    </span>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-5 border-b border-line pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal">{eyebrow}</p>
      <h1 className="mt-1 text-[28px] leading-tight font-semibold">{title}</h1>
      {children && <div className="mt-2 max-w-3xl text-[14px] text-slate">{children}</div>}
    </header>
  );
}

export function Section({ title, id, aside, children }: { title: string; id?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mb-6" aria-labelledby={id ? `${id}-h` : undefined}>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={id ? `${id}-h` : undefined} className="text-[18px] font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Notice({ tone = "warn", title, children }: { tone?: "warn" | "info"; title?: string; children: ReactNode }) {
  const cls = tone === "warn" ? "border-amber-500/50 bg-warn-bg text-warn-ink" : "border-teal/40 bg-teal-soft text-navy";
  return (
    <div role="note" className={`rounded border px-3 py-2 text-[13px] ${cls}`}>
      {title && <strong className="mr-1">{title}</strong>}
      {children}
    </div>
  );
}

export function Kpi({ label, value, sub, negative, kind }: { label: string; value: ReactNode; sub?: ReactNode; negative?: boolean; kind?: Kind }) {
  return (
    <div className="card px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-mute">{label}</div>
      </div>
      <div className={`num mt-0.5 text-[24px] leading-none font-semibold ${negative ? "neg" : "text-navy"}`}>{value}</div>
      {(sub || kind) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11.5px] text-mute">
          {kind && <KindBadge kind={kind} />}
          {sub}
        </div>
      )}
    </div>
  );
}

/** Table cell value that colours negatives. */
export function Val({ v, children }: { v: number | null | undefined; children: ReactNode }) {
  return <span className={`num ${isNeg(v) ? "neg" : ""}`}>{children}</span>;
}

export function Legend() {
  const kinds: Kind[] = ["company", "estimate", "press", "assumption", "hypothetical", "calculated"];
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px] text-mute" aria-label="Data provenance legend">
      <span className="font-semibold text-slate">Provenance:</span>
      {kinds.map((k) => <KindBadge key={k} kind={k} />)}
    </div>
  );
}

export function StaticDownloadsNotice({ modified }: { modified: boolean }) {
  return (
    <Notice tone={modified ? "warn" : "info"} title={modified ? "Downloads have not changed." : "Downloads are fixed snapshots."}>
      {modified
        ? "You have edited assumptions on this website. The downloadable Excel model, executive brief, memorandum and presentation are unchanged original research snapshots; the workbook does not update from website inputs."
        : "The downloadable Excel model, PDFs and presentation are fixed research snapshots. Edits made on this website never change them, and the workbook does not update from website inputs."}
    </Notice>
  );
}

const LIMITS_LIST = [
  "The 2026 ARR inputs are observation-date snapshots (Vanta, 29 Apr 2026; Chainguard, Jun 2026 third-party estimate), not necessarily December 2026 ending ARR.",
  "The forecast is an illustrative model built on those dated ARR anchors, not a company projection or guidance.",
  "The revenue proxy (a fixed share of ARR) is not reported GAAP revenue.",
  "EBITDA and free cash flow are calculated proxies from assumed cost ratios, not company-disclosed results.",
  "The 20% gross IRR hurdle is an analyst assumption, not a Teachers' Venture Growth (TVG) requirement.",
  "The equity model assumes simple pro rata common-equity economics; preferred equity rights and liquidation waterfalls are excluded.",
  "Actual current capitalization and outstanding claims have not been verified.",
  "Investor-specific fees, taxes and FX are not modeled; returns are gross.",
  "Entry prices are hypothetical. Nothing here implies that any investment is available or that shares can be bought at these prices.",
];

export function ModelLimitations() {
  return (
    <Section title="Model limitations and transaction structure" id="limitations">
      <ul className="card list-disc space-y-1 py-3 pl-8 pr-4 text-[13.5px]">
        {LIMITS_LIST.map((t) => <li key={t}>{t}</li>)}
      </ul>
    </Section>
  );
}

const LINK_CLS: Record<LinkStatus, string> = {
  accessible: "bg-teal-soft text-teal border-teal/40",
  redirected: "bg-teal-soft text-teal border-teal/40",
  restricted: "bg-warn-bg text-warn-ink border-amber-400/60",
  broken: "bg-white text-neg border-neg",
  unchecked: "bg-slate-100 text-slate border-slate-400/50",
};
/** Result of the automated link check recorded in link-checks.json. A 403 is inconclusive, never "verified" and never "broken". */
export function LinkStatusBadge({ url }: { url: string }) {
  const c = linkCheck(url);
  return (
    <span data-link-status={c.status} className={`inline-block rounded border px-1.5 py-px text-[10.5px] font-semibold leading-tight ${LINK_CLS[c.status]}`} title={c.http ? `HTTP ${c.http} on ${c.checkedAt}` : undefined}>
      {LINK_LABEL[c.status]}{c.http && c.status === "restricted" ? ` (HTTP ${c.http})` : ""}
    </span>
  );
}
