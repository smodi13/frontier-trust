import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ValuationEvidenceView } from "@/components/ValuationEvidenceView";

export const metadata: Metadata = { title: "Valuation Evidence" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="9 · Valuation evidence" title="Valuation Evidence">
        Public-market comparables, private transaction signals and a reverse-underwriting bridge from the market-comparables research extension. Context for price discipline; it changes no assumption or conclusion.
      </PageHeader>
      <ValuationEvidenceView />
    </>
  );
}
