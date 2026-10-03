import { requireGestioneSection } from "@/lib/gestione-page";
import { getActiveGestioneLocation } from "@/lib/gestione-location";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { ReviewsManager } from "@/components/gestione/google/reviews-manager";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { headers } from "next/headers";
import { getGestioneBaseHref } from "@/lib/gestione-routing";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

export default async function RecensioniPage({ params }: Props) {
  const { tenantSlug } = await params;
  const { tenant } = await requireGestioneSection(tenantSlug, "google");

  const activeLocation = await getActiveGestioneLocation(tenantSlug);
  const location = await getPrimaryLocation(tenantSlug, activeLocation?.id);
  const googleHref = `${getGestioneBaseHref((await headers()).get("host"), tenant)}/google`;

  return (
    <div className="ga-dashboard">
      <header>
        <Link href={googleHref} className="ga-back-link">
          <ChevronLeft size={14} aria-hidden="true" /> Google Business
        </Link>
        <h1 className="ga-heading">Recensioni</h1>
      </header>

      {!location ? (
        <div className="ga-empty">
          <p>Collega il profilo Google Business per leggere e rispondere alle recensioni.</p>
          <Link href={googleHref} className="ga-btn ga-btn-primary">
            Collega Google Business
          </Link>
        </div>
      ) : (
        <ReviewsManager tenantId={tenantSlug} />
      )}
    </div>
  );
}
