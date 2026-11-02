import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { UnderwritingView } from "@/components/UnderwritingView";

export const metadata: Metadata = { title: "Financial Underwriting" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="4 · Financial underwriting" title="Financial Underwriting">
        The workbook&apos;s five-year operating model, re-implemented as a typed calculation engine. Every forecast value below is calculated; only sourced inputs and labeled analyst assumptions are typed in.
      </PageHeader>
      <UnderwritingView />
    </>
  );
}
