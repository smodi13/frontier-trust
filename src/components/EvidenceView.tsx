"use client";
import { useMemo, useState } from "react";
import { DOWNLOADS, downloadHref } from "@/data/downloads";
import { HISTORICAL, NOTES, QUALITY_BY_CLASSIFICATION, SOURCES, kindOfDataType } from "@/data/sources";
import { KindBadge, Notice, Section, SourceRefs } from "./ui";

const uniq = (xs: string[]) => [...new Set(xs)].sort();
const sel = "rounded border border-slate-400 bg-white px-2 py-1 text-[13px]";
const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

export function EvidenceView() {
  const [entity, setEntity] = useState("");
  const [type, setType] = useState("");
  const [quality, setQuality] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [claim, setClaim] = useState("");

  const rows = useMemo(() => {
    const t = claim.trim().toLowerCase();
    return SOURCES.filter((s) => {
      if (entity && s.entity !== entity) return false;
      if (type && s.classification !== type) return false;
      if (quality && s.quality !== quality) return false;
      if ((from || to) && !s.isoDate) return false; // undated/estimated records can't satisfy a date range
      if (from && s.isoDate! < from) return false;
      if (to && s.isoDate! > to) return false;
      return !t || [s.id, s.evidence, s.establishes].some((x) => x.toLowerCase().includes(t));
    });
  }, [entity, type, quality, from, to, claim]);
  const active = entity || type || quality || from || to || claim;

  return (
    <>
      <Section title="Research source register" id="register" aside={<span className="text-[12px] text-mute">Workbook sheet “Sources” · imported verbatim · as of 2 Nov 2026</span>}>
        <form role="search" aria-label="Filter evidence" className="card mb-3 flex flex-wrap items-end gap-3 p-3" onSubmit={(e) => e.preventDefault()}>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Company / entity
            <select className={sel} value={entity} onChange={(e) => setEntity(e.target.value)}><option value="">All</option>{uniq(SOURCES.map((s) => s.entity)).map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Source type
            <select className={sel} value={type} onChange={(e) => setType(e.target.value)}><option value="">All</option>{uniq(SOURCES.map((s) => s.classification)).map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Evidence quality
            <select className={sel} value={quality} onChange={(e) => setQuality(e.target.value)}><option value="">All</option>{uniq(SOURCES.map((s) => s.quality)).map((x) => <option key={x}>{x}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Evidence date from
            <input type="date" className={sel} value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">to
            <input type="date" className={sel} value={to} onChange={(e) => setTo(e.target.value)} /></label>
          <label className="flex min-w-44 flex-1 flex-col gap-1 text-[12px] font-medium text-slate">Claim / keyword
            <input type="search" className={sel} placeholder="e.g. ARR, valuation, Docker" value={claim} onChange={(e) => setClaim(e.target.value)} /></label>
          <button type="button" disabled={!active} onClick={() => { setEntity(""); setType(""); setQuality(""); setFrom(""); setTo(""); setClaim(""); }} className="rounded border border-navy px-3 py-1 text-[13px] font-medium text-navy disabled:opacity-40">Clear</button>
        </form>
        <p className="mb-2 text-[12.5px] text-mute" role="status" aria-live="polite" data-testid="evidence-count">Showing {rows.length} of {SOURCES.length} records{(from || to) && " (date filters exclude records without an exact date)"}</p>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[980px]">
            <thead><tr><th>ID</th><th>Entity</th><th>Evidence</th><th>Source type</th><th>Evidence quality</th><th>What it establishes</th><th>Evidence date</th><th>Source</th></tr></thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} id={s.id}>
                  <th scope="row" className="font-mono text-navy">{s.id}</th><td>{s.entity}</td><td>{s.evidence}</td><td>{s.classification}</td><td className="text-[12.5px]">{s.quality}</td>
                  <td>{s.establishes}</td><td className="num whitespace-nowrap">{s.date}</td>
                  <td><a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`Open source ${s.id}: ${s.evidence}`} className="break-all text-teal underline">{new URL(s.url).hostname.replace(/^www\./, "")}</a></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-mute">No records match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Sourced metrics → evidence" id="metrics" aside={<span className="text-[12px] text-mute">Workbook sheet “Historical Inputs”</span>}>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[900px]">
            <thead><tr><th>Company</th><th>Measure</th><th className="r">Value</th><th>Provenance</th><th>Observation date</th><th>Interpretation</th><th>Evidence</th></tr></thead>
            <tbody>
              {HISTORICAL.map((h) => (
                <tr key={h.company + h.measure}>
                  <th scope="row" className="font-semibold text-navy">{h.company}</th><td>{h.measure}</td>
                  <td className="r num">{h.units.startsWith("$m") ? `$${h.value.toLocaleString("en-US")}M` : h.value.toLocaleString("en-US")}{h.units === "customers" && " customers"}</td>
                  <td><KindBadge kind={kindOfDataType(h.dataType)} /> <span className="text-[11.5px] text-mute">{h.quality}</span></td>
                  <td className="num whitespace-nowrap">{h.date}</td><td>{h.interpretation}</td><td><SourceRefs ids={[h.sourceId]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 space-y-1.5">{NOTES.historicalCautions.map((c) => <Notice key={c}>{c}</Notice>)}</div>
      </Section>

      <Section title="Methodology" id="methodology">
        <div className="grid gap-3 md:grid-cols-2">
          {([
            ["Historical inputs", "company", "Publicly disclosed ARR, valuations, financings and customer counts, each with an observation date and source ID. These are the only company facts that enter the model, and they are read-only in the application."],
            ["Third-party estimates", "estimate", "Vendor-independent estimates (Sacra for Vanta's 2025 year-end ARR and Chainguard's June 2026 ARR) and press reports. They are unaudited and displayed with an “estimate” label; Chainguard's 2026 anchor is an estimate, not a disclosure."],
            ["Analyst assumptions", "assumption", "Growth, decay, margins, cost intensity, exit multiples, exit net debt, dilution, scenario probabilities, check size and the 20% hurdle. They are illustrative, editable inputs, not company guidance and not a TVG policy. Entry pre-money values are hypothetical and imply no availability."],
            ["Derived calculations", "calculated", "Everything else (ARR trajectories, revenue proxy, EBITDA, FCF, ownership, exit equity, MOIC, IRR, maximum entry, weighted proceeds, sensitivities) is computed by a typed engine that reproduces the workbook's formulas cell-for-cell, with no hardcoded derived outputs."],
          ] as const).map(([h, k, b]) => (
            <div key={h} className="card p-3"><div className="mb-1 flex items-center justify-between"><h3 className="font-sans text-[14px] font-semibold">{h}</h3><KindBadge kind={k} /></div><p className="text-[13.5px]">{b}</p></div>
          ))}
        </div>
        <div className="card mt-3 p-3 text-[13.5px]">
          <h3 className="mb-1 font-sans text-[14px] font-semibold">Limitations and research cutoff</h3>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Research cutoff:</strong> 2 November 2026. Public material on or before this date; dates for undated pages are the date viewed.</li>
            {NOTES.readme.filter(([k]) => ["Not a TVG return target", "Not a live offer", "Economics", "Public gaps", "Scope exclusions", "Primary vs secondary", "Exit net debt"].includes(k)).map(([k, v]) => <li key={k}><strong>{k}:</strong> {v}</li>)}
            <li><strong>Returns:</strong> gross, before fees, taxes and FX; no preferred rights, liquidation waterfall, anti-dilution or participation modeled.</li>
          </ul>
          <h3 className="mb-1 mt-3 font-sans text-[14px] font-semibold">Evidence-quality labels</h3>
          <p className="mb-1">The workbook records a source classification for each record. This application groups those classifications into the quality labels used for filtering; the grouping is descriptive, not a score:</p>
          <table className="tbl"><thead><tr><th>Workbook classification</th><th>Evidence-quality label</th></tr></thead>
            <tbody>{Object.entries(QUALITY_BY_CLASSIFICATION).map(([k, v]) => <tr key={k}><td>{k}</td><td>{v}</td></tr>)}</tbody></table>
        </div>
      </Section>

      <Section title="Original documents" id="downloads" aside={<span className="text-[12px] text-mute">Unmodified originals · SHA-256 shown for verification</span>}>
        <ul className="grid gap-3 md:grid-cols-2">
          {DOWNLOADS.map((d) => (
            <li key={d.file} className="card p-3">
              <p className="font-semibold text-navy">{d.title}</p>
              <p className="text-[12.5px] text-mute">{d.description} · {kb(d.bytes)}</p>
              <p className="mt-1 break-all font-mono text-[10.5px] text-mute">sha256 {d.sha256}</p>
              <a href={downloadHref(d.file)} download className="mt-2 inline-block rounded bg-navy px-3 py-1.5 text-[13px] font-medium text-white">Download {d.file.split(".").pop()?.toUpperCase()}</a>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
