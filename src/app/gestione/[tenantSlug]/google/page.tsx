import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getPrimaryLocation, getLastSuccessfulSync } from "@/lib/data/google-sync";
import { GoogleConnectCard } from "@/components/gestione/google/google-connect-card";
import Link from "next/link";
import { Clock, MessageSquare, BarChart2 } from "lucide-react";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { headers } from "next/headers";
import { getGestioneBaseHref, getGestioneModuleAccess } from "@/lib/gestione-routing";
import { getGestioneTranslations, interpolate } from "@/i18n/gestione";

interface Props {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ google_auth?: string; step?: string }>;
}

export default async function GoogleDashboardPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const { google_auth, step } = await searchParams;

  const tenant = await getTenantById(tenantSlug);
  if (!tenant || !getGestioneModuleAccess(tenant.features).hasGoogleBusiness) notFound();
  const gt = await getGestioneTranslations();
  const t = gt.google;

  const [location, lastSync] = await Promise.all([
    getPrimaryLocation(tenantSlug),
    getLastSuccessfulSync(tenantSlug),
  ]);

  // Conteggio recensioni senza risposta (da DB locale)
  const db = createSupabaseServiceClient();
  const { count: unanswered } = db
    ? await db
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantSlug)
        .eq("source", "google_places")
        .is("reply_comment", null)
    : { count: null };

  const base = `${getGestioneBaseHref((await headers()).get("host"), tenant)}/google`;

  const sections = [
    {
      href: `${base}/recensioni`,
      icon: MessageSquare,
      label: t.reviews,
      description: t.reviewsDesc,
      badge: unanswered ? interpolate(t.toReply, { count: unanswered }) : null,
      badgeColor: "bg-pork-red text-white",
    },
    {
      href: `${base}/orari`,
      icon: Clock,
      label: t.hours,
      description: t.hoursDesc,
      badge: null,
      badgeColor: "",
    },
    {
      href: `${base}/insights`,
      icon: BarChart2,
      label: "Insights",
      description: t.insightsDesc,
      badge: location ? null : t.requiresConnection,
      badgeColor: "bg-pork-ink/10 text-pork-ink/50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="impact-title text-xs text-pork-red">Google Business</p>
        <h1 className="headline text-3xl">{t.title}</h1>
      </div>

      {/* Feedback OAuth */}
      {google_auth === "ok" && step === "select-location" && (
        <div className="rounded-2xl bg-green-50 border-2 border-green-200 p-4 text-sm font-semibold text-green-800">
          {t.connected}
        </div>
      )}
      {google_auth === "error" && (
        <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-4 text-sm font-semibold text-red-800">
          {t.error}
        </div>
      )}

      {/* Connection card */}
      <GoogleConnectCard
        tenantId={tenantSlug}
        connected={!!location}
        location={location}
        lastSync={lastSync?.toISOString() ?? null}
      />

      {/* Sezioni */}
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border-2 border-pork-ink/10 bg-white p-5 transition-all hover:border-pork-ink/30 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pork-ink/5 transition-colors group-hover:bg-pork-ink/10">
                <s.icon size={20} className="text-pork-ink/60" />
              </div>
              {s.badge && (
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${s.badgeColor}`}>
                  {s.badge}
                </span>
              )}
            </div>
            <p className="mt-3 font-bold">{s.label}</p>
            <p className="mt-1 text-sm text-pork-ink/50">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
