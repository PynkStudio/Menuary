"use client";

import { createContext, useContext, useSyncExternalStore, type PropsWithChildren } from "react";
import { matchTenantLocale, tenantLocaleCookieName } from "@/lib/tenant-locales";
import { tenantLocaleFromPath } from "@/lib/tenant-localized-path";

type TenantLanguageConfig<TLanguage extends string> = {
  tenantId: string;
  previewSlug?: string;
  defaultLanguage: TLanguage;
  supportedLanguages: readonly TLanguage[];
};

type TenantLanguageStore<TLanguage extends string> = {
  config: TenantLanguageConfig<TLanguage>;
  currentLanguage: TLanguage;
  hydrated: boolean;
  listeners: Set<() => void>;
};

const stores = new Map<string, TenantLanguageStore<string>>();
const STORAGE_PREFIX = "tenant-language:";
const TenantInitialLanguageContext = createContext<string | null>(null);

export function TenantLanguageProvider({
  children,
  initialLanguage,
}: PropsWithChildren<{ initialLanguage: string | null }>) {
  return (
    <TenantInitialLanguageContext.Provider value={initialLanguage}>
      {children}
    </TenantInitialLanguageContext.Provider>
  );
}

function storageKey(tenantId: string) {
  return `${STORAGE_PREFIX}${tenantId}`;
}

function matchSupportedLanguage<TLanguage extends string>(
  language: string | null | undefined,
  supportedLanguages: readonly TLanguage[],
) {
  if (!language) return null;
  return matchTenantLocale(language, supportedLanguages) as TLanguage | null;
}

function detectBrowserLanguage<TLanguage extends string>(
  supportedLanguages: readonly TLanguage[],
  defaultLanguage: TLanguage,
) {
  if (typeof navigator === "undefined") return defaultLanguage;
  const browserLanguages = [...(navigator.languages ?? []), navigator.language];
  for (const language of browserLanguages) {
    const match = matchSupportedLanguage(language, supportedLanguages);
    if (match) return match;
  }
  return defaultLanguage;
}

function setDocumentLanguage(language: string) {
  if (typeof document !== "undefined") document.documentElement.lang = language;
}

function hydrateStore<TLanguage extends string>(store: TenantLanguageStore<TLanguage>) {
  if (store.hydrated || typeof window === "undefined") return;
  const routeLanguage = tenantLocaleFromPath(
    window.location.pathname,
    store.config.tenantId,
    store.config.previewSlug,
  ) as TLanguage | null;
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(storageKey(store.config.tenantId));
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
  store.currentLanguage =
    routeLanguage ??
    matchSupportedLanguage(stored, store.config.supportedLanguages) ??
    detectBrowserLanguage(store.config.supportedLanguages, store.config.defaultLanguage);
  store.hydrated = true;
  setDocumentLanguage(store.currentLanguage);
}

function emit<TLanguage extends string>(store: TenantLanguageStore<TLanguage>) {
  setDocumentLanguage(store.currentLanguage);
  store.listeners.forEach((listener) => listener());
}

function getStore<TLanguage extends string>(config: TenantLanguageConfig<TLanguage>) {
  const existing = stores.get(config.tenantId) as TenantLanguageStore<TLanguage> | undefined;
  if (existing) return existing;
  const store: TenantLanguageStore<TLanguage> = {
    config,
    currentLanguage: config.defaultLanguage,
    hydrated: false,
    listeners: new Set(),
  };
  stores.set(config.tenantId, store as TenantLanguageStore<string>);
  return store;
}

export function createTenantI18n<
  TLanguage extends string,
  TCopy,
>(config: {
  tenantId: string;
  previewSlug?: string;
  defaultLanguage: TLanguage;
  translations: Record<TLanguage, TCopy>;
}) {
  const supportedLanguages = Object.keys(config.translations) as TLanguage[];
  const store = getStore({
    tenantId: config.tenantId,
    previewSlug: config.previewSlug,
    defaultLanguage: config.defaultLanguage,
    supportedLanguages,
  });

  function subscribe(listener: () => void) {
    store.listeners.add(listener);
    return () => store.listeners.delete(listener);
  }

  function getSnapshot() {
    hydrateStore(store);
    const routeLanguage =
      typeof window === "undefined"
        ? null
        : tenantLocaleFromPath(
            window.location.pathname,
            store.config.tenantId,
            store.config.previewSlug,
          );
    if (routeLanguage) store.currentLanguage = routeLanguage as TLanguage;
    return store.currentLanguage;
  }

  function useLanguage() {
    const initialLanguage = useContext(TenantInitialLanguageContext);
    return useSyncExternalStore(
      subscribe,
      getSnapshot,
      () => matchSupportedLanguage(initialLanguage, supportedLanguages) ?? config.defaultLanguage,
    );
  }

  function setLanguage(language: TLanguage) {
    store.currentLanguage = language;
    store.hydrated = true;
    try {
      window.localStorage.setItem(storageKey(config.tenantId), language);
      document.cookie = `${tenantLocaleCookieName(config.tenantId)}=${language}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // The in-memory override still works when storage is unavailable.
    }
    emit(store);
  }

  function resetLanguageOverride() {
    try {
      window.localStorage.removeItem(storageKey(config.tenantId));
      document.cookie = `${tenantLocaleCookieName(config.tenantId)}=; path=/; max-age=0; samesite=lax`;
    } catch {
      // The browser language can still be used for the current page.
    }
    store.currentLanguage = detectBrowserLanguage(supportedLanguages, config.defaultLanguage);
    store.hydrated = true;
    emit(store);
  }

  function useCopy() {
    return config.translations[useLanguage()];
  }

  return {
    languages: supportedLanguages,
    resetLanguageOverride,
    setLanguage,
    useCopy,
    useLanguage,
  };
}

export function useTenantLanguagePreference<TLanguage extends string>({
  tenantId,
  defaultLanguage,
  supportedLanguages,
}: {
  tenantId: string;
  defaultLanguage: TLanguage;
  supportedLanguages: readonly TLanguage[];
}) {
  const initialLanguage = useContext(TenantInitialLanguageContext);
  const store = getStore({
    tenantId,
    defaultLanguage,
    supportedLanguages,
  });

  function subscribe(listener: () => void) {
    store.listeners.add(listener);
    return () => store.listeners.delete(listener);
  }

  function getSnapshot() {
    hydrateStore(store);
    return store.currentLanguage as TLanguage;
  }

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => matchSupportedLanguage(initialLanguage, supportedLanguages) ?? defaultLanguage,
  );
}
