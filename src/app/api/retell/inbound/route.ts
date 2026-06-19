import { NextRequest, NextResponse } from "next/server";
import {
  buildRetellInboundContext,
  createRetellOrder,
  createRetellReservation,
  detectRetellMenuOpportunity,
  getRetellAvailability,
  isAuthorizedRetellRequest,
  lookupRetellCustomer,
  resendRetellOrderLink,
  setCustomerLanguage,
  type CreateRetellOrderInput,
  type CreateRetellReservationInput,
  type RetellAvailabilityInput,
} from "@/lib/retell/inbound-orchestrator";
import { resolveRetellTenantByPhone } from "@/lib/retell/settings";

// calledNumber viene iniettato dal flow Retell come {{to_number}} (parametro constant,
// non compilato dall'LLM). È la fonte di verità per risolvere il tenant, immune
// da allucinazioni. Tutti i tipi di action possono trasportarlo.
type WithCalledNumber = { calledNumber?: string; called_number?: string };

type RetellActionBody =
  | ({ action: "context" } & { tenantId?: string; tenant_id?: string; locationId?: string | null; location_id?: string | null } & WithCalledNumber)
  | ({ action: "venue_info" } & { tenantId?: string; tenant_id?: string; locationId?: string | null; location_id?: string | null } & WithCalledNumber)
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
    } & WithCalledNumber)
  | ({ action: "availability" } & RetellAvailabilityInput & WithCalledNumber)
  | ({ action: "create_reservation" } & CreateRetellReservationInput & WithCalledNumber)
  | ({ action: "create_order" } & CreateRetellOrderInput & WithCalledNumber)
  | ({ action: "customer_lookup"; tenantId?: string; tenant_id?: string; callerPhone?: string; caller_phone?: string } & WithCalledNumber)
  | ({ action: "set_customer_language"; tenantId?: string; tenant_id?: string; callerPhone?: string; caller_phone?: string; language: string } & WithCalledNumber)
  | ({ action: "detect_menu_opportunity"; tenantId?: string; tenant_id?: string; itemCodes: string[] } & WithCalledNumber)
  | ({ action: "resend_order_link"; orderId: string; callerPhone?: string; caller_phone?: string } & WithCalledNumber);

// Errori "di input" (codice prodotto inesistente, voce fuori menu, prezzo da
// confermare, canale non in accettazione, ecc.): non sono guasti del server, ma
// condizioni che l'agente AI deve gestire conversazionalmente. Li mappiamo su 422
// così Retell non mostra un "errore tecnico" generico e l'assistente può proporre
// alternative. Tutto il resto resta 500.
const CLIENT_ERROR_PREFIXES = [
  "tenant_not_found",
  "tenant_required",
  "orders_not_accepting",
  "reservations_not_accepting",
  "empty_order",
  "missing_items:",
  "item_unavailable:",
  "item_not_in_active_menu:",
  "missing_extra:",
  "price_to_confirm:",
  "price_option_required:",
  "delivery_address_required",
  "payment_phone_required",
  "recipient_phone_required",
  "order_id_required",
  "invalid_amount",
];

function statusForError(message: string): number {
  return CLIENT_ERROR_PREFIXES.some((prefix) => message.startsWith(prefix)) ? 422 : 500;
}

function calledNumberFrom(body?: RetellActionBody | null): string {
  if (!body) return "";
  return (
    ("calledNumber" in body ? body.calledNumber : undefined) ||
    ("called_number" in body ? body.called_number : undefined) ||
    ""
  );
}

function tenantFrom(req: NextRequest, body?: RetellActionBody | null): string {
  return (
    req.nextUrl.searchParams.get("tenant_id") ||
    req.nextUrl.searchParams.get("tenantId") ||
    (body && "tenantId" in body ? body.tenantId : undefined) ||
    (body && "tenant_id" in body ? body.tenant_id : undefined) ||
    ""
  );
}

// Risolve il tenantId con priorità:
// 1. calledNumber → lookup DB per phone_number (immune da allucinazioni LLM)
// 2. URL query string tenant_id
// 3. Valore nel body (potenzialmente allucinato dall'LLM, usato solo come fallback)
async function resolveTenantId(req: NextRequest, body?: RetellActionBody | null): Promise<string> {
  const calledNumber = calledNumberFrom(body);
  if (calledNumber) {
    const resolved = await resolveRetellTenantByPhone(calledNumber);
    if (resolved) return resolved;
  }
  return tenantFrom(req, body);
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
    const message = error instanceof Error ? error.message : "retell_context_failed";
    const status = statusForError(message);
    console.error(`[retell/inbound] GET tenant=${tenantId} status=${status} error=${message}`, error);
    return NextResponse.json({ error: message }, { status });
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
    const tenantId = await resolveTenantId(req, body);

    if (body.action === "context" || body.action === "venue_info" || body.action === "menu_search") {
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
      const result = await createRetellReservation({
        ...body,
        tenantId: tenantId || body.tenantId,
        locationId: locationFrom(req, body) ?? body.locationId,
        source: "retell",
      });
      return NextResponse.json({ ok: true, reservation: result });
    }

    if (body.action === "availability") {
      const result = await getRetellAvailability({
        ...body,
        tenantId: tenantId || body.tenantId,
        locationId: locationFrom(req, body) ?? body.locationId,
      });
      return NextResponse.json({ ok: true, availability: result });
    }

    if (body.action === "create_order") {
      const result = await createRetellOrder({
        ...body,
        tenantId: tenantId || body.tenantId,
        locationId: locationFrom(req, body) ?? body.locationId,
        source: "retell",
      });
      return NextResponse.json({ ok: true, order: result });
    }

    if (body.action === "customer_lookup") {
      if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });
      const callerPhone = ("callerPhone" in body ? body.callerPhone : undefined)
        ?? ("caller_phone" in body ? body.caller_phone : undefined)
        ?? "";
      const customer = await lookupRetellCustomer(tenantId, callerPhone ?? "");
      return NextResponse.json({ ok: true, customer });
    }

    if (body.action === "set_customer_language") {
      if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });
      const callerPhone = ("callerPhone" in body ? body.callerPhone : undefined)
        ?? ("caller_phone" in body ? body.caller_phone : undefined)
        ?? "";
      const result = await setCustomerLanguage(tenantId, callerPhone ?? "", body.language ?? "");
      return NextResponse.json({ ok: true, ...result });
    }

    if (body.action === "detect_menu_opportunity") {
      if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });
      const opportunity = await detectRetellMenuOpportunity(tenantId, body.itemCodes ?? []);
      return NextResponse.json({ ok: true, opportunity });
    }

    if (body.action === "resend_order_link") {
      if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });
      if (!body.orderId) return NextResponse.json({ error: "order_id_required" }, { status: 422 });
      const recipientPhone =
        ("callerPhone" in body ? body.callerPhone : undefined) ??
        ("caller_phone" in body ? body.caller_phone : undefined) ??
        "";
      const result = await resendRetellOrderLink({ tenantId, orderId: body.orderId, recipientPhone });
      return NextResponse.json({ ok: true, ...result });
    }

    return NextResponse.json({ error: "unsupported_action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "retell_action_failed";
    const status = statusForError(message);
    const action = body && "action" in body ? body.action : "unknown";
    console.error(
      `[retell/inbound] POST action=${action} tenant=${tenantFrom(req, body)} status=${status} error=${message}`,
      error,
    );
    return NextResponse.json({ error: message }, { status });
  }
}
