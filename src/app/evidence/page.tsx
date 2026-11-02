import type { Metadata } from "next";
import { EvidenceView } from "@/components/EvidenceView";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Evidence Center" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="8 · Evidence center" title="Evidence Center">
        All 18 research records from the workbook, every sourced metric linked to its evidence, the methodology, and the original documents.
      </PageHeader>
      <EvidenceView />
    </>
  );
}
