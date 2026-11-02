"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  COMPANY_FILTERS, EVENT_CATEGORIES, SCORECARD, SEEDED_EVENTS, USER_KEY, WATCHLIST, sanitizeUserEvents, type EventCategory, type MonitorEvent,
} from "@/data/monitoring";
import { HISTORICAL, SOURCE_BY_ID } from "@/data/sources";
import { COMPANY_IDS, COMPANY_LABEL, fmtPct, fmtUsd, isNeg } from "@/engine";
import { useModel } from "@/state/store";
import { KindBadge, Notice, Section, SourceRefs } from "./ui";

// local user entries: tiny external store over localStorage
let cached: MonitorEvent[] | null = null;
const subs = new Set<() => void>();
const load = () => {
  if (cached) return cached;
  try { cached = sanitizeUserEvents(JSON.parse(localStorage.getItem(USER_KEY) ?? "[]")); } catch { cached = []; }
  return cached;
};
const EMPTY: MonitorEvent[] = [];
const save = (next: MonitorEvent[]) => { cached = next; try { localStorage.setItem(USER_KEY, JSON.stringify(next)); } catch { /* in-memory only */ } subs.forEach((s) => s()); };
const useUserEvents = () => useSyncExternalStore((l) => { subs.add(l); return () => { subs.delete(l); }; }, load, () => EMPTY);

const field = "w-full min-w-0 rounded border border-slate-400 bg-white px-2 py-1 text-[13px]";

