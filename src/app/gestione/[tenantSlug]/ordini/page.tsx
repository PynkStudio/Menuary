import { redirect } from "next/navigation";

export default async function GestioneOrdiniPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  redirect(`/gestione/${tenantSlug}/ordini/impostazioni`);
}
