"use client";

import { useState } from "react";
import type { MarketingConsentState } from "@/lib/clients-types";
import type { SharedRestaurantRecord } from "@/lib/clients-types";

export function ClientsConsentPanel({
  initial,
  restaurants,
}: {
  initial: MarketingConsentState;
  restaurants: SharedRestaurantRecord[];
}) {
  const [menuary, setMenuary] = useState(initial.menuaryMarketing);
  const [perTenant, setPerTenant] = useState<Record<string, boolean>>({
    ...initial.restaurantMarketing,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <section className="menuary-card rounded-2xl p-6">
        <h2 className="menuary-display text-2xl">Marketing Menuary</h2>
        <p className="mt-3 text-sm text-[var(--menuary-muted)]">
          Comunicazioni su novità prodotto, newsletter e inviti da Menuary (titolarità Menuary).
        </p>
        <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            checked={menuary}
            onChange={(e) => setMenuary(e.target.checked)}
          />
          Acconsento al trattamento per finalità di marketing da parte di Menuary
        </label>
      </section>

      <section className="menuary-card rounded-2xl p-6">
        <h2 className="menuary-display text-2xl">Marketing dei ristoranti</h2>
        <p className="mt-3 text-sm text-[var(--menuary-muted)]">
          Per ogni locale con cui hai interaguito puoi attivare o revocare comunicazioni promozionali
          gestite dal ristorante (titolare autonomo).
        </p>
        <ul className="mt-6 space-y-4">
          {restaurants.map((r) => (
            <li
              key={r.tenantId}
              className="flex flex-col gap-2 border-b border-[var(--menuary-line)] pb-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold">{r.displayName}</p>
                <p className="text-xs text-[var(--menuary-muted)]">{r.city}</p>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={perTenant[r.tenantId] ?? false}
                  onChange={(e) =>
                    setPerTenant((prev) => ({ ...prev, [r.tenantId]: e.target.checked }))
                  }
                />
                Consenso marketing locale
              </label>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-[var(--menuary-muted)]">
        Le preferenze saranno persistite su database con audit log. Revoca effettiva secondo tempi
        tecnici e policy del titolare.
      </p>
    </div>
  );
}
