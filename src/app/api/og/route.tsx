import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

type OgBrand = {
  name: string;
  payoff: string;
  modules: string;
  domain: string;
  bg: string;
  fg: string;
  accent: string;
  soft: string;
};

const BRANDS: Record<string, OgBrand> = {
  menuary: {
    name: "Menuary",
    payoff: "Siti web per ristoranti, bar e pizzerie",
    modules: "Menu digitale · Prenotazioni · Ordini · Recensioni",
    domain: "menuary.it",
    bg: "#18231f",
    fg: "#fbf8f1",
    accent: "#a95f45",
    soft: "#d2b66d",
  },
  bizery: {
    name: "Bizery",
    payoff: "Siti web per studi, saloni e aziende di servizi",
    modules: "Appuntamenti · Listino · CRM · Recensioni",
    domain: "bizery.it",
    bg: "#0f172a",
    fg: "#eff6ff",
    accent: "#2563eb",
    soft: "#93c5fd",
  },
  orpheo: {
    name: "Orpheo",
    payoff: "Siti e strumenti per artisti e professionisti creativi",
    modules: "Press kit · Opere · Booking · Diritti",
    domain: "weuseorpheo.com",
    bg: "#17111f",
    fg: "#fbfaf7",
    accent: "#7c3aed",
    soft: "#f4df9a",
  },
};

export async function GET(request: NextRequest) {
  const brand = BRANDS[request.nextUrl.searchParams.get("brand") ?? ""] ?? BRANDS.menuary;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: brand.bg,
          color: brand.fg,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9999,
              backgroundColor: brand.accent,
            }}
          />
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 2 }}>
            {brand.name}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 980,
            }}
          >
            {brand.payoff}
          </div>
          <div style={{ fontSize: 30, color: brand.soft }}>{brand.modules}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontSize: 26,
              padding: "12px 28px",
              borderRadius: 9999,
              backgroundColor: brand.accent,
              color: brand.fg,
              fontWeight: 700,
            }}
          >
            {brand.domain}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 56, height: 8, borderRadius: 9999, backgroundColor: brand.accent }} />
            <div style={{ width: 28, height: 8, borderRadius: 9999, backgroundColor: brand.soft }} />
            <div style={{ width: 14, height: 8, borderRadius: 9999, backgroundColor: brand.fg }} />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "cache-control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
