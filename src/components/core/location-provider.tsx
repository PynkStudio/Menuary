"use client";

import {
  createContext,
  useContext,
  useCallback,
  type PropsWithChildren,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { TenantLocation } from "@/lib/tenant";
import { isMultiLocation, findLocationBySlug } from "@/lib/location";

interface LocationContextValue {
  locations: TenantLocation[];
  activeLocation: TenantLocation | undefined;
  isMulti: boolean;
  setLocation: (slug: string) => void;
}

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({
  locations,
  activeSlug,
  children,
}: PropsWithChildren<{ locations: TenantLocation[]; activeSlug?: string }>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Client-side slug overrides the server-resolved one (from ?loc= param)
  const clientSlug = searchParams.get("loc") ?? searchParams.get("location") ?? activeSlug;
  const activeLocation =
    findLocationBySlug(locations, clientSlug) ??
    locations.find((l) => l.isDefault) ??
    locations[0];

  const setLocation = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("loc", slug);
      } else {
        params.delete("loc");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return (
    <LocationContext.Provider
      value={{
        locations,
        activeLocation,
        isMulti: isMultiLocation(locations),
        setLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside LocationProvider");
  return ctx;
}

export function useLocationOrNull(): LocationContextValue | null {
  return useContext(LocationContext);
}
