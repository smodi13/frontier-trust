import type { Metadata } from "next";
import { MonitoringView } from "@/components/MonitoringView";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Portfolio Monitoring" };

export default function Page() {
  return (
    <>
      <PageHeader eyebrow="7 · Portfolio monitoring" title="Portfolio Monitoring">
        A manual monitoring workspace seeded only with facts from the research register. Every entry shows its date, classification, provenance and update mode.
      </PageHeader>
      <MonitoringView />
    </>
  );
}
