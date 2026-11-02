import type { CompanyId } from "@/engine";
import { hist, kindOfDataType, type Kind } from "./sources";

/** Narrative content is drawn only from the memorandum, brief, workbook (Sources / Risk Register / Historical Inputs).
 * Numeric facts are looked up from the workbook extract rather than retyped. */
export interface Para { text: string; src: string[] }
export interface Fact { label: string; value: string; kind: Kind; src: string[]; note?: string }

const usd = (n: number, u: string) => (u.startsWith("$m") ? (n >= 1000 ? `$${(n / 1000).toFixed(2)}B` : `$${n}M`) : `${n.toLocaleString("en-US")}`);
const fact = (company: string, measure: string, label: string, note?: string): Fact => {
  const h = hist(company, measure);
  return { label, value: `${usd(h.value, h.units)}${h.units.includes("customers") ? " customers" : ""}`, kind: kindOfDataType(h.dataType), src: [h.sourceId], note: `${h.date} · ${note ?? h.interpretation}` };
};

export interface CompanyContent {
  id: CompanyId;
  name: string;
  tagline: string;
  anchorNotice: { title: string; body: string };
  businessModel: Para[];
  products: Para[];
  positioning: Para[];
  facts: Fact[];
  funding: Fact[];
  competition: Para[];
  thesis: Para[];
  links: { label: string; href: string; src: string }[];
  diligence: string[];
  provenance: string[];
}

