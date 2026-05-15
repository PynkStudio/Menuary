import { notFound } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import Link from "next/link";
import { ChevronLeft, Eye, Search, MousePointerClick, Phone } from "lucide-react";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

// Placeholder card per ogni metrica — si popola con i dati reali dall'API
// Business Profile Performance quando il tenant è collegato.
function MetricCard({ icon: Icon, label, value, note }: {
  icon: React.ElementType;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-pork-ink/10 bg-white p-5">
      <div className="flex items-center gap-2 text-pork-ink/40">
        <Icon size={16} />
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs text-pork-ink/40">{note}</p>}
    </div>
  );
}

export default async function InsightsPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) notFound();

  const location = await getPrimaryLocation(tenantSlug);

  return (
    <div className="space-y-8">
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
        <>
          <p className="text-sm text-pork-ink/50">
            Dati degli ultimi 30 giorni dalla tua scheda su Google Maps e Ricerca.
          </p>

          {/* Metriche principali — TODO: popolare con Business Profile Performance API */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={Eye}              label="Visualizzazioni"  value="—" note="Presto disponibile" />
            <MetricCard icon={Search}           label="Ricerche"         value="—" note="Presto disponibile" />
            <MetricCard icon={MousePointerClick} label="Click sito web"  value="—" note="Presto disponibile" />
            <MetricCard icon={Phone}            label="Chiamate"         value="—" note="Presto disponibile" />
          </div>

          <div className="rounded-2xl border-2 border-dashed border-pork-ink/15 p-8 text-center space-y-2">
            <p className="font-semibold text-pork-ink/60">Grafici e serie storiche</p>
            <p className="text-sm text-pork-ink/40">
              In arrivo — l'integrazione con la Business Profile Performance API
              mostrerà qui andamento giornaliero di impressioni, click e chiamate.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
