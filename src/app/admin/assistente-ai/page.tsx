import { AiPhoneAdminPage } from "@/components/admin/platform/ai-phone-admin-page";
import { TENANTS } from "@/lib/tenant-registry";

export default function AdminAssistenteAiPage() {
  return (
    <AiPhoneAdminPage
      tenants={TENANTS.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
      }))}
    />
  );
}
