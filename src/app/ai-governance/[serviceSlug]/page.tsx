import { notFound } from "next/navigation";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAiGovernanceServicePage } from "@/components/tenants/pynkstudio/pages/ai-governance-service";
import { getGovernanceService, governanceServices } from "@/components/tenants/pynkstudio/ai-governance-data";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

type Props = {
  params: Promise<{ serviceSlug: string }>;
};

export function generateStaticParams() {
  return governanceServices.map((service) => ({ serviceSlug: service.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { serviceSlug } = await params;
  const service = getGovernanceService(serviceSlug);
  if (!service) return {};
  return pynkMetadata({
    title: service.metaTitle,
    description: service.metaDescription,
    path: `/ai-governance/${service.slug}`,
    keywords: [service.title, service.shortTitle, "AI Act", "AI governance", "intelligenza artificiale aziende"],
  });
}

export default async function AiGovernanceServiceRoute({ params }: Props) {
  await requirePynkstudioTenant();
  const { serviceSlug } = await params;
  if (!getGovernanceService(serviceSlug)) notFound();
  return <PynkAiGovernanceServicePage slug={serviceSlug} />;
}
