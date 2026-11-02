import { useMemo, useSyncExternalStore } from "react";
import { evaluate, getDefaults, sanitizeInputs, type EntryType, type ModelInputs } from "@/engine";

/** Tiny external store: model inputs + UI entry type, persisted to localStorage (no backend). Stored data is
 * always re-validated through sanitizeInputs(), so a corrupt/old/tampered value falls back to workbook defaults. */
interface State { inputs: ModelInputs; entry: EntryType }
export const STORAGE_KEY = "frontier-trust:model:v1";
const DEFAULT_STATE: State = { inputs: getDefaults(), entry: "primary" };

let state: State = DEFAULT_STATE;
let loaded = false;
const listeners = new Set<() => void>();

function read(): State {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const p = JSON.parse(raw);
    return { inputs: sanitizeInputs(p?.inputs), entry: p?.entry === "secondary" ? "secondary" : "primary" };
  } catch {
    return DEFAULT_STATE;
  }
}
function commit(next: State) {
  state = next;
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* storage unavailable (private mode / quota): keep working in-memory */ }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) { state = read(); l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}
const getSnapshot = () => {
  if (!loaded) { loaded = true; state = read(); }
  return state;
};
const getServerSnapshot = () => DEFAULT_STATE;

export const updateInputs = (fn: (draft: ModelInputs) => void) => {
  const draft = structuredClone(getSnapshot().inputs);
  fn(draft);
  commit({ ...state, inputs: draft });
};
export const setEntry = (entry: EntryType) => commit({ ...getSnapshot(), entry });
export const resetModel = () => commit({ inputs: getDefaults(), entry: "primary" });
/** test helper */
export const __resetStoreForTests = () => { loaded = false; state = DEFAULT_STATE; listeners.forEach((l) => l()); };

export function useModel() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const primary = useMemo(() => evaluate(s.inputs, "primary"), [s.inputs]);
  const selected = useMemo(() => (s.entry === "primary" ? primary : evaluate(s.inputs, s.entry)), [s.inputs, s.entry, primary]);
  const modified = useMemo(() => JSON.stringify(s.inputs) !== JSON.stringify(DEFAULT_STATE.inputs), [s.inputs]);
  return { inputs: s.inputs, entry: s.entry, primary, selected, modified, defaults: DEFAULT_STATE.inputs };
}
