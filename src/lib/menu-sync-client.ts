"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  writeEnabled = false,
) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "saving" | "error">("idle");
  const replaceMenuData = useMenuStore((s) => s.replaceMenuData);
  const categories = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);
  const menuLists = useMenuStore((s) => s.menuLists);
  const extraLists = useMenuStore((s) => s.extraLists);
  const customTags = useMenuStore((s) => s.customTags);
  const volumeLabels = useMenuStore((s) => s.volumeLabels);
  const lastSavedRef = useRef("");
  const loadedTenantRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !tenantId) return;
    let cancelled = false;
    setStatus("loading");

    fetch(`/api/menu-sync?tenantId=${encodeURIComponent(tenantId)}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return (await res.json()) as MenuSyncBundle;
      })
      .then((bundle) => {
        if (cancelled) return;
        useMenuStore.setState({ currentTenantId: tenantId });
        replaceMenuData(bundle);
        lastSavedRef.current = JSON.stringify(bundle);
        loadedTenantRef.current = tenantId;
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, replaceMenuData, tenantId]);

  const snapshot = useMemo(
    () => JSON.stringify({ categories, items, menuLists, extraLists, customTags, volumeLabels }),
    [categories, customTags, extraLists, items, menuLists, volumeLabels],
  );

  useEffect(() => {
    if (!enabled || !writeEnabled || !tenantId || loadedTenantRef.current !== tenantId) return;
    if (snapshot === lastSavedRef.current) return;

    const handle = window.setTimeout(() => {
      const bundle = toBundle();
      const body = JSON.stringify(bundle);
      setStatus("saving");
      fetch(`/api/menu-sync?tenantId=${encodeURIComponent(tenantId)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body,
      })
        .then((res) => {
          if (!res.ok) throw new Error("Menu sync failed");
          lastSavedRef.current = body;
          setStatus("ready");
        })
        .catch(() => setStatus("error"));
    }, 700);

    return () => window.clearTimeout(handle);
  }, [enabled, snapshot, tenantId, writeEnabled]);

  return status;
}
