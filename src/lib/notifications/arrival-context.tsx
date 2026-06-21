"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  isMuted,
  playChime,
  setMuted as setMutedRaw,
  unlockAudioOnGesture,
  type ChimeKind,
} from "./chime";

export type ArrivalKind = "orders" | "reservations" | "ready";

type Counters = Record<ArrivalKind, number>;

type ArrivalContextValue = {
  counters: Counters;
  acknowledge: (kind: ArrivalKind) => void;
  muted: boolean;
  toggleMute: () => void;
};

const ZERO: Counters = { orders: 0, reservations: 0, ready: 0 };

const Ctx = createContext<ArrivalContextValue | null>(null);

const COUNTER_STORAGE_KEY = (tenantId: string, locationId?: string) =>
  `menuary:arrival-counters:${tenantId}:${locationId ?? "all"}`;

function readStored(tenantId: string, locationId?: string): Counters {
  if (typeof window === "undefined") return { ...ZERO };
  try {
    const raw = window.sessionStorage.getItem(COUNTER_STORAGE_KEY(tenantId, locationId));
    if (!raw) return { ...ZERO };
    const parsed = JSON.parse(raw) as Partial<Counters>;
    return {
      orders: Number(parsed.orders) || 0,
      reservations: Number(parsed.reservations) || 0,
      ready: Number(parsed.ready) || 0,
    };
  } catch {
    return { ...ZERO };
  }
}

function writeStored(tenantId: string, locationId: string | undefined, counters: Counters): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      COUNTER_STORAGE_KEY(tenantId, locationId),
      JSON.stringify(counters),
    );
  } catch {
    /* storage unavailable */
  }
}

type ArrivalAlertsProviderProps = {
  tenantId: string;
  locationId?: string;
  /** Se true, refresha i Server Components su evento (gestione). KDS = false (legge da store). */
  refreshOnChange?: boolean;
  /** Se true, ribadisce status changes a 'pronto' come canale autonomo. */
  enableReadyChannel?: boolean;
  children: React.ReactNode;
};

