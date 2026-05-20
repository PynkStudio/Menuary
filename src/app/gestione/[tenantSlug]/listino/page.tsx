import { notFound } from "next/navigation";
import AdminMenuPage from "@/app/admin/menu/page";
import { OfficinakamListinoEditor } from "@/components/tenants/officinakam/admin/listino-editor";
import { LibritechListinoEditor } from "@/components/tenants/libritech/admin/listino-editor";
import { TENANTS } from "@/lib/tenant-registry";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";

export default async function GestioneListinoPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();

  const access = getGestioneModuleAccess(tenant.features);
  if (!access.canManageMenu) notFound();

  if (tenant.id === "officinakam") return <OfficinakamListinoEditor />;
  if (tenant.id === "libritech") return <LibritechListinoEditor />;

  // Solo i tenant del verticale food usano il menu editor condiviso (cibo/bevande).
  // Per ogni altro tenant di servizi serve un editor dedicato — non far cadere su AdminMenuPage,
  // altrimenti compaiono i prodotti di un altro tenant.
  if (tenant.vertical !== "food") notFound();

  return <AdminMenuPage />;
}
