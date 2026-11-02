import type { Metadata } from "next";
import { AllocationView } from "@/components/AllocationView";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Capital Allocation Lab" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="5 · Capital allocation lab" title="Capital Allocation Lab">
        Test whether the terms and price of a specific security justify deploying capital. Primary and secondary entry are modeled separately; pre-money and post-money values are never interchanged.
      </PageHeader>
      <AllocationView />
    </>
  );
}
