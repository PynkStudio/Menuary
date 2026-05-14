import { PlatformLeadDetail } from "@/components/admin/platform/platform-lead-detail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlatformLeadDetail leadId={id} />;
}
