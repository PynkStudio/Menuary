"use client";

import { createContext, useCallback, useContext, useState, type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import type { TenantLocation } from "@/lib/tenant";

type GestioneLocationContextValue = {
  locations: TenantLocation[];
  activeLocation: TenantLocation | undefined;
  isMulti: boolean;
  changing: boolean;
  setLocation: (locationId: string, remember?: boolean) => Promise<void>;
};

const GestioneLocationContext = createContext<GestioneLocationContextValue | null>(null);

export function GestioneLocationProvider({
  tenantId,
  locations,
  activeLocation,
  children,
}: PropsWithChildren<{
  tenantId: string;
  locations: TenantLocation[];
  activeLocation?: TenantLocation;
}>) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);

  const setLocation = useCallback(async (locationId: string, remember?: boolean) => {
    setChanging(true);
    try {
      const response = await fetch("/api/gestione/active-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          locationId,
          ...(remember === undefined ? {} : { remember }),
        }),
      });
      if (!response.ok) throw new Error("location_change_failed");
      router.refresh();
    } finally {
      setChanging(false);
    }
  }, [router, tenantId]);

  return (
    <GestioneLocationContext.Provider
      value={{
        locations,
        activeLocation,
        isMulti: locations.length > 1,
        changing,
        setLocation,
      }}
    >
      {children}
    </GestioneLocationContext.Provider>
  );
}

export function useGestioneLocation(): GestioneLocationContextValue {
  const context = useContext(GestioneLocationContext);
  if (!context) throw new Error("useGestioneLocation must be used inside GestioneLocationProvider");
  return context;
}

export function useGestioneLocationOrNull(): GestioneLocationContextValue | null {
  return useContext(GestioneLocationContext);
}
