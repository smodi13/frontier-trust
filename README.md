# Frontier Trust

Institutional-style growth equity underwriting platform: a $100M allocation decision between Vanta and Chainguard. Independent public-information case study (research cutoff 2 Nov 2026); entry prices and forecasts are illustrative analyst assumptions.

- `src/engine` — typed, React-free calculation engine mirroring the workbook formulas (parity-tested cell-for-cell against Excel's cached values in `src/engine/workbook-cache.json`).
- `src/data/workbook.json` — static inputs/records extracted from the original workbook by `scripts/extract_workbook.py` (workbook is never modified).
- `source-documents/` and `public/downloads/` — the four original documents, byte-identical (SHA-256 manifest in `src/data/downloads.json`).

```
npm run dev | build | start
npm run lint && npm run typecheck
npm test            # vitest: unit, workbook parity, component, file integrity
npm run test:e2e    # playwright (build first): routes, a11y, filters, downloads, 3 viewports
```
No backend, database or login. User edits persist in browser localStorage only.