export function ArrivalAlertsProvider({
  tenantId,
  locationId,
  refreshOnChange = false,
  enableReadyChannel = true,
  children,
}: ArrivalAlertsProviderProps) {
  const router = useRouter();
  const [counters, setCounters] = useState<Counters>(() => readStored(tenantId, locationId));
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

  useEffect(() => {
    setCounters(readStored(tenantId, locationId));
  }, [locationId, tenantId]);

  // Throttle refresh: pattern già usato da OrdersLiveRefresh.
  const refreshPendingRef = useRef<number | null>(null);
  const scheduleRefresh = useCallback(() => {
    if (!refreshOnChange) return;
    if (refreshPendingRef.current != null) return;
    refreshPendingRef.current = window.setTimeout(() => {
      refreshPendingRef.current = null;
      router.refresh();
    }, 1000);
  }, [refreshOnChange, router]);

  const bump = useCallback(
    (kind: ArrivalKind, chime: ChimeKind) => {
      setCounters((c) => {
        const next = { ...c, [kind]: c[kind] + 1 };
        writeStored(tenantId, locationId, next);
        return next;
      });
      playChime(chime);
    },
    [locationId, tenantId],
  );

  const acknowledge = useCallback(
    (kind: ArrivalKind) => {
      setCounters((c) => {
        if (c[kind] === 0) return c;
        const next = { ...c, [kind]: 0 };
        writeStored(tenantId, locationId, next);
        return next;
      });
    },
    [locationId, tenantId],
  );

  const toggleMute = useCallback(() => {
    const next = !isMuted();
    setMutedRaw(next);
    setMutedState(next);
  }, []);

  // Sync mute tra tab / istanze
  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail;
      if (detail) setMutedState(detail.muted);
    };
    window.addEventListener("menuary:chime-mute", onChange);
    return () => window.removeEventListener("menuary:chime-mute", onChange);
  }, []);

  // Sblocca audio sul primo gesto utente (autoplay policy)
  useEffect(() => unlockAudioOnGesture(), []);

  // Sottoscrizione Supabase realtime
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const mountedAt = Date.now();

    // Helper: ignora eventi "storici" (alcuni replay possono arrivare al subscribe).
    const isFresh = (row: Record<string, unknown> | null | undefined) => {
      if (!row) return true;
      const created = row.created_at;
      if (typeof created !== "string") return true;
      const ts = Date.parse(created);
      if (Number.isNaN(ts)) return true;
      return ts >= mountedAt - 5_000;
    };
    const isActiveLocation = (row: Record<string, unknown> | null | undefined) =>
      !locationId || row?.location_id === locationId;
    const isFreshUpdate = (row: Record<string, unknown> | null | undefined) => {
      const updated = row?.updated_at;
      if (typeof updated !== "string") return true;
      const ts = Date.parse(updated);
      if (Number.isNaN(ts)) return true;
      return ts >= mountedAt - 5_000;
    };
    const changed = (
      oldRow: Record<string, unknown> | undefined,
      newRow: Record<string, unknown> | undefined,
      key: string,
    ) => oldRow?.[key] !== undefined && oldRow[key] !== newRow?.[key];
    const timestampsClose = (a: unknown, b: unknown, toleranceMs = 2_000) => {
      if (typeof a !== "string" || typeof b !== "string") return false;
      const left = Date.parse(a);
      const right = Date.parse(b);
      return !Number.isNaN(left) && !Number.isNaN(right) && Math.abs(left - right) <= toleranceMs;
    };

    const channel = supabase
      .channel(`arrival-alerts-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown> | undefined;
          if (!isActiveLocation(row)) return;
          if (!isFresh(row)) {
            scheduleRefresh();
            return;
          }
          // Solo se l'ordine arriva in stato cliente-facing
          const status = row?.status;
          if (status === "pending_confirmation" || status === "nuovo") {
            bump("orders", "order");
          }
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const oldRow = payload.old as Record<string, unknown> | undefined;
          const newRow = payload.new as Record<string, unknown> | undefined;
          if (!isActiveLocation(newRow)) return;
          const prev = oldRow?.status;
          const next = newRow?.status;

          const statusChanged = changed(oldRow, newRow, "status");
          const customerEditFieldsChanged =
            changed(oldRow, newRow, "total") ||
            changed(oldRow, newRow, "pickup_time") ||
            changed(oldRow, newRow, "desired_time") ||
            changed(oldRow, newRow, "delivery_address") ||
            changed(oldRow, newRow, "confirmation_expires_at");
          const isManualConfirmationUpdate =
            next === "nuovo" && timestampsClose(newRow?.confirmed_at, newRow?.updated_at);
          const likelyCustomerEditWithoutOldRow =
            !statusChanged &&
            !isManualConfirmationUpdate &&
            isFreshUpdate(newRow) &&
            (next === "pending_confirmation" || next === "nuovo") &&
            typeof newRow?.created_at === "string" &&
            typeof newRow?.updated_at === "string" &&
            Date.parse(newRow.updated_at) > Date.parse(newRow.created_at) + 3_000;

          if (customerEditFieldsChanged || likelyCustomerEditWithoutOldRow) {
            bump("orders", "order_edit");
          }

          // qualunque -> pronto: alert per chi serve (camerieri)
          if (
            enableReadyChannel &&
            prev !== "pronto" &&
            next === "pronto"
          ) {
            bump("ready", "ready");
          }
          scheduleRefresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reservation_requests",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown> | undefined;
          if (!isActiveLocation(row)) return;
          if (!isFresh(row)) {
            scheduleRefresh();
            return;
          }
          const status = row?.status;
          // Solo prenotazioni che richiedono attenzione operatore.
          if (status === "pending_manual" || status === "auto_proposed") {
            bump("reservations", "reservation");
          }
          scheduleRefresh();
        },
      )
      .subscribe();

    return () => {
      if (refreshPendingRef.current != null) {
        window.clearTimeout(refreshPendingRef.current);
        refreshPendingRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [tenantId, locationId, bump, scheduleRefresh, enableReadyChannel]);

  const value = useMemo<ArrivalContextValue>(
    () => ({ counters, acknowledge, muted, toggleMute }),
    [counters, acknowledge, muted, toggleMute],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useArrivalAlerts(): ArrivalContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback no-op: permette ai consumer di girare anche dove il provider
    // non è montato (es. pagine pubbliche), senza throw.
    return {
      counters: ZERO,
      acknowledge: () => {},
      muted: false,
      toggleMute: () => {},
    };
  }
  return ctx;
}
