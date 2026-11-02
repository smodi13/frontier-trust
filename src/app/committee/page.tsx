import type { Metadata } from "next";
import { CommitteeView } from "@/components/CommitteeView";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Investment Committee" };

export default function Page() {
  return (
    <>
      <div className="print:hidden">
        <PageHeader eyebrow="6 · Investment committee" title="Investment Committee" />
      </div>
      <h1 className="hidden font-serif text-[22px] font-semibold print:block">Frontier Trust · Investment Committee Recommendation</h1>
      <CommitteeView />
    </>
  );
}
