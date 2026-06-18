"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMenuStore } from "@/store/menu-store";
import type { MenuSyncBundle } from "@/lib/menu-sync-types";

function toBundle(): MenuSyncBundle {
  const state = useMenuStore.getState();
  return {
    categories: state.categories,
    items: state.items,
    menuLists: state.menuLists,
    extraLists: state.extraLists,
    customTags: state.customTags,
    volumeLabels: state.volumeLabels,
  };
}

export function useSupabaseMenuSync(
  tenantId: string | undefined,
  enabled = true,
  locale?: string | null,
  preserveLocalDraft = false,
  locationId?: string | null,
) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving" | "error">("idle");
  const [publishedSnapshot, setPublishedSnapshot] = useState("");
  const replaceMenuData = useMenuStore((s) => s.replaceMenuData);
  const categories = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);
  const menuLists = useMenuStore((s) => s.menuLists);
  const extraLists = useMenuStore((s) => s.extraLists);
  const customTags = useMenuStore((s) => s.customTags);
  const volumeLabels = useMenuStore((s) => s.volumeLabels);
  const loadedScopeRef = useRef<string | null>(null);
  const scopeId = tenantId ? `${tenantId}:${locationId ?? "default"}` : null;

  useEffect(() => {
    if (!enabled || !tenantId) return;
    let cancelled = false;
    setStatus("loading");

    const params = new URLSearchParams({ tenantId });
    if (locale) params.set("locale", locale);
    if (locationId) params.set("locationId", locationId);

    fetch(`/api/menu-sync?${params.toString()}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return (await res.json()) as MenuSyncBundle;
      })
      .then((bundle) => {
        if (cancelled) return;
        const draftSnapshot = JSON.stringify(toBundle());
        const publishedKey = `menu-sync:last-published:${scopeId}`;
        const lastPublishedSnapshot = window.localStorage.getItem(publishedKey);
        const currentTenantId = useMenuStore.getState().currentTenantId;

        useMenuStore.setState({ currentTenantId: tenantId });

        if (
          preserveLocalDraft &&
          loadedScopeRef.current === scopeId &&
          currentTenantId === tenantId &&
          lastPublishedSnapshot &&
          draftSnapshot !== lastPublishedSnapshot
        ) {
          setPublishedSnapshot(lastPublishedSnapshot);
        } else {
          replaceMenuData(bundle);
          const nextPublishedSnapshot = JSON.stringify(toBundle());
          setPublishedSnapshot(nextPublishedSnapshot);
          window.localStorage.setItem(publishedKey, nextPublishedSnapshot);
        }

        loadedScopeRef.current = scopeId;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, locale, locationId, preserveLocalDraft, replaceMenuData, scopeId, tenantId]);

  const snapshot = useMemo(
    () => JSON.stringify({ categories, items, menuLists, extraLists, customTags, volumeLabels }),
    [categories, customTags, extraLists, items, menuLists, volumeLabels],
  );

  const hasUnpublishedChanges =
    Boolean(scopeId && loadedScopeRef.current === scopeId && publishedSnapshot) &&
    snapshot !== publishedSnapshot;

  const publishMenu = useCallback(async () => {
    if (!enabled || !tenantId || !scopeId || loadedScopeRef.current !== scopeId) return false;
    const bundle = toBundle();
    const body = JSON.stringify(bundle);
    setStatus("saving");

    try {
      const params = new URLSearchParams({ tenantId });
      if (locationId) params.set("locationId", locationId);
      const res = await fetch(`/api/menu-sync?${params.toString()}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body,
      });
      if (!res.ok) throw new Error("Menu sync failed");
      setPublishedSnapshot(body);
      window.localStorage.setItem(`menu-sync:last-published:${scopeId}`, body);
      setStatus("ready");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }, [enabled, locationId, scopeId, tenantId]);

  return { status, hasUnpublishedChanges, publishMenu };
}
