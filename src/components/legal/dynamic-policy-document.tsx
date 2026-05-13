"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCookieSections,
  buildPrivacySections,
  type PolicyModuleFlags,
} from "@/lib/legal/policies";
import { PolicySectionsView } from "@/components/legal/policy-sections-view";
import { useSettingsStore } from "@/store/settings-store";
import { useEffectiveFeatures } from "@/lib/use-effective-features";

function ModuleChip({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active
          ? "bg-pork-mustard/25 text-pork-ink"
          : "bg-pork-ink/10 text-pork-ink/45 line-through decoration-pork-ink/30"
      }`}
    >
      {label}
    </span>
  );
}

export function DynamicPolicyDocument({
  variant,
}: {
  variant: "privacy" | "cookie";
}) {
  const {
    allowTakeaway,
    allowTableOrders,
    dinerSeparationAtTables,
    kitchenDisplayEnabled,
  } = useEffectiveFeatures();

  const [settingsReady, setSettingsReady] = useState(() =>
    useSettingsStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setSettingsReady(true);
      return;
    }
    return useSettingsStore.persist.onFinishHydration(() => {
      setSettingsReady(true);
    });
  }, []);

  const flags: PolicyModuleFlags = useMemo(
    () => ({
      allowTakeaway,
      allowTableOrders,
      dinerSeparationAtTables,
      kitchenDisplayEnabled,
    }),
    [
      allowTakeaway,
      allowTableOrders,
      dinerSeparationAtTables,
      kitchenDisplayEnabled,
    ],
  );

  const sections = useMemo(
    () =>
      variant === "privacy"
        ? buildPrivacySections(flags)
        : buildCookieSections(flags),
    [variant, flags],
  );

  /** Moduli ordinazione non tutti attivi → il comportamento del sito cambia in modo rilevante. */
  const orderingChangesExperience =
    !allowTakeaway || !allowTableOrders;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-pork-ink/10 bg-white/60 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-pork-ink/50">
          Configurazione servizi (impostazioni sito)
        </p>
        <p className="mt-2 text-sm text-pork-ink/75">
          Le sezioni contrassegnate nel testo dipendono dai moduli attivati dall’attività: qui sotto lo
          stato letto dal tuo browser (allineato alle impostazioni salvate come nel pannello staff).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <ModuleChip active={allowTakeaway} label="Ordine da asporto" />
          <ModuleChip active={allowTableOrders} label="Ordine al tavolo" />
          <ModuleChip active={dinerSeparationAtTables} label="Commensali distinti" />
          <ModuleChip active={kitchenDisplayEnabled} label="Schermo cucina" />
        </div>
        {orderingChangesExperience ? (
          <p className="mt-4 text-xs text-pork-ink/60">
            Nota: con uno o più moduli di ordinazione disattivati, il sito non offre la relativa
            esperienza digitale; il testo si adatta così da descrivere solo ciò che è effettivamente
            disponibile.
          </p>
        ) : null}
        {!settingsReady ? (
          <p className="mt-3 text-xs text-pork-mustard">Caricamento impostazioni…</p>
        ) : null}
      </div>

      <PolicySectionsView sections={sections} />
    </div>
  );
}
