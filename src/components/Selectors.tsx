"use client";
import type { ReactNode } from "react";

/** Accessible single-choice toggle group (radio semantics). */
export function Segmented<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[] }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded border border-navy">
      {options.map((o) => (
        <button
          key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-[13px] font-medium ${value === o.value ? "bg-navy text-white" : "bg-white text-navy hover:bg-teal-soft"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
