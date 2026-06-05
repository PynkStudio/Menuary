"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { ReservationRequestForm } from "@/components/modules/reservations/reservation-request-form";

export function ReservationPageShell() {
  const { allowTakeaway, modules } = useEffectiveFeatures();
  const tenantHref = useTenantLocalizedHref();

  if (!modules.reservations) {
    return (
      <div className="bg-pork-cream px-5 py-28 text-pork-ink md:py-36">
        <div className="container-wide max-w-3xl">
          <span className="chip-mustard">Ordini</span>
          <h1 className="headline mt-4 text-5xl sm:text-6xl">
            Ordina dal menu.
          </h1>
          <p className="mt-4 text-lg leading-8 text-pork-ink/70">
            Questo locale non usa il modulo prenotazioni tavoli. Scegli i prodotti
            dal menu e completa l&apos;ordine digitale.
          </p>
          {allowTakeaway && (
            <Link href={tenantHref("/menu")} className="btn-primary mt-8 inline-flex">
              <ShoppingBag size={20} />
              Vai al menu
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pork-cream px-5 py-28 text-pork-ink md:py-36">
      <div className="container-wide">
        <div className="mb-8 max-w-2xl">
          <span className="chip-mustard">Prenotazioni</span>
          <h1 className="headline mt-4 text-5xl sm:text-6xl">
            Richiedi un tavolo.
          </h1>
          <p className="mt-4 text-lg leading-8 text-pork-ink/70">
            Scegli giorno, orario e numero di persone. Lo staff riceve la richiesta
            nel pannello prenotazioni.
          </p>
        </div>
        <div className="max-w-3xl">
          <ReservationRequestForm />
        </div>
      </div>
    </div>
  );
}
