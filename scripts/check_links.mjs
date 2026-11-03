// Honest link check: declared non-browser User-Agent, one GET per hop, 1.2 s spacing, no retries, no bypass of access controls.
// Classification: accessible (2xx) | redirected (3xx -> 2xx) | restricted (401/403/429/5xx/timeout/other: inconclusive) | broken (404/410/DNS failure).
// Writes src/data/link-checks.json. Run: node scripts/check_links.mjs
import fs from "node:fs";
const read = (p) => JSON.parse(fs.readFileSync(new URL(`../src/data/${p}`, import.meta.url)));
const wb = read("workbook.json"), over = read("url-overrides.json"), val = read("valuation-sources.json");
const X = ["harness", "workspaces", "checks"].map((s) => `https://www.chainguard.dev/unchained/introducing-chainguard-${s}`);
const urls = [...new Set([...wb.sources.map((s) => over[s.id] ?? s.url), ...X, ...val.map((v) => v.url)])];
const UA = "FrontierTrustLinkCheck/1.0 (+https://github.com/smodi13/frontier-trust; automated, non-browser, low-volume)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function check(url) {
  let cur = url, hops = 0;
  try {
    for (;;) {
      const r = await fetch(cur, { method: "GET", redirect: "manual", headers: { "user-agent": UA, accept: "text/html,*/*" }, signal: AbortSignal.timeout(20000) });
      r.body?.cancel();
      if (r.status >= 300 && r.status < 400 && r.headers.get("location") && hops < 5) { cur = new URL(r.headers.get("location"), cur).href; hops++; continue; }
      const s = r.status;
      const status = s >= 200 && s < 300 ? (hops ? "redirected" : "accessible") : s === 404 || s === 410 ? "broken" : "restricted";
      return { status, http: s, finalUrl: hops ? cur : undefined };
    }
  } catch (e) {
    const code = e?.cause?.code ?? e?.name;
    return { status: code === "ENOTFOUND" ? "broken" : "restricted", http: null, error: String(code) };
  }
}
const out = {};
for (const u of urls) { out[u] = { ...(await check(u)), checkedAt: new Date().toISOString().slice(0, 10) }; console.log(out[u].status.padEnd(10), out[u].http ?? out[u].error, u.slice(0, 90)); await sleep(1200); }
fs.writeFileSync(new URL("../src/data/link-checks.json", import.meta.url), JSON.stringify({ method: "Automated HTTP GET with a declared non-browser client (one request per hop, no retries, no bypass).", client: UA, results: out }, null, 1));
