import { requireGestioneSection } from "@/lib/gestione-page";
import { getPrimaryLocation, getLastSuccessfulSync } from "@/lib/data/google-sync";
import { GoogleConnectCard } from "@/components/gestione/google/google-connect-card";
import Link from "next/link";
import { Clock, MessageSquare, BarChart2 } from "lucide-react";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { headers } from "next/headers";
import { getGestioneBaseHref } from "@/lib/gestione-routing";
import { getGestioneTranslations, interpolate } from "@/i18n/gestione";
import { getActiveGestioneLocation } from "@/lib/gestione-location";

interface Props {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<{ google_auth?: string; step?: string }>;
}

export default async function GoogleDashboardPage({ params, searchParams }: Props) {
  const { tenantSlug } = await params;
  const { google_auth, step } = await searchParams;

  const { tenant } = await requireGestioneSection(tenantSlug, "google");
  const gt = await getGestioneTranslations();
  const t = gt.google;

  const activeLocation = await getActiveGestioneLocation(tenantSlug);
  const [location, lastSync] = await Promise.all([
    getPrimaryLocation(tenantSlug, activeLocation?.id),
    getLastSuccessfulSync(tenantSlug),
  ]);

  // Conteggio recensioni senza risposta (da DB locale)
  const db = createSupabaseServiceClient();
  const { count: unanswered } = db
    ? await db
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantSlug)
        .eq("location_id", activeLocation?.id ?? "")
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
      tone: "accent",
    },
    {
      href: `${base}/orari`,
      icon: Clock,
      label: t.hours,
      description: t.hoursDesc,
      badge: null,
      tone: "neutral",
    },
    {
      href: `${base}/insights`,
      icon: BarChart2,
      label: "Insights",
      description: t.insightsDesc,
      badge: location ? null : t.requiresConnection,
      tone: "neutral",
    },
  ];

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Google Business</span>
        <h1 className="ga-heading">{t.title}</h1>
      </header>

      {google_auth === "ok" && step === "select-location" && (
        <div className="ga-notice" data-tone="success">{t.connected}</div>
      )}
      {google_auth === "error" && <div className="ga-notice" data-tone="error">{t.error}</div>}

      <GoogleConnectCard
        tenantId={tenantSlug}
        connected={!!location}
        location={location}
        lastSync={lastSync?.toISOString() ?? null}
      />

      <div className="ga-quick-grid">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="ga-quick">
            <span className="ga-quick-icon">
              <s.icon size={16} aria-hidden="true" />
            </span>
            <span className="ga-quick-meta">
              <span>{s.label}</span>
              <span className="ga-quick-hint">{s.description}</span>
            </span>
            {s.badge && (
              <span className="ga-badge" data-tone={s.tone}>
                {s.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
