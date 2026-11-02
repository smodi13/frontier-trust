"use client";
import {
  Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CASE_IDS, COMPANY_IDS, COMPANY_LABEL, fmtPct, fmtUsd, type CompanyId, type Forecast, type ModelResult, type CaseId } from "@/engine";

export const COLOR: Record<CompanyId, string> = { vanta: "#14305a", chainguard: "#0f766e" };
const CASE_COLOR: Record<CaseId, string> = { bear: "#a1302a", base: "#14305a", bull: "#0f766e" };
const CASE_LABEL: Record<CaseId, string> = { bear: "Bear", base: "Base", bull: "Bull" };
const axis = { fontSize: 11, fill: "#4a5868" };

/** Gross IRR by case for both companies, with the hurdle line. */
export function ScenarioIrrChart({ result, hurdle }: { result: ModelResult; hurdle: number }) {
  const data = CASE_IDS.map((k) => ({
    name: CASE_LABEL[k],
    ...Object.fromEntries(COMPANY_IDS.map((c) => [c, result.companies[c].returns[k].irr])),
  }));
  return (
    <div role="img" aria-label={`Gross IRR by scenario for Vanta and Chainguard versus the ${fmtPct(hurdle, 0)} hurdle`} className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e8ec" vertical={false} />
          <XAxis dataKey="name" tick={axis} tickLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={(v) => fmtPct(v as number, 0)} width={44} domain={[(min: number) => Math.floor((Math.min(min, 0) - 0.03) / 0.1) * 0.1, (max: number) => Math.ceil((Math.max(max, hurdle) + 0.03) / 0.1) * 0.1]} />
          <Tooltip formatter={(v) => fmtPct(v as number)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#1d2733" />
          <ReferenceLine y={hurdle} stroke="#a1302a" strokeDasharray="5 4" label={{ value: `Hurdle ${fmtPct(hurdle, 0)}`, position: "insideTopLeft", fontSize: 11, fill: "#a1302a" }} />
          {COMPANY_IDS.map((c) => (
            <Bar key={c} dataKey={c} name={COMPANY_LABEL[c]} fill={COLOR[c]} isAnimationActive={false}>
              <LabelList dataKey={c} position="top" formatter={(v) => fmtPct(v as number)} style={{ fontSize: 11, fill: "#1d2733" }} />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** ARR trajectory by case. */
export function ArrChart({ forecasts }: { forecasts: Record<CaseId, Forecast> }) {
  const f = forecasts.base;
  const data = f.years.map((y, i) => ({ year: String(y), ...Object.fromEntries(CASE_IDS.map((k) => [k, forecasts[k].arr[i]])) }));
  return (
    <div role="img" aria-label="Modeled year-end ARR by scenario" className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e8ec" vertical={false} />
          <XAxis dataKey="year" tick={axis} tickLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => fmtUsd(v as number, { dp: 0 })} />
          <Tooltip formatter={(v) => fmtUsd(v as number, { dp: 0 })} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {CASE_IDS.map((k) => (
            <Line key={k} dataKey={k} name={CASE_LABEL[k]} stroke={CASE_COLOR[k]} strokeWidth={2} dot={{ r: 2.5 }} isAnimationActive={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** FCF proxy by case (bars). */
export function FcfChart({ forecasts }: { forecasts: Record<CaseId, Forecast> }) {
  const f = forecasts.base;
  const data = f.years.slice(1).map((y, i) => ({ year: String(y), ...Object.fromEntries(CASE_IDS.map((k) => [k, forecasts[k].fcf[i + 1]])) }));
  return (
    <div role="img" aria-label="Modeled free cash flow proxy by scenario" className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e8ec" vertical={false} />
          <XAxis dataKey="year" tick={axis} tickLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => fmtUsd(v as number, { dp: 0 })} />
          <Tooltip formatter={(v) => fmtUsd(v as number)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#1d2733" />
          {CASE_IDS.map((k) => <Bar key={k} dataKey={k} name={CASE_LABEL[k]} fill={CASE_COLOR[k]} isAnimationActive={false} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Entry pre-money versus the model-derived maximum at the hurdle. */
export function PriceChart({ rows }: { rows: { name: string; modeled: number; max: number }[] }) {
  return (
    <div role="img" aria-label="Modeled entry pre-money versus maximum pre-money at the hurdle" className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={rows} margin={{ top: 18, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e5e8ec" vertical={false} />
          <XAxis dataKey="name" tick={axis} tickLine={false} />
          <YAxis tick={axis} tickLine={false} axisLine={false} width={52} tickFormatter={(v) => `$${((v as number) / 1000).toFixed(1)}B`} />
          <Tooltip formatter={(v) => fmtUsd(v as number, { compact: true })} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="modeled" name="Modeled entry (hypothetical)" fill="#8a97a8" isAnimationActive={false}>
            <LabelList dataKey="modeled" position="top" formatter={(v) => fmtUsd(v as number, { compact: true })} style={{ fontSize: 11 }} />
          </Bar>
          <Bar dataKey="max" name="Max at hurdle (calculated)" fill="#0f766e" isAnimationActive={false}>
            <LabelList dataKey="max" position="top" formatter={(v) => fmtUsd(v as number, { compact: true })} style={{ fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
