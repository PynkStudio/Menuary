import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { InsightsPanel } from "@/components/gestione/google/insights-panel";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

export default async function InsightsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();

  const location = await getPrimaryLocation(tenantSlug);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/gestione/${tenantSlug}/google`}
          className="rounded-full p-1.5 text-pork-ink/40 hover:text-pork-ink"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <p className="impact-title text-xs text-pork-red">Google Business</p>
          <h1 className="headline text-2xl">Insights</h1>
        </div>
      </div>

      {!location ? (
        <div className="rounded-2xl border-2 border-pork-ink/10 bg-white p-8 text-center space-y-3">
          <p className="font-semibold">Account Google non collegato</p>
          <p className="text-sm text-pork-ink/50">
            Collega il tuo Google Business Profile per vedere le statistiche della scheda.
          </p>
          <Link
            href={`/gestione/${tenantSlug}/google`}
            className="inline-block rounded-full bg-pork-ink px-5 py-2 text-sm font-bold text-pork-cream"
          >
            Collega account
          </Link>
        </div>
      ) : (
        <InsightsPanel tenantId={tenantSlug} />
      )}
    </div>
  );
}
