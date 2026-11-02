import type { Metadata } from "next";
import { OpportunitiesView } from "@/components/OpportunitiesView";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Opportunity Landscape" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="2 · Opportunity landscape" title="Opportunity Landscape">
        Initial coverage universe of 16 trust, compliance and developer-security companies used for market mapping and company screening.
      </PageHeader>
      <OpportunitiesView />
    </>
  );
}
