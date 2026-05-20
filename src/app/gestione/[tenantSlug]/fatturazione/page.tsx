import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { isDemoHost } from "@/lib/platform";
import { ComingSoon } from "@/components/gestione/coming-soon";

export default async function FatturazionePage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const host = (await headers()).get("host") ?? "";
  const isDemo = isDemoHost(host);

  if (!isDemo) {
    const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    const [{ data: sa }, { data: ta }] = await Promise.all([
      supabase.from("siteadmin").select("role").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
      supabase.from("tenantadmin").select("email").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    ]);
    if (!sa && !ta) notFound();
  }

  return (
    <ComingSoon
      eyebrow="Amministrazione"
      title="Fatturazione"
      description="Piano attivo, fatture Menuary, metodo di pagamento e storico abbonamenti. Solo l'amministratore principale del tenant può accedere a questa sezione."
      bullets={[
        "Piano corrente con moduli inclusi e prossimo rinnovo.",
        "Storico fatture scaricabili in PDF e dettaglio voci.",
        "Aggiornamento metodo di pagamento e dati di fatturazione.",
      ]}
    />
  );
}
