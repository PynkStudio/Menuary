import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { ReviewsManager } from "@/components/gestione/google/reviews-manager";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { headers } from "next/headers";
import { getGestioneBaseHref, getGestioneModuleAccess } from "@/lib/gestione-routing";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

export default async function RecensioniPage({ params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant || !getGestioneModuleAccess(tenant.features).modules.reviews) notFound();

  const location = await getPrimaryLocation(tenantSlug);
  const googleHref = `${getGestioneBaseHref((await headers()).get("host"), tenant)}/google`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={googleHref}
          className="rounded-full p-1.5 text-pork-ink/40 hover:text-pork-ink"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <p className="impact-title text-xs text-pork-red">Google Business</p>
          <h1 className="headline text-2xl">Recensioni</h1>
        </div>
      </div>

      {!location ? (
        <div className="rounded-2xl border-2 border-pork-ink/10 bg-white p-8 text-center space-y-3">
          <p className="font-semibold">Account Google non collegato</p>
          <p className="text-sm text-pork-ink/50">
            Collega il tuo Google Business Profile per visualizzare e rispondere alle recensioni.
          </p>
          <Link
            href={googleHref}
            className="inline-block rounded-full bg-pork-ink px-5 py-2 text-sm font-bold text-pork-cream"
          >
            Vai alle impostazioni Google
          </Link>
        </div>
      ) : (
        <ReviewsManager tenantId={tenantSlug} />
      )}
    </div>
  );
}
