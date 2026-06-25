import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/lib/database.types";
import { buildRetellInboundContext, isAuthorizedRetellRequest, lookupRetellCustomer } from "@/lib/retell/inbound-orchestrator";
import { getAiPhoneSettings, listAiPhoneSettings } from "@/lib/retell/settings";
import { buildAiPaymentInstruction } from "@/lib/payments/ai-payment-instruction";
import { findTenantById } from "@/lib/tenant-registry";
import { getTenantContent } from "@/lib/tenant-content";
import { defaultHoursWeekForTenant, type DaySchedule } from "@/lib/venue-hours";
import { computeStatusFromSlots, parseSlot } from "@/lib/hours-status";

const LABEL_TO_DOW: Record<string, number> = {
  "Lunedì": 0, "Martedì": 1, "Mercoledì": 2, "Giovedì": 3, "Venerdì": 4, "Sabato": 5, "Domenica": 6,
};

// Stato aperto/chiuso "in questo momento" nel fuso del locale (Europe/Rome), con una
// frase pronta per l'agente: il server è UTC, quindi NON possiamo usare getHours() diretto.
// Costruiamo una Date "finta" i cui componenti locali coincidono con l'orologio di Roma,
// così computeStatusFromSlots (che legge getHours/getMinutes) è corretta.
function computeOpenStatusSpoken(
  weeklyHours: DaySchedule[],
  specials: { date: string; closed: boolean; slots: string[] }[],
): { openNow: boolean; todayHours: string; spoken: string } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Rome",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    weekday: "short", hourCycle: "h23",
  }).formatToParts(now);
  const g = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  const y = Number(g("year")), mo = Number(g("month")), d = Number(g("day"));
  const h = Number(g("hour")), mi = Number(g("minute")), s = Number(g("second"));
  const wk: Record<string, number> = { Sun: 6, Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 };
  const dow = wk[g("weekday")] ?? 0;
  const fakeNow = new Date(y, mo - 1, d, h, mi, s);

  const iso = (yy: number, mm: number, dd: number) => `${yy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const isoToday = iso(y, mo, d);
  const yDate = new Date(y, mo - 1, d - 1);
  const isoYest = iso(yDate.getFullYear(), yDate.getMonth() + 1, yDate.getDate());

  const byIndex = (idx: number) => weeklyHours.find((day) => LABEL_TO_DOW[day.label] === idx);
  const resolveDay = (isoDate: string, idx: number): { closed: boolean; slots: string[] } => {
    const sp = specials.find((e) => e.date === isoDate);
    if (sp) return { closed: sp.closed, slots: sp.slots };
    const day = byIndex(idx);
    return day ? { closed: day.closed, slots: day.slots } : { closed: true, slots: [] };
  };
  const today = resolveDay(isoToday, dow);
  const yest = resolveDay(isoYest, (dow + 6) % 7);
  const todaySlots = today.closed ? [] : today.slots;
  const yestSlots = yest.closed ? [] : yest.slots;

  const status = computeStatusFromSlots(todaySlots, yestSlots, fakeNow);
  const openNow = status.kind === "open" || status.kind === "closing_soon";
  const todayHours = todaySlots.length === 0 ? "oggi chiuso" : todaySlots.join(", ");

  // Prossima apertura odierna se al momento chiusi.
  const nowMin = h * 60 + mi;
  let nextOpen: string | null = null;
  for (const slot of todaySlots) {
    const ps = parseSlot(slot);
    if (!ps) continue;
    const startMin = ps.openH * 60 + ps.openM;
    if (startMin > nowMin) { nextOpen = `${String(ps.openH).padStart(2, "0")}:${String(ps.openM).padStart(2, "0")}`; break; }
  }

  let spoken: string;
  if (status.kind === "open") spoken = `Sì, siamo aperti${status.closesAt ? `, fino alle ${status.closesAt}` : ""}.`;
  else if (status.kind === "closing_soon") spoken = `Siamo aperti ma stiamo per chiudere, alle ${status.closesAt}.`;
  else if (status.kind === "opening_soon") spoken = `In questo momento siamo ancora chiusi, apriamo a breve alle ${status.opensAt}.`;
  else spoken = nextOpen
    ? `In questo momento siamo chiusi; oggi apriamo alle ${nextOpen}.`
    : `In questo momento siamo chiusi. Oggi ${todayHours === "oggi chiuso" ? "siamo chiusi" : `siamo aperti ${todayHours}`}.`;

  return { openNow, todayHours, spoken };
}

// Saluto contestuale in base all'ora locale (Europe/Rome): Buongiorno / Buon pomeriggio / Buonasera.
function italianGreetingForNow(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(now),
  );
  if (hour >= 6 && hour < 13) return "Buongiorno";
  if (hour >= 13 && hour < 19) return "Buon pomeriggio";
  return "Buonasera";
}

function normalizePhoneCandidates(value: string | null | undefined): string[] {
  if (!value) return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  return Array.from(new Set([trimmed, digitsOnly, `+${digitsOnly}`].filter(Boolean)));
}

async function resolveTenantFromInbound(payload: Record<string, unknown>): Promise<string | null> {
  const inbound = (payload.call_inbound ?? payload.call ?? {}) as Record<string, unknown>;
  const toNumber = typeof inbound.to_number === "string" ? inbound.to_number : null;
  const agentId = typeof inbound.agent_id === "string" ? inbound.agent_id : null;
  const settings = await listAiPhoneSettings();

  if (toNumber) {
    const candidates = normalizePhoneCandidates(toNumber);
    const byPhone = settings.find((entry) =>
      candidates.some((candidate) => candidate === entry.phoneNumber.trim()),
    );
    if (byPhone) return byPhone.tenantId;
  }
  if (agentId) {
    const byAgent = settings.find((entry) => entry.retellAgentId === agentId);
    if (byAgent) return byAgent.tenantId;
  }
  return null;
}

async function buildInboundDynamicVariables(
  tenantId: string,
  inbound: { fromNumber?: string | null; toNumber?: string | null } = {},
) {
  const settings = await getAiPhoneSettings(tenantId);
  const variables: Record<string, string> = {
    tenant_id: tenantId,
    // Autentica i custom tool (search_menu/create_order): Retell rimanda questo
    // valore nell'header x-retell-secret quando chiama /api/retell/inbound.
    // Iniettato per-chiamata, così non va salvato in chiaro nella config Retell.
    retell_webhook_secret: process.env.RETELL_WEBHOOK_SECRET ?? "",
    daily_notes: (settings.quickSettings.notesForAssistant ?? "").trim(),
    caller_phone: (inbound.fromNumber ?? "").trim(),
    called_number: (inbound.toNumber ?? "").trim(),
    greeting: italianGreetingForNow(),
    // Frasi pronte (in italiano) da far pronunciare al modello traducendole nella
    // lingua del cliente: il modello in chiamata è inaffidabile sui rami se/altrimenti,
    // quindi la scelta della frase la fa il backend. La persona ("sono Nora di …") resta nel flow.
    welcome_greeting: italianGreetingForNow(),
    // Default conservativi: la flow li può overrideare se manca contesto.
    multi_location_choice_required: "false",
    location_id: "",
    location_name: "",
    open_hours: "",
    special_hours: "",
    open_now: "false",
    today_hours: "",
    open_status_spoken: "",
    payment_instruction: "",
    payment_online_available: "false",
    payment_on_site_available: "true",
    payment_should_ask: "false",
    suggest_alternatives: settings.quickSettings.suggestAlternatives ? "true" : "false",
    ask_allergies: settings.quickSettings.askAllergiesForOrders ? "true" : "false",
    collect_marketing_consent: settings.quickSettings.collectMarketingConsent ? "true" : "false",
    human_transfer_enabled: settings.humanTransferEnabled ? "true" : "false",
    handoff_phone: settings.handoffPhone ?? "",
    accepting_orders: settings.quickSettings.acceptNewOrders.accepting ? "true" : "false",
    accepting_reservations: settings.quickSettings.acceptReservations.accepting ? "true" : "false",
    delivery_available: "false",
    takeaway_available: "false",
    customer_known: "false",
    customer_first_name: "",
    customer_language: "",
    customer_last_address: "",
    customer_last_order_summary: "",
    last_order_offer_spoken: "",
    delivery_address_offer_spoken: "",
    // Direttiva unica sul nome (zero rami nel prompt): cliente noto → annuncia il nome;
    // sconosciuto → chiedilo. Per i noti il nome è già iniettato lato server nell'ordine.
    order_name_directive: "Chiedi il nome per l'ordine e attendi la risposta.",
    active_order_summary: "",
    active_order_modifiable: "false",
    active_order_checkout_url: "",
  };

  // Anagrafica statica del locale dal content registry — tutto stringificato per Retell.
  try {
    const content = getTenantContent(tenantId);
    variables.venue_name = content.logoAlt ?? "";
    variables.venue_description = content.description ?? "";
    variables.venue_address = content.address?.full ?? "";
    variables.venue_phone = content.contact?.phone ?? "";
    variables.venue_website = (content.url ?? "").replace(/^https?:\/\//, "");
    variables.venue_specialty = (content.souls ?? [])
      .map((soul) => soul.title)
      .filter(Boolean)
      .join(", ");
    variables.venue_social_facebook = content.social?.facebook ?? "";
    variables.venue_social_instagram = content.social?.instagram ?? "";
    variables.venue_whatsapp_digits = content.contact?.whatsappDigits ?? "";
  } catch {
    // Tenant senza content registry: skip campi anagrafici, il resto basta.
  }

  try {
    const db = createSupabaseServiceClient();
    if (!db) throw new Error("no_db");

    const tenantProfile = findTenantById(tenantId);

    // Solo queries necessarie per il greeting: tenant, sedi, ore speciali e lookup
    // cliente — tutto in parallelo. Il menu completo NON serve qui (l'agente lo
    // carica on-demand via search_menu), evitando ~8 query pesanti che causavano
    // 5-6 secondi di vuoto prima della risposta.
    const [{ data: tenantRow }, { data: locationRows }, { data: specialRows }, customer] = await Promise.all([
      db.from("tenants").select("id,name,vertical,hours").eq("id", tenantId).maybeSingle(),
      db.from("locations").select("id,slug,name,address,city,phone,email,is_default,hours")
        .eq("tenant_id", tenantId)
        .order("is_default", { ascending: false })
        .order("name", { ascending: true }),
      settings.includeSpecialHours
        ? db.from("tenant_special_hours").select("date,closed,slots,label,location_id")
            .eq("tenant_id", tenantId)
            .gte("date", new Date().toISOString().slice(0, 10))
            .order("date", { ascending: true })
            .limit(30)
        : Promise.resolve({ data: [] as { date: string; closed: boolean; slots: unknown; label: string | null; location_id: string | null }[] }),
      lookupRetellCustomer(tenantId, inbound.fromNumber ?? "").catch(() => null),
    ]);

    const vertical = (tenantRow?.vertical as string) ?? tenantProfile?.vertical ?? "food";
    variables.tenant_name = (tenantRow?.name as string) ?? tenantProfile?.name ?? "";
    if (!variables.venue_name) variables.venue_name = variables.tenant_name;

    const locations = locationRows ?? [];
    const location = locations[0] as { id: string; slug: string; name: string; is_default: boolean; hours?: unknown } | undefined;
    if (location) {
      variables.location_id = location.id;
      variables.location_name = location.name;
      variables.multi_location_choice_required = locations.length > 1 ? "true" : "false";
    }

    // Orari: location.hours → tenants.hours → default. Calcolati ANCHE senza location
    // (tenant servito a livello tenant, es. kimos), coerente col fallback di loadWeekHours
    // del modulo ordini: altrimenti open_status_spoken/open_hours/today_hours restano vuoti.
    const isWeek = (h: unknown): h is DaySchedule[] =>
      Array.isArray(h) && h.length > 0 &&
      h.every((d) => d && typeof d === "object" && typeof (d as Record<string, unknown>).label === "string");
    const tenantHours = (tenantRow as { hours?: unknown } | null)?.hours;
    const weeklyHours: DaySchedule[] = isWeek(location?.hours)
      ? (location!.hours as DaySchedule[])
      : isWeek(tenantHours)
        ? (tenantHours as DaySchedule[])
        : defaultHoursWeekForTenant(tenantId);

    const weekly = weeklyHours
      .map((day) => `${day.label}: ${day.closed ? "chiuso" : day.slots.join(", ")}`)
      .join(" | ");
    if (weekly) variables.open_hours = weekly;

    const specials = (specialRows ?? []) as { date: string; closed: boolean; slots: unknown; label: string | null; location_id: string | null }[];
    // Senza location: tieni gli special tenant-wide (location_id null); con location: anche i suoi.
    const relevantSpecial = (entry: { location_id: string | null }) =>
      !entry.location_id || !location || entry.location_id === location.id;
    variables.special_hours = specials
      .filter(relevantSpecial)
      .map((entry) => `${entry.date}${entry.label ? ` (${entry.label})` : ""}: ${entry.closed ? "chiuso" : (Array.isArray(entry.slots) ? entry.slots : []).join(", ")}`)
      .join(" | ");

    // Stato aperto/chiuso "ora" + frase pronta, così l'agente risponde correttamente a
    // "siete aperti?" senza inventare né dire che non può verificare gli orari.
    const specialsNorm = specials
      .filter(relevantSpecial)
      .map((entry) => ({
        date: entry.date,
        closed: entry.closed,
        slots: Array.isArray(entry.slots) ? (entry.slots as string[]) : [],
      }));
    const openStatus = computeOpenStatusSpoken(weeklyHours, specialsNorm);
    variables.open_now = openStatus.openNow ? "true" : "false";
    variables.today_hours = openStatus.todayHours;
    variables.open_status_spoken = openStatus.spoken;

    if (tenantProfile) {
      variables.delivery_available = tenantProfile.features.deliveryHub ? "true" : "false";
      variables.takeaway_available = tenantProfile.features.takeaway ? "true" : "false";
    }

    if (customer) {
      variables.customer_known = customer.isKnown ? "true" : "false";
      variables.customer_first_name = customer.firstName;
      variables.customer_language = customer.language;
      variables.customer_last_address = customer.lastAddress;
      variables.customer_last_order_summary = customer.lastOrderSummary;
      if (customer.isKnown && customer.firstName) {
        variables.welcome_greeting = `Ciao ${customer.firstName}`;
        variables.order_name_directive = `Di' che l'ordine sarà a nome ${customer.firstName}.`;
      }
      if (customer.lastAddress) {
        variables.delivery_address_offer_spoken = `Gliela portiamo in ${customer.lastAddress}?`;
      }
      if (customer.isKnown && customer.lastOrderSummary) {
        variables.last_order_offer_spoken = `Vuole come l'ultima volta: ${customer.lastOrderSummary}?`;
      }
      if (customer.activeOrder) {
        variables.active_order_summary = [
          `ordine ${customer.activeOrder.code}`,
          customer.activeOrder.statusLabel,
          customer.activeOrder.itemsSummary,
          customer.activeOrder.scheduledTime ? `orario ${customer.activeOrder.scheduledTime}` : "",
        ].filter(Boolean).join(" - ");
        variables.active_order_modifiable = customer.activeOrder.isModifiable ? "true" : "false";
        variables.active_order_checkout_url = customer.activeOrder.checkoutUrl;
      }
    }

    const instruction = buildAiPaymentInstruction({
      paymentsModuleEnabled: Boolean(tenantProfile?.features.payments),
      stripeReady: false,
      policy: settings.paymentControls.acceptedMethods,
      vertical: vertical === "services" ? "services" : "food",
    });
    variables.payment_instruction = instruction.text;
    variables.payment_online_available = instruction.onlineAvailable ? "true" : "false";
    variables.payment_on_site_available = instruction.onSiteAvailable ? "true" : "false";
    variables.payment_should_ask = instruction.shouldAsk ? "true" : "false";
  } catch {
    // Contesto opzionale: la chiamata può proseguire con sole note del giorno + anagrafica statica.
  }
  return variables;
}