export const COMPANIES: Record<CompanyId, CompanyContent> = {
  vanta: {
    id: "vanta",
    name: "Vanta",
    tagline: "Enterprise compliance automation and trust workflows",
    anchorNotice: {
      title: "Two different dates — do not divide one by the other.",
      body: "The $300M+ ARR is a company disclosure from April 2026. The $4.15B valuation is the post-money mark from the July 2025 Series D. Dividing a 2025 valuation by 2026 ARR illustrates scale but is not a priced transaction multiple, and the July 2025 mark is not a November 2026 purchase price.",
    },
    businessModel: [
      { text: "Vanta sells compliance and trust-management software that is measured on a recurring-revenue (ARR) basis. The public record describes a product that has broadened from compliance automation to ongoing trust management, GRC, risk and verification workflows.", src: ["S02", "S03", "S16"] },
      { text: "Pricing structure, segment mix (startup vs. enterprise), gross margin, retention cohorts and CAC payback are not publicly verified in the source set. Model values for these are analyst assumptions.", src: ["S02"] },
    ],
    products: [
      { text: "The company describes continuous controls monitoring and workflows (vendor perspective). The memorandum lists compliance monitoring, vendor risk, trust workflows and broader GRC as the announced offering.", src: ["S16", "S02"] },
    ],
    positioning: [
      { text: "Vanta hosts an excerpt of a Forrester Q2 2026 evaluation of GRC platforms that names it a Leader. The excerpt is reproduced by Vanta, so it is independent in origin but vendor-curated in presentation.", src: ["S05"] },
      { text: "Positioning against incumbents and other compliance-automation vendors has not been tested with buyer or lost-deal interviews; that is a stated diligence requirement.", src: ["S05"] },
    ],
    facts: [
      fact("Vanta", "2026 ARR run-rate", "ARR run-rate (≥ $300M)", "ARR milestone, not full-year revenue"),
      fact("Vanta", "Customers", "Customers", "Unsegmented customer count"),
      fact("Vanta", "2025 YE ARR", "Year-end 2025 ARR"),
      { label: "Time from $200M to $300M ARR", value: "Nine months", kind: "company", src: ["S02"], note: "As summarised in the committee memorandum" },
      { label: "Net revenue retention", value: "Reported above 100% by press, citing unnamed sources", kind: "press", src: ["S06"], note: "No audited cohort or retention schedule; do not treat as a verified percentage" },
    ],
    funding: [
      fact("Vanta", "Last equity valuation", "Last disclosed valuation (post-money)"),
      fact("Vanta", "2025 Series D primary proceeds", "Series D primary proceeds"),
    ],
    competition: [
      { text: "Compliance automation peers in the coverage universe: Drata, Secureframe, Sprinto, Scrut Automation, Hyperproof and Anecdotes. These are coverage entries for market mapping only; no competitive data has been verified.", src: ["S05"] },
      { text: "Broader GRC incumbents (OneTrust, AuditBoard) are tracked as benchmarks. The risk register flags that large GRC incumbents could win strategic enterprise accounts and that point compliance workflows could commoditize.", src: ["S05", "S16"] },
    ],
    thesis: [
      { text: "Enterprise demand for continuous controls is recurring and embedded in workflows; cross-sell of GRC, third-party risk and trust workflows increases durability; and management converts growth into free cash flow without chronic external funding.", src: ["S02", "S16"] },
      { text: "AI governance is a plausible demand tailwind but compliance dates and standards adoption should be validated by specialist counsel; it must not be used as an unsupported growth kicker.", src: ["S02"] },
    ],
    links: [
      { label: "Vanta crosses $300M ARR (company, 29 Apr 2026)", href: "https://www.vanta.com/resources/vanta-crosses-300m-in-arr-as-growth-accelerates", src: "S02" },
      { label: "Vanta Series D announcement (company, 23 Jul 2025)", href: "https://www.vanta.com/resources/vanta-announces-series-d", src: "S03" },
      { label: "Fortune interview on ARR and NRR (press, 29 Apr 2026)", href: "https://fortune.com/2026/04/29/exclusive-vanta-arr-300-million-sequoia-shadow-ai-claude-cursor/", src: "S06" },
    ],
    diligence: [
      "Signed ARR bridge, monthly cohort NRR/GRR and a billing-to-revenue tie-out (register: STOP without reconciled SaaS KPIs).",
      "Segment ARR by customer size, product, geography and renewal economics to test enterprise cross-sell.",
      "Audited financials, gross margin, SBC, CAC payback, cohort profitability and cash burn.",
      "10+ buyer / lost-deal interviews; price comparison against named rivals.",
      "Live financing or firm secondary indication, full term sheet, fully diluted cap table and preference waterfall.",
    ],
    provenance: ["S02", "S03", "S04", "S05", "S06", "S16"],
  },
  chainguard: {
    id: "chainguard",
    name: "Chainguard",
    tagline: "Secure-by-default open-source containers and libraries",
    anchorNotice: {
      title: "The June 2026 ARR figure is a third-party estimate.",
      body: "Sacra estimates roughly $100M ARR in June 2026. Chainguard has not disclosed it; the last company-disclosed ARR is $40M from April 2025, a different date. The estimate drives the model's starting point, so every downstream figure inherits its uncertainty.",
    },
    businessModel: [
      { text: "Chainguard seeks to monetize hardened open-source artifacts: container image rebuilds, libraries, verified software provenance, vulnerability remediation and enterprise-grade service. Its public pricing is structured by engineering team size and multiple products.", src: ["S13", "S10", "S15"] },
      { text: "Gross margin, contract structure, retention and customer concentration are not publicly verified. Model values are analyst assumptions.", src: ["S13"] },
    ],
    products: [
      { text: "Containers and libraries are the products referenced in the customer case. The company announced packaging and compatibility updates in June 2026 aimed at adopting hardened containers without changing pipelines or tooling.", src: ["S10", "S18"] },
    ],
    positioning: [
      { text: "Google Cloud hosts a customer review of Chainguard's product and architecture (an independent host, but a customer story). Treat it as platform value-add context rather than contract diligence.", src: ["S15"] },
      { text: "Whether hardened containers and libraries sustain a durable price premium is an open question the register treats as a thesis risk.", src: ["S10", "S13"] },
    ],
    facts: [
      fact("Chainguard", "June 2026 ARR run-rate", "ARR run-rate (Jun 2026)", "Not disclosed 2026 booked ARR"),
      fact("Chainguard", "2025 disclosed ARR", "Last company-disclosed ARR"),
      fact("Chainguard", "Customer count lower bound", "Customers (“150+”)", "150+ in 2025, not a 2026 count"),
      { label: "Public customer reference", value: "Canva — containers and libraries", kind: "company", src: ["S10"], note: "Vendor-published case study; undated, viewed 2 Nov 2026. Not independent contract diligence." },
    ],
    funding: [
      fact("Chainguard", "Last equity valuation", "Last disclosed valuation (post-money)"),
      fact("Chainguard", "2025 Series D primary proceeds", "Series D primary proceeds"),
      fact("Chainguard", "2025 growth financing amount", "Growth financing (Oct 2025)", "Terms unavailable; not assumed net debt"),
    ],
    competition: [
      { text: "Docker announced on 17 Dec 2025 that it was making its hardened-images catalog free and open, with commercial Select and Enterprise tiers for compliance and support. This compresses willingness to pay for core image functionality and tests whether Chainguard's libraries, SLAs, breadth and integrations command a premium.", src: ["S11", "S12"] },
      { text: "Other developer-security and artifact-supply-chain names in the coverage universe (Snyk, Semgrep, Cloudsmith, Sysdig, Aikido) are mapping entries only; no competitive data has been verified.", src: ["S13"] },
    ],
    thesis: [
      { text: "Buyers assign measurable value to verified provenance, faster security reviews and reduced engineering time; enterprise SLAs and library breadth sustain pricing under free-tier pressure; sales capacity scales beyond developer-led adoption.", src: ["S10", "S13", "S15"] },
      { text: "Under the base cost assumptions even a roughly seven-fold ARR increase does not produce positive year-five free cash flow. The model pairs a 9.0x exit multiple with negative FCF, which the memorandum flags as a thesis challenge. This is a model warning, not evidence about the real business. (Memorandum §4; modeled, not sourced.)", src: [] },
    ],
    links: [
      { label: "Canva customer case (vendor, undated)", href: "https://www.chainguard.dev/customers/canva-trusts-chainguard-to-eliminate-supply-chain-risk-for-its-platform-serving-260-million-monthly-users", src: "S10" },
      { label: "Docker: hardened images free and open (competitor, 17 Dec 2025)", href: "https://www.docker.com/press-release/docker-makes-hardened-images-free-open-and-transparent-for-everyone/", src: "S11" },
      { label: "Docker Hardened Images documentation (competitor)", href: "https://docs.docker.com/dhi/", src: "S12" },
      { label: "Chainguard pricing (vendor)", href: "https://www.chainguard.dev/pricing", src: "S13" },
      { label: "Sacra: Chainguard ARR estimate (third party)", href: "https://sacra.com/c/chainguard/", src: "S08" },
    ],
    diligence: [
      "Monthly ARR ledger, cohorts and pipeline conversion; do not underwrite the $100M estimate until confirmed.",
      "Complete 2025 growth-financing documents and an outstanding senior-claim schedule (register: reserve or block approval).",
      "Win/loss calls and benchmarking against Docker's free tier: FIPS, SLAs, catalog breadth and economics.",
      "Technical proof-of-concept, remediation SLAs and migration cost; validate Canva as a reference only with proper permissions.",
      "Top-20 customer ARR, top-10 exposure, gross churn, and sales-capacity scaling evidence.",
    ],
    provenance: ["S07", "S08", "S09", "S10", "S11", "S12", "S13", "S15", "S17", "S18"],
  },
};
