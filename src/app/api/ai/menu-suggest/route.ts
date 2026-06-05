import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { suggestUpsellsForOrder } from "@/lib/upselling-engine";
import type { MenuOrderChannel } from "@/lib/types";
import { isMenuOrderChannel } from "@/lib/menu-channels";

type Body = {
  tenantId: string;
  itemIds?: string[];
  channel?: MenuOrderChannel;
  tableId?: string | null;
  message?: string;
};

/**
 * Upselling AI: legge l'indice menu/canale e usa una fallback LLM per ordini ambigui.
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body.tenantId || !findTenantById(body.tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ suggestions: [], note: "no_service_db" });
  }

  const ids = body.itemIds?.filter(Boolean) ?? [];
  if (ids.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const channel = normalizeChannel(body.channel);
  const auth = await createSupabaseServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  const suggestions = await suggestUpsellsForOrder(svc, {
    tenantId: body.tenantId,
    itemCodes: [...new Set(ids)],
    channel,
    tableId: body.tableId ?? null,
    userId: user?.id ?? null,
  });

  return NextResponse.json({ suggestions });
}

function normalizeChannel(channel: unknown): MenuOrderChannel {
  return isMenuOrderChannel(channel) ? channel : "site";
}