export function MonitoringView() {
  const user = useUserEvents();
  const { primary, inputs } = useModel();
  const [company, setCompany] = useState("");
  const [category, setCategory] = useState("");
  const [origin, setOrigin] = useState("");
  const all = useMemo(() => [...SEEDED_EVENTS, ...user].sort((a, b) => b.sortKey.localeCompare(a.sortKey)), [user]);
  const rows = all.filter((e) => (!company || e.company === company) && (!category || e.category === category) && (!origin || e.origin === origin));
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({ date: today, company: "Vanta", category: "ARR milestone" as EventCategory, headline: "", url: "" });
  const [err, setErr] = useState("");
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.headline.trim()) return setErr("Enter a description.");
    if (form.url.trim() && !/^https?:\/\//i.test(form.url.trim())) return setErr("Source link must start with http:// or https://");
    const ev: MonitorEvent = { id: `u-${Date.now()}`, company: form.company, category: form.category, dateLabel: form.date, sortKey: form.date, headline: form.headline.trim(), origin: "user", userUrl: form.url.trim() || undefined, addedAt: new Date().toISOString() };
    save([...load(), ...sanitizeUserEvents([ev])]);
    setForm({ ...form, headline: "", url: "" });
    setErr("");
  };

  const arrPoints = HISTORICAL.filter((h) => h.measure.toLowerCase().includes("arr")).sort((a, b) => a.company.localeCompare(b.company) || a.date.localeCompare(b.date));

  return (
    <>
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Notice tone="info" title="Update mode: manual.">No automated feed, scraper or alert is connected. Nothing on this page updates by itself; it reflects the research register as of 2 Nov 2026 plus anything you add below.</Notice>
        <Notice tone="info" title="Research cutoff:">2 Nov 2026 (public material on or before this date). Latest dated register entry: {SEEDED_EVENTS.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.dateLabel)).at(-1)?.dateLabel}.</Notice>
        <Notice tone="info" title="User entries are unverified.">Entries you add are stored in this browser only, are labeled as user-entered, and are not evidence.</Notice>
      </div>

      <Section title="ARR milestones" aside={<span className="text-[12px] text-mute">Observed or estimated points from the Historical Inputs sheet</span>}>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[640px]">
            <thead><tr><th>Company</th><th>Measure</th><th className="r">Value</th><th>Observation date</th><th>Provenance</th><th>Evidence</th></tr></thead>
            <tbody>
              {arrPoints.map((h) => (
                <tr key={h.company + h.measure}>
                  <th scope="row" className="font-semibold text-navy">{h.company}</th><td>{h.measure}</td><td className="r num">{fmtUsd(h.value, { dp: 0 })}</td><td className="num whitespace-nowrap">{h.date}</td>
                  <td><KindBadge kind={h.dataType === "Company disclosure" ? "company" : "estimate"} /></td><td><SourceRefs ids={[h.sourceId]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-[12px] text-mute">Points are on different dates and of different quality; they are not a like-for-like growth series.</p>
      </Section>

      <Section title="Operating margin progression" aside={<KindBadge kind="calculated" />}>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[620px]">
            <thead><tr><th>Modeled base case</th><th>Metric</th>{primary.companies.vanta.forecasts.base.years.slice(1, inputs.holdYears + 1).map((y) => <th key={y} className="r">{y}E</th>)}<th>Observed</th></tr></thead>
            <tbody>
              {COMPANY_IDS.flatMap((id) => {
                const f = primary.companies[id].forecasts.base;
                return (["EBITDA margin proxy", "FCF margin proxy"] as const).map((m) => (
                  <tr key={id + m}>
                    <th scope="row" className="font-semibold text-navy">{COMPANY_LABEL[id]}</th><td>{m}</td>
                    {f.years.slice(1, inputs.holdYears + 1).map((y, i) => {
                      const v = m.startsWith("EBITDA") ? (f.ebitda[i + 1] as number) / f.revenue[i + 1] : (f.fcfMargin[i + 1] as number);
                      return <td key={y} className={`r num ${isNeg(v) ? "neg" : ""}`}>{fmtPct(v)}</td>;
                    })}
                    <td className="text-mute">None disclosed</td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-[12px] text-mute">Modeled targets to compare future disclosures against. Neither company has published operating margins; the model is not guidance.</p>
      </Section>

      <Section title="Event log" id="events">
        <form aria-label="Filter events" className="card mb-3 flex flex-wrap items-end gap-3 p-3" onSubmit={(e) => e.preventDefault()}>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Company
            <select className={field} value={company} onChange={(e) => setCompany(e.target.value)}><option value="">All</option>{COMPANY_FILTERS.map((c) => <option key={c}>{c}</option>)}<option>Both</option></select></label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Classification
            <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All</option>{EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-[12px] font-medium text-slate">Origin
            <select className={field} value={origin} onChange={(e) => setOrigin(e.target.value)}><option value="">All</option><option value="register">Research register</option><option value="user">User-entered</option></select></label>
          <span className="text-[12.5px] text-mute" role="status" data-testid="event-count">{rows.length} of {all.length} entries</span>
        </form>
        <div className="card overflow-x-auto" tabIndex={0}>
          <table className="tbl min-w-[900px]">
            <thead><tr><th>Date</th><th>Company</th><th>Classification</th><th>Event</th><th>Provenance</th><th>Evidence quality</th><th>Update mode</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((e) => {
                const s = e.sourceId ? SOURCE_BY_ID[e.sourceId] : undefined;
                return (
                  <tr key={e.id}>
                    <td className="num whitespace-nowrap">{e.dateLabel}</td><td>{e.company}</td><td>{e.category}</td><td>{e.headline}</td>
                    <td>{s ? <><SourceRefs ids={[s.id]} /> <span className="text-[11.5px] text-mute">{s.classification}</span></> : <><KindBadge kind="hypothetical" label="User-entered" />{e.userUrl && <> <a className="text-teal underline" href={e.userUrl} target="_blank" rel="noopener noreferrer">link</a></>}</>}</td>
                    <td className="text-[12.5px]">{s ? s.quality : "Unverified (user)"}</td>
                    <td className="text-[12.5px]">{e.origin === "register" ? "Manual · seeded from workbook research" : `Manual · added ${e.addedAt?.slice(0, 10) ?? "locally"}`}</td>
                    <td>{e.origin === "user" && <button className="text-[12px] text-neg underline" aria-label={`Delete entry: ${e.headline}`} onClick={() => save(load().filter((x) => x.id !== e.id))}>Delete</button>}</td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={8} className="py-5 text-center text-mute">No entries match.</td></tr>}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Add a manual monitoring entry">
        <form onSubmit={add} className="card grid gap-3 p-3 md:grid-cols-6" aria-label="Add monitoring entry">
          <label className="flex min-w-0 flex-col gap-1 text-[12px] font-medium text-slate md:col-span-1">Event date<input type="date" required value={form.date} max={today} onChange={(e) => setForm({ ...form, date: e.target.value })} className={field} /></label>
          <label className="flex min-w-0 flex-col gap-1 text-[12px] font-medium text-slate md:col-span-1">Company<select value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={field}>{[...COMPANY_FILTERS, "Both"].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="flex min-w-0 flex-col gap-1 text-[12px] font-medium text-slate md:col-span-2">Classification<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as EventCategory })} className={field}>{EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="flex min-w-0 flex-col gap-1 text-[12px] font-medium text-slate md:col-span-2">Source link (optional)<input type="url" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className={field} /></label>
          <label className="flex min-w-0 flex-col gap-1 text-[12px] font-medium text-slate md:col-span-5">What happened<input type="text" required maxLength={300} value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className={field} /></label>
          <div className="flex items-end"><button type="submit" className="w-full rounded bg-navy px-3 py-1.5 text-[13px] font-medium text-white">Add entry</button></div>
          {err && <p role="alert" className="text-[12.5px] font-semibold neg md:col-span-6">{err}</p>}
          <p className="text-[11.5px] text-mute md:col-span-6">Saved only in this browser (localStorage), labeled “User-entered · unverified”. It does not alter the model or the evidence register.</p>
        </form>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Watch items (not events)" aside={<span className="text-[12px] text-mute">Status: none observed as of 2 Nov 2026</span>}>
          <ul className="card divide-y divide-line">
            {WATCHLIST.map((w) => (
              <li key={w.item} className="px-3 py-2 text-[13.5px]"><strong className="text-navy">{w.company}:</strong> {w.item} <SourceRefs ids={[w.sourceId]} /><div className="text-[12px] text-mute">{w.why}</div></li>
            ))}
          </ul>
        </Section>
        <Section title="Monitoring scorecard" aside={<span className="text-[12px] text-mute">Memorandum §7 · no data feed</span>}>
          <div className="card overflow-x-auto" tabIndex={0}>
            <table className="tbl"><thead><tr><th>Item to track</th><th>Decision-relevant use</th></tr></thead>
              <tbody>{SCORECARD.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table>
          </div>
        </Section>
      </div>
    </>
  );
}
