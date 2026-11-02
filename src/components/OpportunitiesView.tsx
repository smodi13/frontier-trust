"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { NOTES, OPPORTUNITIES } from "@/data/sources";
import { Notice } from "./ui";

const uniq = (xs: string[]) => [...new Set(xs)].sort();
const MODELED: Record<string, string> = { Vanta: "/companies/vanta", Chainguard: "/companies/chainguard" };
const sel = "rounded border border-slate-400 bg-white px-2 py-1 text-[13px]";

export function OpportunitiesView() {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [segment, setSegment] = useState("");
  const [priority, setPriority] = useState("");
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return OPPORTUNITIES.filter(
      (o) =>
        (!region || o.region === region) && (!segment || o.segment === segment) && (!priority || o.priority === priority) &&
        (!t || [o.name, o.region, o.segment, o.priority, o.limitation].some((x) => x.toLowerCase().includes(t))),
    );
  }, [q, region, segment, priority]);
  const filtered = q || region || segment || priority;

  return (
    <>
      <div className="mb-4">
        <Notice title="Coverage universe, not a deal pipeline.">
          {NOTES.oppNote} Investment stage, price and accessibility are not validated for non-focus companies. Only Vanta and Chainguard have completed case-study financial models;
          every other name shows initial coverage status only: no diligence findings and no numeric scores.
        </Notice>
      </div>

      <form role="search" aria-label="Filter companies" className="card mb-3 flex flex-wrap items-end gap-3 p-3" onSubmit={(e) => e.preventDefault()}>
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-[12px] font-medium text-slate">Search
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, segment, limitation…" className={sel} />
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Research region
          <select value={region} onChange={(e) => setRegion(e.target.value)} className={sel}>
            <option value="">All regions</option>{uniq(OPPORTUNITIES.map((o) => o.region)).map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Market segment
          <select value={segment} onChange={(e) => setSegment(e.target.value)} className={sel}>
            <option value="">All segments</option>{uniq(OPPORTUNITIES.map((o) => o.segment)).map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Research priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={sel}>
            <option value="">All priorities</option>{uniq(OPPORTUNITIES.map((o) => o.priority)).map((x) => <option key={x}>{x}</option>)}
          </select>
        </label>
        <button type="button" disabled={!filtered} onClick={() => { setQ(""); setRegion(""); setSegment(""); setPriority(""); }} className="rounded border border-navy px-3 py-1 text-[13px] font-medium text-navy disabled:opacity-40">Clear filters</button>
      </form>

      <p className="mb-2 text-[12.5px] text-mute" role="status" aria-live="polite" data-testid="count">
        Showing {rows.length} of {OPPORTUNITIES.length} companies
      </p>
      <div className="card overflow-x-auto" tabIndex={0}>
        <table className="tbl min-w-[860px]">
          <thead><tr><th>Company</th><th>Research region</th><th>Market segment</th><th>Research priority</th><th>Public reference</th><th>Coverage status</th><th>Research limitation</th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.name}>
                <th scope="row" className="font-semibold text-navy">{MODELED[o.name] ? <Link href={MODELED[o.name]} className="underline">{o.name}</Link> : o.name}</th>
                <td>{o.region}</td>
                <td>{o.segment}</td>
                <td>{o.priority}</td>
                <td><a href={o.url} target="_blank" rel="noopener noreferrer" className="break-all text-teal underline">{o.url.replace(/^https?:\/\/(www\.)?/, "")}</a></td>
                <td className="text-[12.5px]">{MODELED[o.name] ? <strong className="text-teal">Case-study model completed</strong> : <span className="text-mute">Initial coverage only · not diligenced</span>}</td>
                <td>{o.limitation}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-mute">No companies match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] text-mute">Source: workbook sheet “Opportunity Screen”. Region labels are indicative research regions, not verified domicile or investability.</p>
    </>
  );
}
