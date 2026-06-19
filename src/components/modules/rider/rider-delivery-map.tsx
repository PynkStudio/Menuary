"use client";

import { useEffect, useRef } from "react";

type Props = {
  lat: number;
  lng: number;
  label?: string;
};

export function RiderDeliveryMap({ lat, lng, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: import("maplibre-gl").Map | null = null;

    async function init() {
      // @ts-expect-error -- maplibre CSS import has no local type declaration.
      await import("maplibre-gl/dist/maplibre-gl.css");
      const ml = await import("maplibre-gl");

      map = new ml.Map({
        container: containerRef.current!,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [lng, lat],
        zoom: 16,
        attributionControl: false,
      });

      new ml.Marker({ color: "#e63946" })
        .setLngLat([lng, lat])
        .setPopup(label ? new ml.Popup().setText(label) : undefined)
        .addTo(map);
    }

    init();
    return () => { map?.remove(); };
  }, [lat, lng, label]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: 260, borderRadius: 10, overflow: "hidden" }}
    />
  );
}
