"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { resetModel, useModel } from "@/state/store";

const NAV = [
  { href: "/", label: "Investment Overview", n: "1" },
  { href: "/opportunities", label: "Opportunity Landscape", n: "2" },
  { href: "/companies/vanta", label: "Vanta diligence", n: "3a", sub: true },
  { href: "/companies/chainguard", label: "Chainguard diligence", n: "3b", sub: true },
  { href: "/underwriting", label: "Financial Underwriting", n: "4" },
  { href: "/allocation", label: "Capital Allocation Lab", n: "5" },
  { href: "/committee", label: "Investment Committee", n: "6" },
  { href: "/monitoring", label: "Portfolio Monitoring", n: "7" },
  { href: "/evidence", label: "Evidence Center", n: "8" },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {NAV.map((i) => {
        const active = i.href === "/" ? path === "/" : path.startsWith(i.href);
        return (
          <Link
            key={i.href} href={i.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded px-2.5 py-1.5 text-[13px] ${i.sub ? "ml-5" : ""} ${active ? "bg-white/12 font-semibold text-white" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}
          >
            <span className="w-5 font-mono text-[10.5px] text-teal-300/90">{i.n}</span>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ModelStatus() {
  const { modified } = useModel();
  return modified ? (
    <div className="flex items-center gap-2 rounded border border-amber-500/60 bg-warn-bg px-2 py-1 text-[12px] text-warn-ink" role="status">
      <span>Assumptions differ from the workbook.</span>
      <button onClick={resetModel} className="rounded bg-warn-ink px-2 py-0.5 text-[11.5px] font-semibold text-white hover:opacity-90">Reset to original</button>
    </div>
  ) : (
    <span className="text-[12px] text-mute" role="status">Workbook assumptions (unmodified)</span>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">Skip to content</a>
      <aside className="hidden w-60 shrink-0 bg-navy px-3 py-5 text-white print:hidden lg:block">
        <div className="sticky top-5">
          <Link href="/" className="mb-5 block px-2.5">
            <div className="font-serif text-[20px] font-semibold tracking-tight">Frontier Trust</div>
            <div className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Growth equity underwriting</div>
          </Link>
          <Nav />
          <p className="mt-6 px-2.5 text-[11px] leading-snug text-slate-400">
            Independent public-information case study. Research cutoff 2 Nov 2026. Not affiliated with Ontario Teachers&apos;, Vanta or Chainguard.
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-40 bg-navy text-white print:hidden lg:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <Link href="/" className="font-serif text-[17px] font-semibold">Frontier Trust</Link>
          <button
            aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}
            className="rounded border border-white/30 px-2.5 py-1 text-[13px]"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
        {open && <div id="mobile-nav" className="border-t border-white/15 px-3 pb-3 pt-2"><Nav onNavigate={() => setOpen(false)} /></div>}
      </header>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-1.5 text-[12px] print:hidden lg:px-8">
          <span className="font-semibold text-warn-ink">Illustrative: entry prices and forecasts are analyst assumptions, not offers or company guidance.</span>
          <ModelStatus />
        </div>
        <main id="main" className="mx-auto max-w-[1180px] px-4 py-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-[1180px] border-t border-line px-4 py-5 text-[11.5px] text-mute lg:px-8">
          Independent work sample using public information as of 2 Nov 2026. Not investment advice, not a valuation opinion, and not endorsed by or produced for
          Ontario Teachers&apos; Pension Plan, Teachers&apos; Venture Growth, Vanta or Chainguard. The 20% hurdle is an analyst assumption, not a TVG requirement.
        </footer>
      </div>
    </div>
  );
}
