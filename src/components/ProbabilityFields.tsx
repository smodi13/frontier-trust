"use client";
import { CASE_IDS, LIMITS, fmtPct } from "@/engine";
import { updateInputs, useModel } from "@/state/store";
import { NumberField } from "./Field";
import { Notice } from "./ui";

export function ProbabilityFields() {
  const { inputs, primary } = useModel();
  const sum = primary.probabilitySum;
  const off = Math.abs(sum - 1) > 1e-6;
  return (
    <>
      {CASE_IDS.map((k) => (
        <NumberField key={k} label={`${k[0].toUpperCase() + k.slice(1)} probability`} unit="pct" limit={LIMITS.probability} value={inputs.probabilities[k]}
          onChange={(v) => updateInputs((d) => { d.probabilities[k] = v; })} />
      ))}
      <p className={`mt-1 text-[12px] ${off ? "font-semibold neg" : "text-mute"}`}>Weights sum to {fmtPct(sum, 0)}</p>
      {off && <div className="mt-1.5"><Notice title="Weights do not sum to 100%.">Probability-weighted results use the weights as entered (they are not normalized) and are not a valid expectation until they total 100%.</Notice></div>}
    </>
  );
}
