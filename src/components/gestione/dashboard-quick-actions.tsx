"use client";

import Link from "next/link";
import { Ban, BookOpen, CalendarClock, ClipboardList, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import type { TenantFeatureKey, TenantVertical } from "@/lib/tenant";
import { useSettingsStore } from "@/store/settings-store";
import { useGestioneLocation } from "@/components/gestione/gestione-location-provider";

type DashboardQuickActionsProps = {
  tenantId: string;
  base: string;
  ordersHref: string;
  vertical: TenantVertical;
  isDemo: boolean;
  hasOrders: boolean;
  canManageMenu: boolean;
  canManageReservations: boolean;
  canManageActivity: boolean;
  orderModules: TenantFeatureKey[];
};

function endOfToday(): number {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

export function DashboardQuickActions({
  tenantId,
  base,
  ordersHref,
  vertical,
  isDemo,
  hasOrders,
  canManageMenu,
  canManageReservations,
  canManageActivity,
  orderModules,
}: DashboardQuickActionsProps) {
  const suspendModule = useSettingsStore((state) => state.suspendModule);
  const { activeLocation } = useGestioneLocation();
  const [ready, setReady] = useState(() => useSettingsStore.persist.hasHydrated());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [savingOrders, setSavingOrders] = useState(false);

  useEffect(() => {
    if (ready) return;
    return useSettingsStore.persist.onFinishHydration(() => setReady(true));
  }, [ready]);

  async function suspendOrders() {
    if (!window.confirm("Sospendere tutti i nuovi ordini in ingresso? Gli ordini già ricevuti resteranno disponibili.")) {
      return;
    }
    setSavingOrders(true);
    setFeedback(null);
    if (isDemo) {
      const until = endOfToday();
      orderModules.forEach((module) => suspendModule(module, until));
      setFeedback("Demo: nuovi ordini sospesi fino a fine giornata.");
      setSavingOrders(false);
      return;
    }

    try {
      const params = new URLSearchParams({ tenantId });
      if (activeLocation) params.set("locationId", activeLocation.id);
      const response = await fetch(`/api/gestione/order-settings?${params.toString()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          locationId: activeLocation?.id ?? null,
          takeawayEnabled: false,
          dineInEnabled: false,
          deliveryEnabled: false,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Impossibile sospendere gli ordini.");
      setFeedback("Nuovi ordini in ingresso sospesi. Puoi riattivarli dalle impostazioni ordini.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Impossibile sospendere gli ordini.");
    } finally {
      setSavingOrders(false);
    }
  }

  return (
    <>
      <div className="ga-quick-grid">
        {hasOrders && (
          <>
            <Link href={ordersHref} className="ga-quick">
              <span className="ga-quick-icon"><ClipboardList size={16} /></span>
              <span className="ga-quick-meta">
                <span>Gestisci ordini aperti</span>
                <span className="ga-quick-hint">Conferma, prepara e completa</span>
              </span>
            </Link>
            <button type="button" className="ga-quick" disabled={savingOrders || (isDemo && !ready)} onClick={suspendOrders}>
              <span className="ga-quick-icon"><Ban size={16} /></span>
              <span className="ga-quick-meta">
                <span>Sospendi ordini in ingresso</span>
                <span className="ga-quick-hint">Blocca i nuovi ordini, non quelli già ricevuti</span>
              </span>
            </button>
          </>
        )}
        {canManageMenu && (
          <Link href={`${base}/listino`} className="ga-quick">
            <span className="ga-quick-icon"><BookOpen size={16} /></span>
            <span className="ga-quick-meta">
              <span>{vertical === "services" ? "Aggiorna disponibilità servizi" : vertical === "creative" ? "Aggiorna il catalogo" : "Rimuovi o riattiva un piatto"}</span>
              <span className="ga-quick-hint">Disponibilità, prezzi e contenuti</span>
            </span>
          </Link>
        )}
        {canManageReservations && (
          <Link href={`${base}/prenotazioni?f=pending`} className="ga-quick">
            <span className="ga-quick-icon"><CalendarClock size={16} /></span>
            <span className="ga-quick-meta">
              <span>{vertical === "services" ? "Gestisci richieste appuntamento" : "Gestisci richieste prenotazione"}</span>
              <span className="ga-quick-hint">Apri quelle ancora da confermare</span>
            </span>
          </Link>
        )}
        {canManageActivity && (
          <Link href={`${base}/impostazioni`} className="ga-quick">
            <span className="ga-quick-icon"><Settings size={16} /></span>
            <span className="ga-quick-meta">
              <span>Aggiorna orari e contatti</span>
              <span className="ga-quick-hint">Dati mostrati ai clienti</span>
            </span>
          </Link>
        )}
      </div>
      {feedback && <p className="ga-section-hint" role="status">{feedback}</p>}
    </>
  );
}
