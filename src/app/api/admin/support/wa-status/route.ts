import { NextResponse } from "next/server";
import { getCurrentSiteadmin } from "@/lib/support/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteadmin = await getCurrentSiteadmin();
  if (!siteadmin) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const remoteUrl = process.env.WA_REMOTE_STATUS_URL || process.env.WHATSAPP_WORKER_STATUS_URL;
  if (!remoteUrl) {
    return NextResponse.json({
      ok: false,
      remoteConfigured: false,
      ready: false,
      state: "disconnected",
      updatedAt: null,
      error: "Configura WA_REMOTE_STATUS_URL con l'endpoint /status del worker OpenWA remoto.",
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4_000);
    const response = await fetch(remoteUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: process.env.WA_REMOTE_STATUS_TOKEN
        ? { authorization: `Bearer ${process.env.WA_REMOTE_STATUS_TOKEN}` }
        : undefined,
    });
    clearTimeout(timeout);

    const payload = await response.json().catch(() => ({}));
    return NextResponse.json({
      ok: response.ok,
      remoteConfigured: true,
      ...payload,
      updatedAt: payload.updatedAt ?? new Date().toISOString(),
      error: response.ok ? payload.error ?? null : `Worker HTTP ${response.status}`,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      remoteConfigured: true,
      ready: false,
      state: "error",
      updatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Worker non raggiungibile",
    });
  }
}
