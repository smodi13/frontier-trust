import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompanyView } from "@/components/CompanyView";
import { COMPANY_IDS, type CompanyId } from "@/engine";

export const dynamicParams = false;
export const generateStaticParams = () => COMPANY_IDS.map((slug) => ({ slug }));

export async function generateMetadata({ params }: PageProps<"/companies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug === "vanta" ? "Vanta diligence" : "Chainguard diligence" };
}

export default async function Page({ params }: PageProps<"/companies/[slug]">) {
  const { slug } = await params;
  if (!(COMPANY_IDS as readonly string[]).includes(slug)) notFound();
  return <CompanyView id={slug as CompanyId} />;
}
