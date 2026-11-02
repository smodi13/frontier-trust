"use client";
import { useId, useState } from "react";
import { clamp, type Limit } from "@/engine";
import { KindBadge } from "./ui";
import type { Kind } from "@/data/sources";

export type Unit = "pct" | "x" | "usd" | "years" | "ppt";
const SCALE: Record<Unit, number> = { pct: 100, ppt: 100, x: 1, usd: 1, years: 1 };

const dpOf = (step: number) => {
  const s = String(step);
  return s.includes(".") ? s.split(".")[1].length : 0;
};
const decimals = (unit: Unit, step: number) => dpOf(+(step * SCALE[unit]).toFixed(6));

export function NumberField({
  label, value, onChange, limit, unit, kind = "assumption", slider = false, hint, disabled = false,
}: {
  label: string; value: number; onChange: (v: number) => void; limit: Limit; unit: Unit;
  kind?: Kind; slider?: boolean; hint?: string; disabled?: boolean;
}) {
  const id = useId();
  const scale = SCALE[unit];
  const dp = decimals(unit, limit.step);
  const canonical = (+(value * scale).toFixed(dp + 2)).toString();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? canonical;
  const lo = limit.min * scale, hi = limit.max * scale;

  const live = (text: string) => {
    setDraft(text);
    const n = Number(text);
    if (text.trim() !== "" && Number.isFinite(n) && n >= lo - 1e-9 && n <= hi + 1e-9) onChange(clamp(n / scale, limit));
  };
  const commit = () => {
    const n = Number(draft);
    if (draft !== null && draft.trim() !== "" && Number.isFinite(n)) onChange(clamp(n / scale, limit));
    setDraft(null);
  };
  const pre = unit === "usd" ? "$" : "";
  const post = { pct: "%", ppt: " ppt", x: "x", usd: "M", years: " yrs" }[unit];

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[12.5px] font-medium text-ink">{label}</label>
        <KindBadge kind={kind} />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className={`flex w-32 shrink-0 items-center rounded border bg-white px-2 ${disabled ? "border-line bg-slate-50 text-mute" : "border-slate-400 focus-within:border-teal"}`}>
          {pre && <span className="text-mute">{pre}</span>}
          <input
            id={id} type="number" inputMode="decimal" disabled={disabled}
            min={lo} max={hi} step={+(limit.step * scale).toFixed(6)}
            value={shown}
            onChange={(e) => live(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="num w-full min-w-0 bg-transparent py-1 text-right text-[13px] outline-none disabled:cursor-not-allowed"
            aria-describedby={hint ? `${id}-h` : undefined}
          />
          <span className="pl-0.5 text-[12px] text-mute">{post}</span>
        </div>
        {slider && (
          <input
            type="range" aria-label={`${label} slider`} min={lo} max={hi} step={+(limit.step * scale).toFixed(6)}
            value={Math.min(hi, Math.max(lo, +canonical))}
            onChange={(e) => { setDraft(null); onChange(clamp(Number(e.target.value) / scale, limit)); }}
            className="h-1.5 w-full min-w-0 accent-teal"
          />
        )}
      </div>
      {hint && <p id={`${id}-h`} className="mt-0.5 text-[11.5px] text-mute">{hint}</p>}
    </div>
  );
}

/** Read-only sourced input, visually distinct from editable assumptions. */
export function LockedField({ label, display, kind, children }: { label: string; display: string; kind: Kind; children?: React.ReactNode }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-medium text-ink">{label}</span>
        <KindBadge kind={kind} />
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="num w-32 shrink-0 rounded border border-line bg-slate-50 px-2 py-1 text-right text-[13px] text-slate" aria-label={`${label} (sourced, not editable)`}>{display}</div>
        <span className="text-[11.5px] text-mute">{children}</span>
      </div>
    </div>
  );
}
