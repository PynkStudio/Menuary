import { NextRequest, NextResponse } from "next/server";
import { pushMenuToHubrise } from "@/lib/hubrise/push-menu";
import type { MenuSyncBundle } from "@/lib/menu-sync-types";

export const dynamic = "force-dynamic";

/** Forza re-push del menu corrente verso HubRise per il tenant indicato. */
export async function POST(req: NextRequest) {
  const { tenantId } = (await req.json().catch(() => ({}))) as { tenantId?: string };
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const origin = new URL(req.url).origin;
  const bundleRes = await fetch(`${origin}/api/menu-sync?tenantId=${encodeURIComponent(tenantId)}`);
  if (!bundleRes.ok) return NextResponse.json({ error: "bundle_fetch_failed" }, { status: 502 });
  const bundle = (await bundleRes.json()) as MenuSyncBundle;

  const results = await pushMenuToHubrise({ tenantId, bundle, force: true });
  return NextResponse.json({ ok: true, results });
}