/** Riceve eventi Retell; persistenza grezza per idempotenza e debug. */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!isAuthorizedRetellRequest(req, rawBody)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  const eventType = typeof payload.event === "string" ? payload.event : null;
  const tenantIdParam = req.nextUrl.searchParams.get("tenant_id");
  // Webhook generico di piattaforma: senza tenant_id nel query, risolviamo il tenant
  // dal payload (to_number → agent_id) per OGNI evento — call_inbound e ciclo vita
  // (call_ended/analyzed) — così una sola URL condivisa attribuisce tutto correttamente.
  const tenantId = tenantIdParam || (await resolveTenantFromInbound(payload));

  // call_inbound: Retell aspetta una risposta sincrona con eventuali dynamic_variables/override_agent_id.
  // Qui iniettiamo le "Note del giorno" del ristoratore (quickSettings.notesForAssistant) + orari aggiornati.
  if (eventType === "call_inbound") {
    const inbound = (payload.call_inbound ?? payload.call ?? {}) as Record<string, unknown>;
    const dynamicVariables = tenantId
      ? await buildInboundDynamicVariables(tenantId, {
          fromNumber: typeof inbound.from_number === "string" ? inbound.from_number : null,
          toNumber: typeof inbound.to_number === "string" ? inbound.to_number : null,
        })
      : {};
    const svc = createSupabaseServiceClient();
    if (svc) {
      await svc.from("channel_webhook_events").insert({
        channel: "retell",
        tenant_id: tenantId,
        payload: payload as Json,
      });
    }
    return NextResponse.json({
      call_inbound: {
        dynamic_variables: dynamicVariables,
        metadata: tenantId ? { tenant_id: tenantId } : {},
      },
    });
  }

  const svc = createSupabaseServiceClient();
  if (!svc) {
    return NextResponse.json({ ok: true, stored: false });
  }
  await svc.from("channel_webhook_events").insert({
    channel: "retell",
    tenant_id: tenantId,
    payload: payload as Json,
  });
  return NextResponse.json({ ok: true, stored: true });
}

/** Endpoint rapido per Retell custom tools che devono recuperare il contesto tenant. */
export async function GET(req: NextRequest) {
  if (!isAuthorizedRetellRequest(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const tenantId = req.nextUrl.searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  try {
    const context = await buildRetellInboundContext(tenantId, {
      locationId: req.nextUrl.searchParams.get("location_id"),
    });
    return NextResponse.json(context);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "retell_context_failed" },
      { status: 500 },
    );
  }
}
