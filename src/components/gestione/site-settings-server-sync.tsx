"use client";

import { useEffect } from "react";
import {
  getSettingsServerSnapshot,
  isSettingsServerHydrated,
  markSettingsServerSnapshot,
  useSettingsStore,
} from "@/store/settings-store";
import { SERVER_SITE_SETTINGS_KEYS, type ServerSiteSettings } from "@/lib/site-settings-sync";

const DEBOUNCE_MS = 700;

/**
 * Montato solo nella gestione: ogni modifica allo store impostazioni fatta dai
 * pannelli viene salvata su tenant_site_settings, così il sito pubblico e gli
 * altri dispositivi vedono le stesse impostazioni. Si attiva solo dopo che lo
 * store ha letto il server, per non spingere la cache locale sopra i dati veri.
 */
export function SiteSettingsServerSync({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    let timer: number | null = null;

    function diffAgainstServer(): ServerSiteSettings {
      const state = useSettingsStore.getState();
      const snapshot = getSettingsServerSnapshot() as Record<string, unknown>;
      const patch: Record<string, unknown> = {};
      for (const key of SERVER_SITE_SETTINGS_KEYS) {
        if (JSON.stringify(state[key]) !== JSON.stringify(snapshot[key])) patch[key] = state[key];
      }
      return patch as ServerSiteSettings;
    }

    async function flush() {
      timer = null;
      if (!isSettingsServerHydrated(tenantId)) return;
      const patch = diffAgainstServer();
      if (Object.keys(patch).length === 0) return;
      const response = await fetch("/api/gestione/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, settings: patch }),
      }).catch(() => null);
      if (response?.ok) markSettingsServerSnapshot(patch);
    }

    const unsubscribe = useSettingsStore.subscribe(() => {
      if (!isSettingsServerHydrated(tenantId)) return;
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => void flush(), DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timer !== null) {
        window.clearTimeout(timer);
        void flush();
      }
    };
  }, [tenantId]);

  return null;
}
