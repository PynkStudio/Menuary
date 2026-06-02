import { NextRequest, NextResponse } from "next/server";
import {
  buildRetellInboundContext,
  createRetellOrder,
  createRetellReservation,
  getRetellAvailability,
  isAuthorizedRetellRequest,
  type CreateRetellOrderInput,
  type CreateRetellReservationInput,
  type RetellAvailabilityInput,
} from "@/lib/retell/inbound-orchestrator";

type RetellActionBody =
  | ({ action: "context" } & { tenantId?: string; tenant_id?: string; locationId?: string | null; location_id?: string | null })
  | ({ action: "venue_info" } & { tenantId?: string; tenant_id?: string; locationId?: string | null; location_id?: string | null })
  | ({
      action: "menu_search";
      tenantId?: string;
      tenant_id?: string;
      locationId?: string | null;
      location_id?: string | null;
      query?: string | null;
      categoryCode?: string | null;
      category_code?: string | null;
      itemCodes?: string[] | null;
      item_codes?: string[] | null;
      limit?: number | null;
    })
  | ({ action: "availability" } & RetellAvailabilityInput)
  | ({ action: "create_reservation" } & CreateRetellReservationInput)
  | ({ action: "create_order" } & CreateRetellOrderInput);

function tenantFrom(req: NextRequest, body?: RetellActionBody | null): string {
  return (
    req.nextUrl.searchParams.get("tenant_id") ||
    req.nextUrl.searchParams.get("tenantId") ||
    (body && "tenantId" in body ? body.tenantId : undefined) ||
    (body && "tenant_id" in body ? body.tenant_id : undefined) ||
    ""
  );
}

function locationFrom(req: NextRequest, body?: RetellActionBody | null): string | null {
  return (
    req.nextUrl.searchParams.get("location_id") ||
    req.nextUrl.searchParams.get("locationId") ||
    (body && "locationId" in body ? body.locationId ?? null : null) ||
    (body && "location_id" in body ? body.location_id ?? null : null)
  );
}

function compactVenueInfo(context: Awaited<ReturnType<typeof buildRetellInboundContext>>) {
  return {
    tenant: context.tenant,
    locale: context.locale,
    generatedAt: context.generatedAt,
    capabilities: context.capabilities,
    assistantSettings: context.assistantSettings,
    locations: context.locations,
    menu: {
      timezone: context.menu.timezone,
      activeLists: context.menu.activeLists,
      categories: context.menu.categories.map((category) => ({
        code: category.code,
        title: category.title,
        description: category.description,
        itemsCount: category.items.length,
      })),
    },
    retellInstructions: context.retellInstructions,
  };
}

function compactMenuSearch(
  context: Awaited<ReturnType<typeof buildRetellInboundContext>>,
  body: Extract<RetellActionBody, { action: "menu_search" }>,
) {
  const query = body.query?.trim().toLocaleLowerCase("it-IT") ?? "";
  const categoryCode = (body.categoryCode ?? body.category_code)?.trim().toLocaleLowerCase("it-IT") ?? "";
  const itemCodes = new Set((body.itemCodes ?? body.item_codes ?? []).map((code) => code.trim()).filter(Boolean));
  const limit = Math.min(20, Math.max(1, Math.floor(body.limit ?? 12)));

  const matches = context.menu.categories.flatMap((category) =>
    category.items
      .filter((item) => {
        if (categoryCode && category.code.toLocaleLowerCase("it-IT") !== categoryCode) return false;
        if (itemCodes.size > 0 && !itemCodes.has(item.code)) return false;
        if (!query) return true;
        const haystack = [
          category.code,
          category.title,
          item.code,
          item.name,
          item.description ?? "",
          ...item.tags,
          ...item.allergens,
        ]
          .join(" ")
          .toLocaleLowerCase("it-IT");
        return query.split(/\s+/).every((token) => haystack.includes(token));
      })
      .map((item) => ({
        category: { code: category.code, title: category.title },
        item,
      })),
  );

  return {
    tenantId: context.tenant.id,
    generatedAt: context.generatedAt,
    timezone: context.menu.timezone,
    query: body.query?.trim() || null,
    categoryCode: body.categoryCode ?? body.category_code ?? null,
    returned: Math.min(matches.length, limit),
    totalMatches: matches.length,
    hasMore: matches.length > limit,
    items: matches.slice(0, limit),
  };
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedRetellRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const tenantId = tenantFrom(req);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  try {
    const context = await buildRetellInboundContext(tenantId, {
      locationId: locationFrom(req),
      includeUnavailable: req.nextUrl.searchParams.get("include_unavailable") === "true",
    });
    if (!context.tenant.aiPhoneEnabled) {
      return NextResponse.json({ error: "ai_phone_not_enabled", context }, { status: 403 });
    }
    return NextResponse.json(context);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "retell_context_failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!isAuthorizedRetellRequest(req, rawBody)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (() => {
    try {
      return JSON.parse(rawBody) as RetellActionBody;
    } catch {
      return null;
    }
  })();
  if (!body) return NextResponse.json({ error: "invalid_json" }, { status: 400 });

  try {
    if (body.action === "context" || body.action === "venue_info" || body.action === "menu_search") {
      const tenantId = tenantFrom(req, body);
      if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });
      const context = await buildRetellInboundContext(tenantId, { locationId: locationFrom(req, body) });
      if (!context.tenant.aiPhoneEnabled) {
        return NextResponse.json({ error: "ai_phone_not_enabled", context }, { status: 403 });
      }
      if (body.action === "venue_info") {
        return NextResponse.json({ ok: true, venue: compactVenueInfo(context) });
      }
      if (body.action === "menu_search") {
        return NextResponse.json({ ok: true, menu: compactMenuSearch(context, body) });
      }
      return NextResponse.json(context);
    }

    if (body.action === "create_reservation") {
      const result = await createRetellReservation({ ...body, source: "retell" });
      return NextResponse.json({ ok: true, reservation: result });
    }

    if (body.action === "availability") {
      const result = await getRetellAvailability(body);
      return NextResponse.json({ ok: true, availability: result });
    }

    if (body.action === "create_order") {
      const result = await createRetellOrder({ ...body, source: "retell" });
      return NextResponse.json({ ok: true, order: result });
    }

    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "retell_action_failed" },
      { status: 500 },
    );
  }
}
