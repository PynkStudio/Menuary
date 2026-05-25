"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Sottoscrive in realtime gli eventi sulla tabella `orders` per il tenant
 * corrente e chiama router.refresh() per ricaricare i Server Components.
 *
 * Throttle a 1s per evitare cascate di refresh quando arrivano molti eventi
 * ravvicinati (es. burst di nuovi ordini).
 */
export function OrdersLiveRefresh({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const pendingRef = useRef<number | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    function scheduleRefresh() {
      if (pendingRef.current != null) return;
      pendingRef.current = window.setTimeout(() => {
        pendingRef.current = null;
        router.refresh();
      }, 1000);
    }

    const channel = supabase
      .channel(`gestione-orders-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        scheduleRefresh,
      )
      .subscribe();

    // Tick periodico: serve a ridipingere il contatore "secondi al timeout"
    // sui pending già visibili, anche senza nuovi eventi DB.
    const tick = window.setInterval(scheduleRefresh, 15_000);

    return () => {
      if (pendingRef.current != null) window.clearTimeout(pendingRef.current);
      window.clearInterval(tick);
      void supabase.removeChannel(channel);
    };
  }, [tenantId, router]);

  return null;
}
