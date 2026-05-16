"use client";

import { MapPin, ChevronDown } from "lucide-react";
import { useLocation } from "./location-provider";

/**
 * Mostra un selettore di sede solo quando il tenant ha 2+ sedi.
 * Con una sola sede non renderizza nulla — zero impatto per tenant single-location.
 */
export function LocationPicker() {
  const { locations, activeLocation, isMulti, setLocation } = useLocation();

  if (!isMulti) return null;

  return (
    <div className="relative inline-block">
      <label className="sr-only">Seleziona sede</label>
      <div className="flex items-center gap-1.5 cursor-pointer">
        <MapPin className="w-4 h-4 opacity-60 shrink-0" />
        <select
          value={activeLocation?.slug ?? ""}
          onChange={(e) => setLocation(e.target.value)}
          className="appearance-none bg-transparent pr-5 text-sm font-medium cursor-pointer focus:outline-none"
          aria-label="Sede attiva"
        >
          {locations.map((loc) => (
            <option key={loc.id} value={loc.slug}>
              {loc.name}
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 opacity-50 pointer-events-none -ml-4" />
      </div>
    </div>
  );
}
