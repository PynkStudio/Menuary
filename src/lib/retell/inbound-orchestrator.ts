import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findTenantById } from "@/lib/tenant-registry";
import { defaultHoursWeekForTenant, type DaySchedule } from "@/lib/venue-hours";
import { formatEuro } from "@/lib/price-utils";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database, Json } from "@/lib/database.types";
import { getAiPhoneSettings, isAiPhoneControlAccepting, type AiPhoneSettings } from "@/lib/retell/settings";
import { createChannelPaymentRequest, type ChannelPaymentRequest, type PaymentLinkChannel } from "@/lib/payments/channel-payment-links";
import { getTenantPaymentAccount } from "@/lib/payments/stripe/accounts";
import { tenantUsesStripeDemoSandbox } from "@/lib/payments/stripe/sandbox-policy";
import { suggestTableForReservation, type ReservationSlot, type TableForPlanner } from "@/lib/reservations/engine";
import { normalizePhone, recordCustomerEvent, resolveCustomerIdentity } from "@/lib/crm/customer-identity";
import { loadOrderSettings } from "@/lib/orders/order-settings";
import { resolveDeliveryAvailability, resolveDeliveryWindowsForDate } from "@/lib/orders/ordering-window";
import type { MenuOrderChannel, PaymentMethod } from "@/lib/types";
import { isMenuOrderChannel } from "@/lib/menu-channels";
import { euroToItalianWords, orderCodeToSpoken } from "@/lib/retell/number-speech";
import { tenantCheckoutUrl } from "@/lib/orders/checkout-url";
import { notifyOperationalNewOrder } from "@/lib/notifications/operational-order-push";

type Db = SupabaseClient<Database>;

type LocationContext = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  isDefault: boolean;
  weeklyHours: DaySchedule[];
  specialHours: {
    date: string;
    closed: boolean;
    slots: string[];
    label: string | null;
  }[];
};

type RetellMenuItemContext = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  available: boolean;
  bookable: boolean;
  durationMinutes: number | null;
  price: string;
  priceOptions: {
    code: string;
    label: string;
    price: string;
    isDefault: boolean;
  }[];
  variantGroups: {
    id: string;
    name: string;
    required: boolean;
    defaultOptionId: string | null;
    options: {
      id: string;
      name: string;
      price: string;
      isDefault: boolean;
    }[];
  }[];
  tags: string[];
  allergens: string[];
  modifications: {
    id: string;
    name: string;
    price: string;
    source: "inline" | "list";
  }[];
};

type MenuListVisibility = {
  days?: number[];
  startTime?: string;
  endTime?: string;
  tableIds?: string[];
  channels?: MenuOrderChannel[];
};

type MenuListRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  enabled: boolean;
  visibility: Json;
};

type MenuListItemRow = {
  list_id: string;
  item_id: string;
};

type MenuCategoryAvailability = {
  label: string;
  days?: number[];
  from: string;
  to: string;
};

export type RetellInboundContext = {
  tenant: {
    id: string;
    name: string;
    vertical: string;
    enabled: boolean;
    aiPhoneEnabled: boolean;
    aiWhatsappEnabled: boolean;
    channelEnabled: boolean;
  };
  locale: string;
  generatedAt: string;
  capabilities: {
    canAnswerQuestions: boolean;
    canCreateTakeawayOrders: boolean;
    canCreateDeliveryOrders: boolean;
    canCreateReservations: boolean;
    canCreateAppointments: boolean;
    canRequestPaymentLinks: boolean;
  };
  assistantSettings: Pick<
    AiPhoneSettings,
    | "phoneNumber"
    | "greetingMessage"
    | "systemPrompt"
    | "handoffPhone"
    | "language"
    | "humanTransferEnabled"
    | "confirmBeforeWrite"
    | "afterHoursMode"
    | "quickSettings"
    | "paymentControls"
  >;
  locations: LocationContext[];
  menu: {
    timezone: string;
    activeLists: {
      code: string;
      name: string;
      description: string | null;
    }[];
    categories: {
      id: string;
      code: string;
      title: string;
      description: string | null;
      items: RetellMenuItemContext[];
    }[];
  };
  retellInstructions: string[];
};

export type CreateRetellReservationInput = {
  tenantId: string;
  locationId?: string | null;
  source?: "retell" | "whatsapp";
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  covers?: number;
  serviceCode?: string | null;
  notes?: string | null;
};

export type CreateRetellOrderInput = {
  tenantId: string;
  locationId?: string | null;
  source?: "retell" | "whatsapp";
  customerName?: string | null;
  customerPhone?: string | null;
  pickupTime?: string | null;
  pickupDate?: string | null;
  desiredTime?: string | null;
  desiredDate?: string | null;
  notes?: string | null;
  fulfillmentType?: "takeaway" | "delivery";
  delivery?: {
    address: string;
    doorbell?: string | null;
    floor?: string | null;
    notes?: string | null;
  } | null;
  requestPayment?: boolean;
  paymentChannel?: PaymentLinkChannel;
  /**
   * Scelta del cliente raccolta dall'agente AI sulla modalità di pagamento.
   * - "online"  → riceve link con riepilogo + pulsante Paga
   * - "on_site" → riceve link col solo riepilogo, pagamento al ritiro/consegna
   * Se omesso, si applica la policy tenant (paymentControls.acceptedMethods) +
   * fallback ai flag requireFor* per retrocompatibilità.
   */
  paymentMethodChoice?: "online" | "on_site";
  /**
   * Metodo di pagamento a 3 valori raccolto dall'agente (preferito su paymentMethodChoice):
   *  - "online"           → paga adesso con carta (Stripe); ordine confermato al pagamento.
   *  - "on_delivery_cash" → paga alla consegna in contanti (auto-accettato).
   *  - "on_delivery_card" → paga alla consegna con carta/POS (auto-accettato).
   */
  paymentMethod?: PaymentMethod;
  lines: {
    itemCode: string;
    quantity: number;
    priceOption?: string | null;
    note?: string | null;
    addedExtraCodes?: string[];
    removedIngredients?: string[];
  }[];
};

function normalizeConversationalOrderTime(input: {
  desiredTime?: string | null;
  desiredDate?: string | null;
  pickupTime?: string | null;
  pickupDate?: string | null;
}): string | null {
  const rawTime = (input.desiredTime ?? input.pickupTime ?? "").trim();
  if (!rawTime) return null;
  const rawDate = (input.desiredDate ?? input.pickupDate ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate) && /^\d{1,2}:\d{2}$/.test(rawTime)) {
    const [hour, minute] = rawTime.split(":");
    return `${rawDate} ${hour!.padStart(2, "0")}:${minute}`;
  }
  return rawTime;
}

export type ValidateOrderTimeInput = {
  tenantId: string;
  locationId?: string | null;
  fulfillmentType?: "takeaway" | "delivery";
  desiredTime?: string | null;
  desiredDate?: string | null;
  pickupTime?: string | null;
  pickupDate?: string | null;
  now?: Date;
};

export type OrderTimeValidationResult =
  | { ok: true; mode: "asap_today" | "time_today"; scheduled: false; date: string; whenSpoken: string | null }
  | { ok: true; mode: "scheduled_future"; scheduled: true; date: string; whenSpoken: string | null }
  | {
      ok: false;
      reason: "too_early" | "outside_window" | "closed_today" | "closed_day";
      date: string;
      requestedSpoken: string | null;
      openWindowSpoken: string;
      earliestSpoken: string | null;
      nextDate: string | null;
      nextEarliestSpoken: string | null;
      canSchedule: boolean;
      // Frase italiana già pronta da far pronunciare al modello (tradotta nella lingua
      // del cliente): centralizza qui i rami se/altrimenti che prima vivevano nel prompt
      // del nodo fix_time, dove il modello li gestiva male.
      fixSpoken: string;
    };

// L'agente esprime l'orario in linguaggio naturale: "il prima possibile", "appena
// pronto", oppure un orario concreto. Solo gli orari concreti vanno validati.
const ASAP_TIME_RE = /prima possibile|appena|asap|subito|quando (potete|puoi|riuscite)/i;

function romeToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: MENU_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function hhmmInRome(iso: string | null): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: MENU_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(new Date(iso));
}

function spokenWindowsIso(windows: Array<{ startIso: string; endIso: string }>): string {
  return windows.map((w) => `${hhmmInRome(w.startIso)}–${hhmmInRome(w.endIso)}`).join(" e ");
}

// Istante UTC (ms) dell'orologio da parete `dateStr`+`hhmm` nel fuso del locale.
function requestedInstantMs(dateStr: string, hhmm: string): number {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const asUTC = Date.UTC(y!, mo! - 1, d!, h!, mi!, 0);
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: MENU_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(asUTC));
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? "0");
  const tzAsUTC = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return asUTC - (tzAsUTC - asUTC);
}

function spokenDateInRome(dateStr: string | null): string {
  if (!dateStr) return "";
  // dateStr è già una data locale di Roma (YYYY-MM-DD): formattata a mezzogiorno UTC
  // restituisce il giorno della settimana corretto senza slittamenti di fuso.
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long",
  }).format(new Date(`${dateStr}T12:00:00Z`));
}

// Compone la frase pronta per il nodo fix_time a partire dal motivo del rifiuto e dai dati
// di disponibilità. Unico punto in cui vivono i rami "oggi ancora possibile / programma il
// prossimo giorno / nessuna fascia".
type OrderTimeFailure = Omit<Extract<OrderTimeValidationResult, { ok: false }>, "fixSpoken">;
function buildFixSpoken(r: OrderTimeFailure): string {
  const nextDay = r.nextDate ? spokenDateInRome(r.nextDate) : "";
  const scheduleLine =
    r.canSchedule && r.nextDate && r.nextEarliestSpoken
      ? ` Il primo giorno disponibile è ${nextDay} a partire dalle ${r.nextEarliestSpoken}. Vuole che programmi l'ordine per allora, oppure preferisce un altro giorno?`
      : "";

  if (r.reason === "too_early") {
    return `Per oggi la prima consegna possibile è alle ${r.earliestSpoken}${r.openWindowSpoken ? ` (consegniamo ${r.openWindowSpoken})` : ""}. Va bene alle ${r.earliestSpoken}, oppure preferisce "il prima possibile"?`;
  }
  if (r.reason === "closed_today") {
    return scheduleLine
      ? `Oggi le consegne sono chiuse.${scheduleLine}`
      : `Oggi le consegne sono chiuse e non riesco a trovare un giorno disponibile a breve. Preferisce richiamare più tardi?`;
  }
  if (r.reason === "closed_day") {
    return scheduleLine
      ? `In quel giorno non effettuiamo consegne.${scheduleLine}`
      : `In quel giorno non effettuiamo consegne. Mi indica un altro giorno?`;
  }
  // outside_window
  if (r.earliestSpoken) {
    // Oggi è ancora possibile: resta nella fascia di oggi.
    return `Per oggi consegniamo ${r.openWindowSpoken}, la prima consegna possibile è alle ${r.earliestSpoken}. Mi dice un orario in quella fascia, oppure preferisce "il prima possibile"?`;
  }
  if (r.openWindowSpoken && !r.nextDate) {
    // Giorno futuro con orario fuori dalla finestra di quel giorno.
    return `In quel giorno consegniamo ${r.openWindowSpoken}. Mi dice un orario in quella fascia?`;
  }
  return scheduleLine
    ? `Per oggi non riusciamo a consegnare in quella fascia.${scheduleLine}`
    : `Al momento non riesco a trovare una fascia di consegna disponibile. Preferisce richiamare più tardi?`;
}

function failResult(r: OrderTimeFailure): Extract<OrderTimeValidationResult, { ok: false }> {
  return { ...r, fixSpoken: buildFixSpoken(r) };
}

/**
 * Valida l'orario di un ordine telefonico contro la FINESTRA CONSEGNE dedicata (offset su
 * orari del locale) e il tempo medio di gestione (lead time): la prima consegna possibile
 * è max(adesso+lead, apertura finestra). Gestisce:
 *  - "il prima possibile" oggi → ok con earliest calcolato;
 *  - orario concreto oggi → ok se in finestra e ≥ earliest;
 *  - oggi non più possibile o data futura → ordine PROGRAMMATO per il prossimo giorno
 *    disponibile (o la data richiesta), validato contro la finestra di quel giorno.
 */
export async function validateRetellOrderTime(
  input: ValidateOrderTimeInput,
): Promise<OrderTimeValidationResult> {
  const db = svc();
  const now = input.now ?? new Date();
  const settings = await loadOrderSettings(db, input.tenantId, input.locationId ?? null);
  const channel = input.fulfillmentType === "delivery" ? "delivery" : "takeaway";
  const loc = input.locationId ?? null;

  const rawTime = (input.desiredTime ?? input.pickupTime ?? "").trim();
  const rawDate = (input.desiredDate ?? input.pickupDate ?? "").trim();
  const today = romeToday();
  const targetDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : today;
  const isFuture = targetDate > today;
  const hhmmMatch = (!rawTime || ASAP_TIME_RE.test(rawTime)) ? null : rawTime.match(/(\d{1,2}):(\d{2})/);
  const hhmm = hhmmMatch ? `${hhmmMatch[1]!.padStart(2, "0")}:${hhmmMatch[2]}` : null;

  // ── Ordine programmato per un giorno futuro ──────────────────────────────
  if (isFuture) {
    const dateObj = new Date(`${targetDate}T12:00:00Z`);
    const { closed, windows } = await resolveDeliveryWindowsForDate(db, {
      tenantId: input.tenantId, locationId: loc, settings, channel, date: dateObj,
    });
    const winIso = windows.map((w) => ({ startIso: w.start.toISOString(), endIso: w.end.toISOString() }));
    if (closed) {
      const avail = await resolveDeliveryAvailability(db, { tenantId: input.tenantId, locationId: loc, settings, channel, now });
      return failResult({
        ok: false, reason: "closed_day", date: targetDate, requestedSpoken: hhmm,
        openWindowSpoken: "", earliestSpoken: null,
        nextDate: avail.nextDate, nextEarliestSpoken: hhmmInRome(avail.nextEarliestIso), canSchedule: true,
      });
    }
    if (!hhmm) {
      return { ok: true, mode: "scheduled_future", scheduled: true, date: targetDate, whenSpoken: winIso.length ? hhmmInRome(winIso[0]!.startIso) : null };
    }
    const reqMs = requestedInstantMs(targetDate, hhmm);
    const within = winIso.some((w) => reqMs >= Date.parse(w.startIso) && reqMs <= Date.parse(w.endIso));
    if (within) return { ok: true, mode: "scheduled_future", scheduled: true, date: targetDate, whenSpoken: hhmm };
    return failResult({
      ok: false, reason: "outside_window", date: targetDate, requestedSpoken: hhmm,
      openWindowSpoken: spokenWindowsIso(winIso), earliestSpoken: null,
      nextDate: null, nextEarliestSpoken: null, canSchedule: true,
    });
  }

  // ── Oggi ─────────────────────────────────────────────────────────────────
  const avail = await resolveDeliveryAvailability(db, { tenantId: input.tenantId, locationId: loc, settings, channel, now });

  if (!hhmm) {
    if (avail.todayPossible) {
      return { ok: true, mode: "asap_today", scheduled: false, date: today, whenSpoken: hhmmInRome(avail.earliestIso) };
    }
    return failResult({
      ok: false, reason: avail.closedToday ? "closed_today" : "outside_window", date: today, requestedSpoken: null,
      openWindowSpoken: spokenWindowsIso(avail.todayWindows), earliestSpoken: null,
      nextDate: avail.nextDate, nextEarliestSpoken: hhmmInRome(avail.nextEarliestIso), canSchedule: Boolean(avail.nextDate),
    });
  }

  const reqMs = requestedInstantMs(today, hhmm);
  const within = avail.todayWindows.some((w) => reqMs >= Date.parse(w.startIso) && reqMs <= Date.parse(w.endIso));
  if (!within) {
    return failResult({
      ok: false, reason: avail.closedToday ? "closed_today" : "outside_window", date: today, requestedSpoken: hhmm,
      openWindowSpoken: spokenWindowsIso(avail.todayWindows), earliestSpoken: hhmmInRome(avail.earliestIso),
      nextDate: avail.nextDate, nextEarliestSpoken: hhmmInRome(avail.nextEarliestIso), canSchedule: Boolean(avail.nextDate),
    });
  }
  if (avail.earliestIso && reqMs < Date.parse(avail.earliestIso)) {
    return failResult({
      ok: false, reason: "too_early", date: today, requestedSpoken: hhmm,
      openWindowSpoken: spokenWindowsIso(avail.todayWindows), earliestSpoken: hhmmInRome(avail.earliestIso),
      nextDate: null, nextEarliestSpoken: null, canSchedule: false,
    });
  }
  return { ok: true, mode: "time_today", scheduled: false, date: today, whenSpoken: hhmm };
}

export type RetellAvailabilityInput = {
  tenantId: string;
  locationId?: string | null;
  date: string;
  covers?: number;
  serviceCode?: string | null;
};

type LocationRow = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  is_default: boolean;
  hours?: unknown;
};

type CategoryRow = Database["public"]["Tables"]["menu_categories"]["Row"];
type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];
type ExtraListRow = Database["public"]["Tables"]["extra_lists"]["Row"];
type ExtraListItemRow = Database["public"]["Tables"]["extra_list_items"]["Row"];
type ItemExtraRow = ExtraListItemRow & { item_id: string };

const MENU_TIMEZONE = "Europe/Rome";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function svc(): Db {
  const client = createSupabaseServiceClient();
  if (!client) throw new Error("supabase_service_unconfigured");
  return client;
}

// Cache in-memory del contesto inbound: ricostruirlo costa ~10 query Supabase, ma il
// menu non cambia durante una telefonata. Con Fluid Compute l'istanza è riusata tra le
// invocazioni della stessa chiamata, quindi il warm-up sul primo nodo (customer_lookup)
// rende le successive search_menu praticamente istantanee. TTL breve = tolleranza alle
// variazioni di menu/orari, e create_order rivalida comunque tutto alla conferma.
type RetellContextOptions = Parameters<typeof buildRetellInboundContext>[1];
type CachedContext = { context: RetellInboundContext; expiresAt: number };
const CONTEXT_CACHE = new Map<string, CachedContext>();
const CONTEXT_TTL_MS = 240_000;

function contextCacheKey(tenantId: string, options: RetellContextOptions = {}): string {
  return [
    tenantId,
    options.channel ?? "retell",
    options.locationId ?? "",
    options.includeUnavailable ? "1" : "0",
    options.sharedWhatsappSender ? "1" : "0",
  ].join("|");
}

export async function getRetellInboundContextCached(
  tenantId: string,
  options: RetellContextOptions = {},
): Promise<RetellInboundContext> {
  const key = contextCacheKey(tenantId, options);
  const hit = CONTEXT_CACHE.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.context;
  const context = await buildRetellInboundContext(tenantId, options);
  CONTEXT_CACHE.set(key, { context, expiresAt: Date.now() + CONTEXT_TTL_MS });
  return context;
}

// Fire-and-forget: popola la cache senza far attendere il chiamante e ingoia gli errori
// (un warm-up fallito non deve mai far cadere l'azione che l'ha innescato).
export function warmRetellInboundContext(tenantId: string, options: RetellContextOptions = {}): void {
  if (!tenantId) return;
  void getRetellInboundContextCached(tenantId, options).catch(() => undefined);
}

function isDayScheduleArray(value: unknown): value is DaySchedule[] {
  return Array.isArray(value) && value.every((day) => {
    if (!day || typeof day !== "object") return false;
    const row = day as Record<string, unknown>;
    return typeof row.label === "string" && typeof row.closed === "boolean" && Array.isArray(row.slots);
  });
}

function formatPrice(price: Json): string {
  if (typeof price === "number") return formatEuro(price);
  if (typeof price === "string") return price;
  if (!price || Array.isArray(price) || typeof price !== "object") return "Prezzo da confermare";

  const p = price as Record<string, Json | undefined>;
  if (p.kind === "single" && typeof p.value === "number") return formatEuro(p.value);
  if (p.kind === "sized" && typeof p.small === "number" && typeof p.big === "number") {
    return `Small ${formatEuro(p.small)}, Big ${formatEuro(p.big)}`;
  }
  if (p.kind === "persone" && typeof p.per2 === "number" && typeof p.per4 === "number") {
    return `2 persone ${formatEuro(p.per2)}, 4 persone ${formatEuro(p.per4)}`;
  }
  if (p.kind === "volume" && p.small && p.large) {
    if (Array.isArray(p.variants)) {
      const variants = p.variants
        .map((variant) => {
          if (!variant || typeof variant !== "object" || Array.isArray(variant)) return null;
          const v = variant as Record<string, Json | undefined>;
          return typeof v.label === "string" && typeof v.price === "number"
            ? `${v.label} ${formatEuro(v.price)}`
            : null;
        })
        .filter(Boolean);
      if (variants.length > 0) return variants.join(", ");
    }
    const small = p.small as Record<string, Json | undefined>;
    const large = p.large as Record<string, Json | undefined>;
    if (typeof small.label === "string" && typeof small.price === "number" && typeof large.label === "string" && typeof large.price === "number") {
      return `${small.label} ${formatEuro(small.price)}, ${large.label} ${formatEuro(large.price)}`;
    }
  }
  return "Prezzo da confermare";
}

function listPriceOptions(price: Json): { code: string; label: string; value: number; isDefault: boolean }[] {
  if (typeof price === "number") return [{ code: "standard", label: "Standard", value: price, isDefault: true }];
  if (!price || Array.isArray(price) || typeof price !== "object") return [];
  const p = price as Record<string, Json | undefined>;
  const defaultKey = typeof p.defaultKey === "string" ? p.defaultKey : null;
  if (p.kind === "single" && typeof p.value === "number") {
    return [{ code: "standard", label: "Standard", value: p.value, isDefault: true }];
  }
  if (p.kind === "sized" && typeof p.small === "number" && typeof p.big === "number") {
    const opts = [
      { code: "small", label: "Small", value: p.small },
      { code: "big", label: "Big", value: p.big },
    ];
    return opts.map((o, i) => ({ ...o, isDefault: defaultKey ? o.code === defaultKey : i === 0 }));
  }
  if (p.kind === "persone" && typeof p.per2 === "number" && typeof p.per4 === "number") {
    const opts = [
      { code: "per2", label: "2 persone", value: p.per2 },
      { code: "per4", label: "4 persone", value: p.per4 },
    ];
    return opts.map((o, i) => ({ ...o, isDefault: defaultKey ? o.code === defaultKey : i === 0 }));
  }
  if (p.kind === "volume" && p.small && p.large) {
    if (Array.isArray(p.variants)) {
      const opts = p.variants.flatMap((variant, index) => {
        if (!variant || typeof variant !== "object" || Array.isArray(variant)) return [];
        const v = variant as Record<string, Json | undefined>;
        return typeof v.label === "string" && typeof v.price === "number"
          ? [{ code: typeof v.id === "string" ? v.id : `volume-${index}`, label: v.label, value: v.price }]
          : [];
      });
      return opts.map((o, i) => ({ ...o, isDefault: defaultKey ? o.code === defaultKey : i === 0 }));
    }
    const small = p.small as Record<string, Json | undefined>;
    const large = p.large as Record<string, Json | undefined>;
    if (typeof small.label === "string" && typeof small.price === "number" && typeof large.label === "string" && typeof large.price === "number") {
      const opts = [
        { code: "small", label: small.label, value: small.price },
        { code: "large", label: large.label, value: large.price },
      ];
      return opts.map((o, i) => ({ ...o, isDefault: defaultKey ? o.code === defaultKey : i === 0 }));
    }
  }
  return [];
}

function resolveNumericPrice(itemCode: string, price: Json, selectedOption?: string | null): number {
  const options = listPriceOptions(price);
  if (options.length === 0) throw new Error(`price_to_confirm:${itemCode}`);
  if (options.length === 1) return options[0].value;

  if (selectedOption) {
    const selected = selectedOption.trim().toLocaleLowerCase("it-IT");
    const option = options.find((candidate) => candidate.code.toLocaleLowerCase("it-IT") === selected);
    if (option) return option.value;
  }

  // Nessuna selezione esplicita: usa la variante di default configurata nel menu,
  // oppure la prima disponibile come fallback.
  return (options.find((o) => o.isDefault) ?? options[0]).value;
}

function money(value: number): string {
  return value === 0 ? "incluso" : formatEuro(value);
}

function buildItemModifications(
  item: MenuItemRow,
  inlineExtras: Map<string, ItemExtraRow[]>,
  extraListsById: Map<string, ExtraListRow>,
  listItemsByListId: Map<string, ExtraListItemRow[]>,
) {
  const inline = (inlineExtras.get(item.id) ?? []).map((extra) => ({
    id: extra.code,
    name: extra.name,
    price: money(Number(extra.price)),
    source: "inline" as const,
  }));
  const list = item.extra_list_id
    ? (listItemsByListId.get(item.extra_list_id) ?? []).map((extra) => ({
        id: `${extraListsById.get(item.extra_list_id!)?.code ?? "lista"}:${extra.code}`,
        name: extra.name,
        price: money(Number(extra.price)),
        source: "list" as const,
      }))
    : [];
  return [...inline, ...list];
}

const BASE_VARIANT_NAMES = ["normale", "classica", "classico", "semplice", "standard", "base", "regular", "plain"];

function inferBaseVariantIndex(names: string[]): number {
  const idx = names.findIndex((n) =>
    BASE_VARIANT_NAMES.includes(n.trim().toLocaleLowerCase("it-IT")),
  );
  return idx >= 0 ? idx : 0;
}

function listVariantGroups(value: Json) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((group) => {
    if (!group || typeof group !== "object" || Array.isArray(group)) return [];
    const g = group as Record<string, Json | undefined>;
    if (typeof g.id !== "string" || typeof g.name !== "string" || !Array.isArray(g.options)) return [];
    const defaultOptionId = typeof g.defaultOptionId === "string" ? g.defaultOptionId : null;
    const options = g.options.flatMap((option) => {
      if (!option || typeof option !== "object" || Array.isArray(option)) return [];
      const o = option as Record<string, Json | undefined>;
      if (typeof o.id !== "string" || typeof o.name !== "string") return [];
      const price = typeof o.price === "number" ? o.price : 0;
      return [{
        id: o.id,
        name: o.name,
        price: money(price),
        isDefault: defaultOptionId ? o.id === defaultOptionId : false,
      }];
    });
    if (options.length === 0) return [];
    let resolvedOptions = options;
    if (!defaultOptionId) {
      const baseIndex = inferBaseVariantIndex(options.map((o) => o.name));
      resolvedOptions = options.map((option, index) => ({ ...option, isDefault: index === baseIndex }));
    }
    return [{
      id: g.id,
      name: g.name,
      required: g.required === true,
      defaultOptionId,
      options: resolvedOptions,
    }];
  });
}

function resolveAddedExtras(
  item: Pick<MenuItemRow, "id" | "extra_list_id">,
  codes: string[],
  inlineExtras: Map<string, ItemExtraRow[]>,
  listItemsByListId: Map<string, ExtraListItemRow[]>,
) {
  const inlineByCode = new Map((inlineExtras.get(item.id) ?? []).map((extra) => [extra.code, extra]));
  const listByCode = new Map((item.extra_list_id ? listItemsByListId.get(item.extra_list_id) ?? [] : []).map((extra) => [extra.code, extra]));
  return codes.map((rawCode) => {
    const code = rawCode.includes(":") ? rawCode.split(":").pop()! : rawCode;
    const extra = inlineByCode.get(code) ?? listByCode.get(code);
    if (!extra) throw new Error(`missing_extra:${rawCode}`);
    return { id: rawCode, name: extra.name, price: Number(extra.price) };
  });
}

function groupBy<T, K>(items: T[], key: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = map.get(k);
    if (bucket) bucket.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function localMenuTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MENU_TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  const weekday = byType.get("weekday") ?? "";
  const dayByLabel: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    day: dayByLabel[weekday] ?? now.getDay(),
    minutes: Number(byType.get("hour") ?? "0") * 60 + Number(byType.get("minute") ?? "0"),
  };
}

function timeToMinutes(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isTimeInWindow(current: number, start: unknown, end: unknown): boolean {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (startMinutes == null && endMinutes == null) return true;
  if (startMinutes != null && endMinutes == null) return current >= startMinutes;
  if (startMinutes == null && endMinutes != null) return current <= endMinutes;
  if (startMinutes == null || endMinutes == null) return true;
  return startMinutes <= endMinutes
    ? current >= startMinutes && current <= endMinutes
    : current >= startMinutes || current <= endMinutes;
}

function normalizeVisibility(value: unknown): MenuListVisibility {
  const raw = asObject(value);
  return {
    days: Array.isArray(raw.days) ? raw.days.filter((day): day is number => typeof day === "number") : undefined,
    startTime: typeof raw.startTime === "string" ? raw.startTime : undefined,
    endTime: typeof raw.endTime === "string" ? raw.endTime : undefined,
    tableIds: Array.isArray(raw.tableIds) ? raw.tableIds.filter((id): id is string => typeof id === "string") : undefined,
    channels: Array.isArray(raw.channels)
      ? raw.channels.filter(isMenuOrderChannel)
      : undefined,
  };
}

function isMenuListVisible(list: MenuListRow, channel: MenuOrderChannel, now = new Date()): boolean {
  if (!list.enabled) return false;
  const local = localMenuTime(now);
  const visibility = normalizeVisibility(list.visibility);
  if (visibility.channels && !visibility.channels.includes(channel)) return false;
  if (visibility.days?.length && !visibility.days.includes(local.day)) return false;
  if (!isTimeInWindow(local.minutes, visibility.startTime, visibility.endTime)) return false;
  // Conversational channels handle off-premise orders: table-only lists are not relevant.
  return channel === "table" || !visibility.tableIds?.length;
}

function hasMenuListRestriction(list: MenuListRow): boolean {
  const visibility = normalizeVisibility(list.visibility);
  return Boolean(visibility.days?.length || visibility.startTime || visibility.endTime || visibility.tableIds?.length || visibility.channels);
}

function normalizeCategoryAvailability(value: unknown): MenuCategoryAvailability | null {
  const raw = asObject(value);
  if (typeof raw.label !== "string" || typeof raw.from !== "string" || typeof raw.to !== "string") return null;
  return {
    label: raw.label,
    from: raw.from,
    to: raw.to,
    days: Array.isArray(raw.days) ? raw.days.filter((day): day is number => typeof day === "number") : undefined,
  };
}

function isCategoryVisible(category: Pick<CategoryRow, "availability">, now = new Date()): boolean {
  const availability = normalizeCategoryAvailability(category.availability);
  if (!availability) return true;
  const local = localMenuTime(now);
  if (availability.days?.length && !availability.days.includes(local.day)) return false;
  return isTimeInWindow(local.minutes, availability.from, availability.to);
}

async function loadActiveMenuLists(db: Db, tenantId: string, channel: MenuOrderChannel, now = new Date()) {
  const listsResult = await (db as unknown as {
    from: (table: "menu_lists") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => Promise<{ data: MenuListRow[] | null; error: { message: string } | null }>;
      };
    };
  }).from("menu_lists").select("id,code,name,description,enabled,visibility").eq("tenant_id", tenantId);
  if (listsResult.error) throw new Error(listsResult.error.message);

  const lists = listsResult.data ?? [];
  const activeLists = lists.filter((list) => isMenuListVisible(list, channel, now));
  const activeRestrictedLists = activeLists.filter(hasMenuListRestriction);
  const listsForItems = activeRestrictedLists.length > 0 ? activeRestrictedLists : activeLists.filter((list) => !hasMenuListRestriction(list));
  const listIds = listsForItems.map((list) => list.id);
  if (listIds.length === 0) {
    return {
      activeLists: listsForItems,
      allowedItemIds: lists.length > 0 ? new Set<string>() : null as Set<string> | null,
    };
  }

  const itemsResult = await (db as unknown as {
    from: (table: "menu_list_items") => {
      select: (columns: string) => {
        in: (column: string, values: string[]) => Promise<{ data: MenuListItemRow[] | null; error: { message: string } | null }>;
      };
    };
  }).from("menu_list_items").select("list_id,item_id").in("list_id", listIds);
  if (itemsResult.error) throw new Error(itemsResult.error.message);
  return {
    activeLists: listsForItems,
    allowedItemIds: new Set((itemsResult.data ?? []).map((item) => item.item_id)),
  };
}

function requireRetellFeature(features: Json, key: "aiPhone" | "aiWhatsapp", registryEnabled: boolean): boolean {
  if (features && typeof features === "object" && !Array.isArray(features)) {
    const value = (features as Record<string, Json | undefined>)[key];
    if (typeof value === "boolean") return value;
  }
  return registryEnabled;
}

function checkSecret(request: Request, rawBody = ""): boolean {
  const configuredSecret = process.env.RETELL_WEBHOOK_SECRET;
  if (configuredSecret && request.headers.get("x-retell-secret") === configuredSecret) return true;

  const apiKey = process.env.RETELL_API_KEY;
  const signature = request.headers.get("x-retell-signature");
  const signatureMatch = signature?.match(/^v=(\d+),d=([a-fA-F0-9]+)$/);
  if (apiKey && signatureMatch) {
    const [, timestamp, digest] = signatureMatch;
    if (Math.abs(Date.now() - Number(timestamp)) <= 5 * 60 * 1000) {
      const expected = createHmac("sha256", apiKey).update(`${rawBody}${timestamp}`).digest();
      const actual = Buffer.from(digest, "hex");
      if (actual.length === expected.length && timingSafeEqual(actual, expected)) return true;
    }
  }

  return process.env.NODE_ENV !== "production";
}

export function isAuthorizedRetellRequest(request: Request, rawBody = ""): boolean {
  return checkSecret(request, rawBody);
}

function conversationalMenuChannel(channel: "retell" | "whatsapp" | undefined): MenuOrderChannel {
  return channel === "whatsapp" ? "whatsapp" : "phone";
}

export async function buildRetellInboundContext(
  tenantId: string,
  options: {
    locationId?: string | null;
    includeUnavailable?: boolean;
    channel?: "retell" | "whatsapp";
    sharedWhatsappSender?: boolean;
  } = {},
): Promise<RetellInboundContext> {
  const db = svc();
  const registryTenant = findTenantById(tenantId);
  if (!registryTenant) throw new Error("tenant_not_found");

  const [{ data: tenantRow }, { data: locationRows }, { data: specialRows }] = await Promise.all([
    db.from("tenants").select("id,name,vertical,enabled,features,hours").eq("id", tenantId).maybeSingle(),
    (db as unknown as {
      from: (table: "locations") => {
        select: (columns: string) => {
          eq: (column: string, value: string) => {
            order: (column: string, opts?: { ascending?: boolean }) => {
              order: (column: string, opts?: { ascending?: boolean }) => Promise<{ data: LocationRow[] | null }>;
            };
          };
        };
      };
    })
      .from("locations")
      .select("id,slug,name,address,city,phone,email,is_default,hours")
      .eq("tenant_id", tenantId)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true }),
    db
      .from("tenant_special_hours")
      .select("id,date,closed,slots,label,location_id")
      .eq("tenant_id", tenantId)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true }),
  ]);

  const enabled = options.channel === "whatsapp" && options.sharedWhatsappSender === true
    ? registryTenant.enabled
    : Boolean(tenantRow?.enabled ?? registryTenant.enabled);
  const aiPhoneEnabled = requireRetellFeature(tenantRow?.features ?? {}, "aiPhone", registryTenant.features.aiPhone);
  const aiWhatsappEnabled = requireRetellFeature(tenantRow?.features ?? {}, "aiWhatsapp", registryTenant.features.aiWhatsapp);
  const channelEnabled = options.channel === "whatsapp"
    ? aiWhatsappEnabled || options.sharedWhatsappSender === true
    : aiPhoneEnabled;
  const aiSettings = await getAiPhoneSettings(tenantId);
  const assistantEnabled = aiSettings.enabled || (options.channel === "whatsapp" && options.sharedWhatsappSender === true);
  const acceptingOrders = isAiPhoneControlAccepting(aiSettings.quickSettings.acceptNewOrders);
  const acceptingReservations = isAiPhoneControlAccepting(aiSettings.quickSettings.acceptReservations);
  const fallbackHours = isDayScheduleArray(tenantRow?.hours)
    ? tenantRow.hours
    : defaultHoursWeekForTenant(tenantId);
  const selectedLocations = (locationRows ?? []).filter((location) => {
    if (!options.locationId) return true;
    return location.id === options.locationId;
  });
  const locations = (selectedLocations.length ? selectedLocations : locationRows ?? []).map<LocationContext>((location) => {
    const weeklyHours = isDayScheduleArray(location.hours) && location.hours.length > 0
      ? location.hours
      : fallbackHours;
    return {
      id: location.id,
      slug: location.slug,
      name: location.name,
      address: location.address,
      city: location.city ?? null,
      phone: location.phone ?? null,
      email: location.email ?? null,
      isDefault: location.is_default,
      weeklyHours,
      specialHours: aiSettings.includeSpecialHours
        ? (specialRows ?? [])
            .filter((row) => !row.location_id || row.location_id === location.id)
            .map((row) => ({
              date: row.date,
              closed: row.closed,
              slots: (row.slots as string[]) ?? [],
              label: row.label,
            }))
        : [],
    };
  });

  const catsQ = db
    .from("menu_categories")
    .select("id,code,title,description,position,location_id,availability")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  const itemsQ = db
    .from("menu_items")
    .select("id,code,category_id,name,description,price,tags,allergens,available,bookable,duration_minutes,variant_groups,extra_list_id,location_id,position")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });
  if (!options.includeUnavailable) itemsQ.eq("available", true);
  if (options.locationId) {
    catsQ.or(`location_id.is.null,location_id.eq.${options.locationId}`);
    itemsQ.or(`location_id.is.null,location_id.eq.${options.locationId}`);
  }

  const [{ data: categories }, { data: items }, { data: itemExtras }, { data: extraLists }, { data: extraListItems }, menuLists] =
    await Promise.all([
      catsQ,
      itemsQ,
      db.from("menu_item_extras").select("item_id,code,name,price,position").order("position", { ascending: true }),
      db.from("extra_lists").select("id,code,name,tenant_id,created_at,updated_at").eq("tenant_id", tenantId),
      db.from("extra_list_items").select("id,list_id,code,name,price,position").order("position", { ascending: true }),
      loadActiveMenuLists(db, tenantId, conversationalMenuChannel(options.channel)),
    ]);

  const visibleItems = ((items ?? []) as MenuItemRow[]).filter((item) =>
    !menuLists.allowedItemIds || menuLists.allowedItemIds.has(item.id),
  );
  const itemsByCategory = groupBy(visibleItems, (item) => item.category_id);
  const inlineExtrasByItem = groupBy((itemExtras ?? []) as unknown as ItemExtraRow[], (extra) => extra.item_id);
  const extraListsById = new Map(((extraLists ?? []) as ExtraListRow[]).map((list) => [list.id, list]));
  const listItemsByListId = groupBy((extraListItems ?? []) as ExtraListItemRow[], (item) => item.list_id);

  return {
    tenant: {
      id: tenantId,
      name: tenantRow?.name ?? registryTenant.name,
      vertical: tenantRow?.vertical ?? registryTenant.vertical,
      enabled,
      aiPhoneEnabled,
      aiWhatsappEnabled,
      channelEnabled,
    },
    locale: "it-IT",
    generatedAt: new Date().toISOString(),
    capabilities: {
      canAnswerQuestions: enabled && channelEnabled && assistantEnabled,
      canCreateTakeawayOrders: enabled && channelEnabled && assistantEnabled && acceptingOrders && registryTenant.features.takeaway,
      canCreateDeliveryOrders: enabled && channelEnabled && assistantEnabled && acceptingOrders && registryTenant.features.deliveryHub,
      canCreateReservations: enabled && channelEnabled && assistantEnabled && acceptingReservations && registryTenant.features.reservations,
      canCreateAppointments: enabled && channelEnabled && assistantEnabled && acceptingReservations && registryTenant.vertical === "services" && registryTenant.features.reservations,
      canRequestPaymentLinks: enabled && channelEnabled && assistantEnabled && aiSettings.paymentControls.enabled,
    },
    assistantSettings: {
      phoneNumber: aiSettings.phoneNumber,
      greetingMessage: aiSettings.greetingMessage,
      systemPrompt: aiSettings.systemPrompt,
      handoffPhone: aiSettings.handoffPhone,
      language: aiSettings.language,
      humanTransferEnabled: aiSettings.humanTransferEnabled,
      confirmBeforeWrite: aiSettings.confirmBeforeWrite,
      afterHoursMode: aiSettings.afterHoursMode,
      quickSettings: aiSettings.quickSettings,
      paymentControls: aiSettings.paymentControls,
    },
    locations,
    menu: {
      timezone: MENU_TIMEZONE,
      activeLists: menuLists.activeLists.map((list) => ({
        code: list.code,
        name: list.name,
        description: list.description,
      })),
      categories: aiSettings.menuSyncEnabled
        ? ((categories ?? []) as CategoryRow[]).filter((category) => isCategoryVisible(category)).map((category) => ({
            id: category.id,
            code: category.code,
            title: category.title,
            description: category.description,
            items: (itemsByCategory.get(category.id) ?? []).map((item) => ({
              id: item.id,
              code: item.code,
              name: item.name,
              description: item.description,
              available: item.available,
              bookable: item.bookable,
              durationMinutes: item.duration_minutes,
              price: formatPrice(item.price),
              priceOptions: listPriceOptions(item.price).map((option) => ({
                code: option.code,
                label: option.label,
                price: formatEuro(option.value),
                isDefault: option.isDefault,
              })),
              variantGroups: listVariantGroups(item.variant_groups),
              tags: item.tags ?? [],
              allergens: item.allergens ?? [],
              modifications: buildItemModifications(item, inlineExtrasByItem, extraListsById, listItemsByListId),
            })),
          })).filter((category) => category.items.length > 0)
        : [],
    },
    retellInstructions: [
      // --- Flusso semplice v14: saluto → ordine → indirizzo → riepilogo → chiusura ---
      "Flusso della conversazione: 1) Saluta il cliente. 2) Chiedi cosa desidera ordinare. 3) Verifica ogni piatto contro il menu in questo contesto: se non esiste, dillo e proponi alternative dalla stessa categoria. 4) Quando il cliente ha finito di ordinare, chiedi l'indirizzo di consegna (via, civico, citofono, piano). 5) Ricapitola: elenco piatti, indirizzo e totale. 6) Conferma e chiudi dicendo che ricevera un messaggio su WhatsApp con il riepilogo.",
      "Usa solo le informazioni presenti in questo contesto per menu, prezzi e orari. Non inventare piatti o prezzi.",
      "Se un piatto ha piu varianti e il cliente non specifica quale, usa la variante di default del menu. Se non c'e un default, scegli quella con nome 'Normale', 'Classica', 'Semplice' o simile. Chiedi solo se e davvero ambiguo.",
      "Non leggere ingredienti, allergeni o descrizione dei piatti a meno che il cliente non li chieda esplicitamente.",
      "Non comunicare i prezzi dei singoli piatti durante la raccolta. Il prezzo viene detto solo alla fine come totale.",
      "Se il cliente fornisce piu dati nella stessa frase (piatti, indirizzo, ecc.), estraili tutti e chiedi solo quelli mancanti.",
      "Non chiedere il metodo di pagamento. Dopo la conferma di che arrivera un messaggio su WhatsApp.",
      "Usa caller_phone come numero del cliente. Non chiederlo e non ripeterlo nel riepilogo.",
      aiSettings.quickSettings.notesForAssistant,
    ].filter(Boolean),
  };
}

function dayIndex(date: string): number {
  const parsed = new Date(`${date}T12:00:00`);
  return (parsed.getDay() + 6) % 7;
}

function buildSlotsFromDay(day: DaySchedule | undefined, step = 30): string[] {
  if (!day || day.closed) return [];
  const out: string[] = [];
  for (const slot of day.slots) {
    const parts = slot.match(/(\d{1,2}):(\d{2}).*?(\d{1,2}):(\d{2})/);
    if (!parts) continue;
    const start = Number(parts[1]) * 60 + Number(parts[2]);
    const end = Number(parts[3]) * 60 + Number(parts[4]);
    const normalizedEnd = end <= start ? end + 24 * 60 : end;
    for (let t = start; t < normalizedEnd; t += step) {
      const hh = Math.floor((t % (24 * 60)) / 60).toString().padStart(2, "0");
      const mm = (t % 60).toString().padStart(2, "0");
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
}

export async function getRetellAvailability(input: RetellAvailabilityInput) {
  const db = svc();
  const context = await buildRetellInboundContext(input.tenantId, { locationId: input.locationId });
  const location = context.locations[0];
  const special = location?.specialHours.find((entry) => entry.date === input.date);
  const day = special
    ? { label: special.label ?? input.date, closed: special.closed, slots: special.slots }
    : location?.weeklyHours[dayIndex(input.date)];
  const slots = buildSlotsFromDay(day);

  const service = input.serviceCode
    ? await db
        .from("menu_items")
        .select("id,duration_minutes")
        .eq("tenant_id", input.tenantId)
        .eq("code", input.serviceCode)
        .maybeSingle()
    : { data: null };

  const [{ data: tablesRaw }, { data: existingRows }] = await Promise.all([
    db
      .from("tables")
      .select("id,label,seats,area")
      .eq("tenant_id", input.tenantId),
    db
      .from("reservation_requests")
      .select("table_id,covers,reservation_date,reservation_time,status")
      .eq("tenant_id", input.tenantId)
      .eq("reservation_date", input.date),
  ]);

  const tables: TableForPlanner[] = (tablesRaw ?? []).map((table) => ({
    id: table.id,
    label: table.label,
    seats: table.seats,
    area: table.area ?? "Sala",
  }));
  const existing: ReservationSlot[] = (existingRows ?? []).map((row) => ({
    tableId: row.table_id,
    covers: row.covers,
    reservationDate: row.reservation_date,
    reservationTime: row.reservation_time,
    status: row.status,
  }));
  const covers = Math.max(1, input.covers ?? 1);

  return {
    date: input.date,
    locationId: location?.id ?? null,
    durationMinutes: service.data?.duration_minutes ?? null,
    slots: slots.map((time) => {
      const occupiedAtTime = existing.filter((row) => row.reservationTime === time);
      const { tableId, assignedArea } = suggestTableForReservation(tables, occupiedAtTime, covers);
      return {
        time,
        available: tables.length === 0 ? true : Boolean(tableId),
        tableId,
        assignedArea,
      };
    }),
  };
}

export async function createRetellReservation(input: CreateRetellReservationInput) {
  const db = svc();
  if (!findTenantById(input.tenantId)) throw new Error("tenant_not_found");
  const locationId = input.locationId && UUID_RE.test(input.locationId) ? input.locationId : null;
  const settings = await getAiPhoneSettings(input.tenantId);
  if (!settings.enabled || !isAiPhoneControlAccepting(settings.quickSettings.acceptReservations)) {
    throw new Error("reservations_not_accepting");
  }
  const service = input.serviceCode
    ? await db
        .from("menu_items")
        .select("id,duration_minutes")
        .eq("tenant_id", input.tenantId)
        .eq("code", input.serviceCode)
        .maybeSingle()
    : { data: null };
  const identity = await resolveCustomerIdentity({
    tenantId: input.tenantId,
    phone: input.customerPhone,
    displayName: input.customerName,
    source: input.source ?? "retell",
  });

  const { data, error } = await db
    .from("reservation_requests")
    .insert({
      tenant_id: input.tenantId,
      location_id: locationId,
      customer_id: identity?.customerId ?? null,
      customer_name: input.customerName,
      customer_phone: identity?.phone ?? input.customerPhone,
      covers: Math.max(1, input.covers ?? 1),
      reservation_date: input.date,
      reservation_time: input.time,
      notes: input.notes ?? null,
      channel: input.source === "whatsapp" ? "whatsapp" : "retell",
      status: "pending_manual",
      service_id: service.data?.id ?? null,
      duration_minutes: service.data?.duration_minutes ?? null,
      menuary_user_id: identity?.menuaryUserId ?? null,
    } as never)
    .select("id,status")
    .single();

  if (error) throw new Error(error.message);
  if (identity) {
    await recordCustomerEvent({
      tenantId: input.tenantId,
      customerId: identity.customerId,
      eventKind: "reservation_created",
      refId: data.id,
      meta: {
        source: input.source ?? "retell",
        registered: identity.registered,
        date: input.date,
        time: input.time,
        covers: input.covers ?? 1,
      },
    });
  }
  return data;
}

// Normalizza un codice/nome per il matching tollerante: minuscole, prefisso tenant
// rimosso, accenti tolti, solo lettere/numeri/spazi singoli. "Pizza Margherita!" e
// "kimos-MARGHERITA" collassano entrambi su "pizza margherita" / "margherita".
function normalizeForMatch(value: string, tenantPrefix: string): string {
  let s = value.trim().toLocaleLowerCase("it-IT");
  if (s.startsWith(tenantPrefix)) s = s.slice(tenantPrefix.length);
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function matchTokens(value: string): string[] {
  return value ? value.split(" ").filter(Boolean) : [];
}

// Riconciliazione: l'assistente AI a volte allucina l'itemCode (es. "MARGHERITA",
// o il nome del piatto al posto del code). Invece di fallire, cerchiamo il match
// migliore sull'intero menu per codice/nome normalizzato. Restituisce null solo se
// nessun candidato è abbastanza simile (così l'errore missing_items resta possibile).
function reconcileMenuItem<T extends { code: string; name: string }>(
  requested: string,
  pool: T[],
  tenantPrefix: string,
): T | null {
  const req = normalizeForMatch(requested, tenantPrefix);
  if (!req) return null;
  const reqSpaceless = req.replace(/\s/g, "");
  const reqTokens = matchTokens(req);

  let best: { item: T; score: number } | null = null;
  for (const item of pool) {
    const code = normalizeForMatch(item.code, tenantPrefix);
    const name = normalizeForMatch(item.name, tenantPrefix);
    let score = 0;
    if (code === req || name === req) {
      score = 100;
    } else if (code.replace(/\s/g, "") === reqSpaceless || name.replace(/\s/g, "") === reqSpaceless) {
      score = 90;
    } else {
      const nameTokens = matchTokens(name);
      const allReqInName = reqTokens.length > 0 && reqTokens.every((t) => nameTokens.includes(t));
      const allNameInReq = nameTokens.length > 0 && nameTokens.every((t) => reqTokens.includes(t));
      if (allReqInName || allNameInReq) {
        score = 70 + Math.min(reqTokens.length, nameTokens.length);
      } else if (req.length >= 4 && (name.includes(req) || code.includes(req))) {
        score = 50;
      }
    }
    if (score > 0 && (!best || score > best.score)) best = { item, score };
  }
  return best && best.score >= 50 ? best.item : null;
}

export async function createRetellOrder(input: CreateRetellOrderInput) {
  const db = svc();
  // L'assistente AI a volte inventa il tenantId (es. il placeholder "kimos_tenant_id")
  // invece di usare {{tenant_id}}: senza questo guard finiva in un 500 da FK su customers.
  if (!findTenantById(input.tenantId)) throw new Error("tenant_not_found");
  // Idem per il locationId (es. "kimos_main"): le sedi reali sono UUID, altrimenti
  // la usiamo come sede di default (null) per non rompere le foreign key.
  const locationId = input.locationId && UUID_RE.test(input.locationId) ? input.locationId : null;
  const settings = await getAiPhoneSettings(input.tenantId);
  if (!settings.enabled || !isAiPhoneControlAccepting(settings.quickSettings.acceptNewOrders)) {
    throw new Error("orders_not_accepting");
  }
  const fulfillmentType = input.fulfillmentType ?? "takeaway";
  if (fulfillmentType === "delivery" && !input.delivery?.address?.trim()) {
    throw new Error("delivery_address_required");
  }
  // Enforcement orari: un orario richiesto fuori dall'apertura non deve mai diventare un
  // ordine. Il nodo validate_order_time del flow lo intercetta già conversazionalmente;
  // questa è la rete di sicurezza server-side. La finestra valida viaggia nel messaggio
  // d'errore (422) così l'agente può ri-proporla.
  const timeCheck = await validateRetellOrderTime({
    tenantId: input.tenantId,
    locationId,
    fulfillmentType,
    desiredTime: input.desiredTime,
    desiredDate: input.desiredDate,
    pickupTime: input.pickupTime,
    pickupDate: input.pickupDate,
  });
  if (!timeCheck.ok) {
    const detail =
      timeCheck.reason === "closed_day" || timeCheck.reason === "closed_today"
        ? "closed"
        : timeCheck.reason === "too_early"
          ? `earliest ${timeCheck.earliestSpoken ?? ""}`.trim()
          : timeCheck.openWindowSpoken || "closed";
    throw new Error(`order_time_outside_hours:${detail}`);
  }
  // Ordine programmato per un giorno futuro: niente scadenza 120s, resta "ricevuto"
  // (pending_confirmation senza expiry) finché il ristorante non lo accetta.
  const scheduledFuture = timeCheck.scheduled;
  // Risoluzione metodo di pagamento effettivo, tenendo conto di:
  //   1) scelta esplicita raccolta dall'agente (`paymentMethodChoice`);
  //   2) policy tenant `acceptedMethods` (online_only / on_site_only / both);
  //   3) stato Stripe Connect (se non ready → forziamo on_site);
  //   4) fallback storico ai flag requireForTakeaway/Delivery quando policy="both"
  //      e nessuna scelta esplicita è stata raccolta.
  const tenantProfile = findTenantById(input.tenantId);
  const useDemoSandbox = tenantUsesStripeDemoSandbox(input.tenantId);
  const stripeAccount = tenantProfile?.features.payments
    ? await getTenantPaymentAccount(input.tenantId, { demoSandbox: useDemoSandbox }).catch(() => null)
    : null;
  const stripeReady = Boolean(stripeAccount?.chargesEnabled);
  const policy = settings.paymentControls.acceptedMethods;

  // Metodo richiesto a 3 valori (preferito); fallback al vecchio paymentMethodChoice.
  const requestedMethod: PaymentMethod | null =
    input.paymentMethod === "online" || input.paymentMethod === "on_delivery_cash" || input.paymentMethod === "on_delivery_card"
      ? input.paymentMethod
      : input.paymentMethodChoice === "online"
        ? "online"
        : input.paymentMethodChoice === "on_site"
          ? "on_delivery_cash"
          : null;

  const onlineAllowed = stripeReady && policy !== "on_site_only";
  // Risoluzione metodo effettivo (3 valori), rispettando policy tenant + stato Stripe.
  let paymentMethod: PaymentMethod;
  if (policy === "online_only" && stripeReady) {
    paymentMethod = "online";
  } else if (requestedMethod === "online") {
    // Online richiesto ma non disponibile → ripiega su carta alla consegna.
    paymentMethod = onlineAllowed ? "online" : "on_delivery_card";
  } else if (requestedMethod === "on_delivery_cash" || requestedMethod === "on_delivery_card") {
    paymentMethod = requestedMethod;
  } else {
    // Nessuna scelta esplicita: il default operativo per gli ordini Retell è contanti
    // alla consegna/ritiro. Il link permette al cliente di cambiare metodo.
    paymentMethod = "on_delivery_cash";
  }

  // effectivePaymentMethod / shouldRequestPayment vengono derivati DOPO il calcolo del
  // totale, perché la soglia "online obbligatorio sopra N€" può forzare paymentMethod.
  const identity = await resolveCustomerIdentity({
    tenantId: input.tenantId,
    phone: input.customerPhone,
    displayName: input.customerName,
    source: input.source ?? "retell",
  });
  // Per i clienti noti il nome arriva dal CRM (lookup sul telefono): l'agente non deve
  // chiederlo né passarlo. Se non l'ha passato, lo intestiamo qui dal CRM.
  const resolvedCustomerName = input.customerName?.trim() || identity?.displayName || null;
  if (input.lines.length === 0) throw new Error("empty_order");
  const requestedCodes = input.lines.map((line) => line.itemCode);
  // L'assistente AI a volte invia il codice senza prefisso tenant (es. "margherita"
  // invece di "kimos-margherita") o con case diverso. Allarghiamo la query alle varianti
  // plausibili e risolviamo tollerando prefisso/maiuscole. Resta retrocompatibile: il
  // match esatto (caso normale degli altri tenant) vince comunque per primo.
  const codeCandidates = new Set<string>();
  const tenantPrefix = `${input.tenantId}-`;
  for (const code of requestedCodes) {
    codeCandidates.add(code);
    codeCandidates.add(`${tenantPrefix}${code}`);
    if (code.startsWith(tenantPrefix)) codeCandidates.add(code.slice(tenantPrefix.length));
  }
  const { data: items, error: itemsError } = await db
    .from("menu_items")
    .select("id,code,category_id,name,price,available,extra_list_id,location_id")
    .eq("tenant_id", input.tenantId)
    .in("code", [...codeCandidates]);
  if (itemsError) throw new Error(itemsError.message);

  const byExactCode = new Map((items ?? []).map((item) => [item.code, item]));
  const byLowerCode = new Map((items ?? []).map((item) => [item.code.toLocaleLowerCase("it-IT"), item]));
  const resolveItem = (code: string) => {
    const prefixed = `${tenantPrefix}${code}`;
    return (
      byExactCode.get(code) ??
      byExactCode.get(prefixed) ??
      byLowerCode.get(code.toLocaleLowerCase("it-IT")) ??
      byLowerCode.get(prefixed.toLocaleLowerCase("it-IT")) ??
      null
    );
  };
  const resolvedByRequested = new Map(requestedCodes.map((code) => [code, resolveItem(code)] as const));
  let resolvedItems = (items ?? []) as NonNullable<typeof items>;
  const unresolved = requestedCodes.filter((code) => !resolvedByRequested.get(code));
  if (unresolved.length > 0) {
    // Fallback di riconciliazione: carichiamo l'intero menu del tenant e proviamo a
    // ricollegare i codici allucinati per nome/codice normalizzato. Solo i codici
    // che non somigliano a nessun piatto restano davvero missing. Il link di checkout
    // è comunque modificabile dall'utente, quindi un match imperfetto è recuperabile.
    const { data: allItems } = await db
      .from("menu_items")
      .select("id,code,category_id,name,price,available,extra_list_id,location_id")
      .eq("tenant_id", input.tenantId);
    const pool = (allItems ?? []) as NonNullable<typeof items>;
    const stillMissing: string[] = [];
    for (const code of unresolved) {
      const match = reconcileMenuItem(code, pool, tenantPrefix);
      if (match) {
        resolvedByRequested.set(code, match);
        if (!resolvedItems.some((it) => it.id === match.id)) resolvedItems = [...resolvedItems, match];
      } else {
        stillMissing.push(code);
      }
    }
    if (stillMissing.length > 0) throw new Error(`missing_items:${stillMissing.join(",")}`);
  }

  const itemIds = resolvedItems.map((item) => item.id);
  const categoryIds = [...new Set(resolvedItems.map((item) => item.category_id))];
  const listIds = resolvedItems.map((item) => item.extra_list_id).filter(Boolean) as string[];
  const [{ data: itemExtras }, { data: extraListItems }, { data: categories }, menuLists] = await Promise.all([
    db.from("menu_item_extras").select("item_id,code,name,price,position").in("item_id", itemIds),
    listIds.length
      ? db.from("extra_list_items").select("id,list_id,code,name,price,position").in("list_id", listIds)
      : Promise.resolve({ data: [] as ExtraListItemRow[] }),
    db.from("menu_categories").select("id,availability,location_id").in("id", categoryIds),
    loadActiveMenuLists(db, input.tenantId, conversationalMenuChannel(input.source)),
  ]);
  const categoriesById = new Map((categories ?? []).map((category) => [category.id, category]));
  const inlineExtrasByItem = groupBy((itemExtras ?? []) as unknown as ItemExtraRow[], (extra) => extra.item_id);
  const listItemsByListId = groupBy((extraListItems ?? []) as ExtraListItemRow[], (item) => item.list_id);

  const rows = input.lines.map((line, index) => {
    const item = resolvedByRequested.get(line.itemCode)!;
    if (!item.available) throw new Error(`item_unavailable:${line.itemCode}`);
    const category = categoriesById.get(item.category_id);
    const isWrongLocation = locationId && (
      (item.location_id && item.location_id !== locationId) ||
      (category?.location_id && category.location_id !== locationId)
    );
    if (
      !category ||
      isWrongLocation ||
      !isCategoryVisible(category) ||
      (menuLists.allowedItemIds && !menuLists.allowedItemIds.has(item.id))
    ) {
      throw new Error(`item_not_in_active_menu:${line.itemCode}`);
    }
    const qty = Math.max(1, Math.floor(line.quantity));
    const addedExtras = resolveAddedExtras(item, line.addedExtraCodes ?? [], inlineExtrasByItem, listItemsByListId);
    const unit = resolveNumericPrice(item.code, item.price, line.priceOption) + addedExtras.reduce((sum, extra) => sum + extra.price, 0);
    return {
      item,
      row: {
        item_id: item.code,
        item_uuid: item.id,
        category_id: item.category_id,
        name: item.name,
        qty,
        unit_price: unit,
        line_total: unit * qty,
        note: line.note ?? null,
        added_extras: addedExtras as unknown as Json,
        removed_ingredients: (line.removedIngredients ?? []) as unknown as Json,
        bundle_picks: [] as unknown as Json,
        position: index,
      },
    };
  });
  const total = rows.reduce((sum, row) => sum + row.row.line_total, 0);

  // Soglia "online obbligatorio": sopra l'importo configurato (default 50€) il pagamento
  // con carta online è forzato. L'agente non deve proporre la scelta (vedi tool payment_options),
  // ma questa è la rete server-side che lo garantisce comunque.
  const onlineThreshold = settings.paymentControls.onlineRequiredAboveEuros;
  if (onlineThreshold > 0 && total > onlineThreshold && onlineAllowed) {
    paymentMethod = "online";
  }
  const effectivePaymentMethod: "online" | "on_site" = paymentMethod === "online" ? "online" : "on_site";
  const shouldRequestPayment = effectivePaymentMethod === "online";
  if (shouldRequestPayment && !input.customerPhone?.trim()) {
    throw new Error("payment_phone_required");
  }

  let desiredTime = normalizeConversationalOrderTime(input);
  // Ordine programmato a giorno futuro: assicura che la data finisca in desired_time
  // (non esiste colonna desired_date) così operativo non lo mostra come "il prima possibile".
  if (scheduledFuture && timeCheck.ok && (!desiredTime || !/^\d{4}-\d{2}-\d{2}/.test(desiredTime))) {
    desiredTime = timeCheck.whenSpoken ? `${timeCheck.date} ${timeCheck.whenSpoken}` : timeCheck.date;
  }
  // Modello Retell con modifica rapida:
  //  - l'ordine parte pending e NON viene inviato/stampato subito;
  //  - senza apertura link scade dopo 2 minuti e viene auto-finalizzato cash;
  //  - se il cliente apre il link, il checkout estende a 5 minuti;
  //  - online resta pending fino al pagamento Stripe.
  const waitsForPayment = shouldRequestPayment;
  const autoAccepted = false;
  const initialStatus = "pending_confirmation";
  const confirmationExpiresAt = scheduledFuture || waitsForPayment
    ? null
    : new Date(Date.now() + 2 * 60 * 1000).toISOString();
  const confirmedAt = null;

  const { data: codeRow, error: codeErr } = await db.rpc("next_order_code", {
    p_tenant_id: input.tenantId,
    p_prefix: "R",
  });
  if (codeErr) throw new Error(codeErr.message);

  const { data: order, error: orderErr } = await db
    .from("orders")
    .insert({
      tenant_id: input.tenantId,
      code: codeRow as string,
      type: fulfillmentType === "delivery" ? "delivery" : "asporto",
      total,
      source: input.source ?? "retell",
      customer_name: resolvedCustomerName,
      customer_id: identity?.customerId ?? null,
      menuary_user_id: identity?.menuaryUserId ?? null,
      pickup_time: input.pickupTime ?? null,
      // Il telefono vive nella colonna customer_phone (mostrata in operativo come
      // link tel:). Non duplicarlo nelle note, altrimenti riappare al cliente nel
      // riepilogo del checkout pubblico.
      notes: input.notes?.trim() || null,
      location_id: locationId,
      status: initialStatus,
      customer_phone: identity?.phone ?? input.customerPhone ?? null,
      fulfillment_type: fulfillmentType,
      dine_option: fulfillmentType === "delivery" ? null : "takeaway",
      delivery_address: input.delivery?.address ?? null,
      delivery_doorbell: input.delivery?.doorbell ?? null,
      delivery_floor: input.delivery?.floor ?? null,
      delivery_notes: input.delivery?.notes ?? null,
      desired_time: desiredTime,
      payment_method: paymentMethod,
      payment_status: shouldRequestPayment ? "pending" : "not_required",
      confirmation_expires_at: confirmationExpiresAt,
      confirmed_at: confirmedAt,
      auto_accepted: autoAccepted,
    } as never)
    .select("id,code,total,status")
    .single();
  if (orderErr || !order) throw new Error(orderErr?.message ?? "order_create_failed");

  const { error: linesErr } = await db.from("order_lines").insert(
    rows.map(({ row }) => ({ ...row, order_id: order.id })),
  );
  if (linesErr) throw new Error(linesErr.message);
  // La comanda parte solo alla finalizzazione: conferma manuale dal link, pagamento
  // Stripe riuscito o cron di scadenza. Qui salviamo solo il riepilogo modificabile.
  void notifyOperationalNewOrder({
    tenantId: input.tenantId,
    orderCode: order.code,
    status: order.status,
    customerName: resolvedCustomerName,
    locationId,
  }).catch(() => null);
  if (identity) {
    await recordCustomerEvent({
      tenantId: input.tenantId,
      customerId: identity.customerId,
      eventKind: fulfillmentType === "delivery" ? "delivery_order_created" : "takeaway_order_created",
      refId: order.id,
      meta: {
        source: input.source ?? "retell",
        registered: identity.registered,
        total,
        fulfillmentType,
        paymentRequested: shouldRequestPayment,
      },
    });
  }

  // Invio link al cliente:
  // - pagamento online  → link a /checkout/[code] con pulsante Paga abilitato
  // - pagamento on_site → stesso link, ma la pagina mostra solo il riepilogo
  //   (badge "Pagamento al ritiro/consegna") e nasconde il bottone Paga.
  // Inviamo solo se abbiamo un telefono; in caso contrario l'agente comunicherà
  // verbalmente che l'ordine è registrato.
  let payment: ChannelPaymentRequest | null = null;
  // Inviamo SEMPRE il messaggio di checkout quando abbiamo un telefono, a prescindere
  // dal metodo di pagamento: il template WhatsApp usato dipende poi da effectivePaymentMethod
  // (online → "paga ora", on_site → "vedi riepilogo"), gestito in createChannelPaymentRequest.
  const canSendLink = Boolean(input.customerPhone?.trim());
  if (canSendLink) {
    const orderSummary = rows
      .map(({ row }) => `${row.qty}x ${row.name}`)
      .join(", ");
    payment = await createChannelPaymentRequest({
      tenantId: input.tenantId,
      orderId: order.id,
      channel: input.paymentChannel ?? settings.paymentControls.defaultChannel,
      recipientPhone: input.customerPhone!,
      amount: total,
      currency: "EUR",
      description: `Ordine ${order.code}: ${orderSummary}`,
      paymentRequired: effectivePaymentMethod === "online",
      onSiteAvailable: effectivePaymentMethod === "online" && policy === "both",
      fulfillmentType,
      deliveryAddress: input.delivery?.address ?? null,
      metadata: {
        source: input.source ?? "retell",
        fulfillmentType,
        paymentMethod: effectivePaymentMethod,
        fallbackChannel: settings.paymentControls.fallbackChannel,
      },
    });
  }

  // Versioni "parlate" per l'agente vocale: il codice letto cifra per cifra e il
  // totale in lettere evitano la pronuncia errata del TTS.
  return {
    ...order,
    code_spoken: orderCodeToSpoken(order.code),
    total_spoken: euroToItalianWords(order.total),
    payment,
    paymentMethod: effectivePaymentMethod,
  };
}

export type MenuOpportunitySuggestion = {
  menuItemCode: string;
  menuItemName: string;
  menuPrice: number;
  currentItemsTotal: number;
  savingsEuro: number;
  /** Testo già pronto per il TTS dell'agente vocale. */
  spokenSuggestion: string;
};

/**
 * Dato un set di codici-item già raccolti dall'agente, cerca se esiste un menu
 * composto (bundle) che copre tutti gli slot con quegli item, e calcola il risparmio.
 *
 * Chiamare PRIMA di createRetellOrder, come tool separato dell'agente vocale.
 * Se il cliente accetta, l'agente crea l'ordine con il solo item-menu (non i singoli).
 */
export async function detectRetellMenuOpportunity(
  tenantId: string,
  itemCodes: string[],
): Promise<MenuOpportunitySuggestion | null> {
  if (itemCodes.length < 2) return null;

  const db = svc();
  const tenantPrefix = `${tenantId}-`;

  // Carica gli item richiesti
  const candidates = new Set<string>(itemCodes.flatMap((c) => [c, `${tenantPrefix}${c}`]));
  const { data: requestedItems } = await db
    .from("menu_items")
    .select("id,code,category_id,price")
    .eq("tenant_id", tenantId)
    .in("code", [...candidates]);

  if (!requestedItems?.length) return null;

  // Normalizza i codici alle versioni "senza prefisso" per la ricerca slot
  const normalizeCode = (code: string) =>
    code.startsWith(tenantPrefix) ? code.slice(tenantPrefix.length) : code;

  const inputById = new Map(requestedItems.map((it) => [it.id, it]));
  const inputByCat = new Map<string, typeof requestedItems[number][]>();
  for (const it of requestedItems) {
    const bucket = inputByCat.get(it.category_id) ?? [];
    bucket.push(it);
    inputByCat.set(it.category_id, bucket);
  }

  // Carica tutti i menu bundle del tenant
  const { data: menuItems } = await db
    .from("menu_items")
    .select("id,code,name,price,bundle_slots,available")
    .eq("tenant_id", tenantId)
    .eq("available", true)
    .not("bundle_slots", "is", null);

  if (!menuItems?.length) return null;

  let bestOpportunity: MenuOpportunitySuggestion | null = null;

  for (const menuItem of menuItems) {
    const slots = menuItem.bundle_slots as Array<{
      id: string;
      sourceCategoryIds: string[];
      sourceItemIds?: string[];
    }> | null;
    if (!slots?.length) continue;

    const usedItemIds = new Set<string>();
    let allSlotsCovered = true;

    for (const slot of slots) {
      let covered = false;

      for (const it of requestedItems) {
        if (usedItemIds.has(it.id)) continue;
        const catMatch = slot.sourceCategoryIds.includes(it.category_id);
        const itemMatch = slot.sourceItemIds?.includes(it.id) ||
          slot.sourceItemIds?.includes(normalizeCode(it.code));
        if (catMatch || itemMatch) {
          usedItemIds.add(it.id);
          covered = true;
          break;
        }
      }

      if (!covered) {
        allSlotsCovered = false;
        break;
      }
    }

    if (!allSlotsCovered) continue;

    const coveredItems = [...usedItemIds].map((id) => inputById.get(id)!);
    const currentItemsTotal = coveredItems.reduce(
      (sum, it) => sum + resolveNumericPrice(it.code, it.price),
      0,
    );
    const menuPrice = resolveNumericPrice(menuItem.code, menuItem.price);
    const savingsEuro = currentItemsTotal - menuPrice;

    if (!bestOpportunity || savingsEuro > bestOpportunity.savingsEuro) {
      const savingsFmt = savingsEuro > 0
        ? `risparmi ${euroToItalianWords(savingsEuro)}`
        : "stesso prezzo";
      bestOpportunity = {
        menuItemCode: normalizeCode(menuItem.code),
        menuItemName: menuItem.name,
        menuPrice,
        currentItemsTotal,
        savingsEuro,
        spokenSuggestion:
          `Ho notato che gli articoli che hai scelto corrispondono al ${menuItem.name}: con il menu ${savingsFmt}. Vuoi che lo converta?`,
      };
    }
  }

  return bestOpportunity;
}

export type RetellActiveOrder = {
  orderId: string;
  code: string;
  status: string;
  statusLabel: string;
  fulfillmentType: string;
  scheduledTime: string;
  itemsSummary: string;
  /** True se l'ordine è ancora nella finestra di modifica/annullo (5 min da created_at, status permitting). */
  isModifiable: boolean;
  /** URL della pagina di riepilogo/pagamento dell'ordine, già con token. */
  checkoutUrl: string;
};

export type RetellCustomerContext = {
  isKnown: boolean;
  firstName: string;
  language: string;
  lastAddress: string;
  lastOrderSummary: string;
  activeOrder: RetellActiveOrder | null;
};

export async function setCustomerLanguage(
  tenantId: string,
  callerPhone: string,
  language: string,
): Promise<{ updated: boolean }> {
  const phone = normalizePhone(callerPhone);
  if (!phone || !language.trim()) return { updated: false };

  const db = svc();
  const { error } = await db
    .from("customers")
    .update({ language: language.trim(), updated_at: new Date().toISOString() } as never)
    .eq("tenant_id", tenantId)
    .eq("phone", phone);
  return { updated: !error };
}

const ACTIVE_ORDER_STATUSES = ["pending_confirmation", "nuovo", "in_preparazione", "pronto"] as const;
const MODIFIABLE_STATUSES = ["pending_confirmation", "nuovo"] as const;
const MODIFY_WINDOW_MS = 5 * 60 * 1000;

function orderStatusLabel(status: string): string {
  switch (status) {
    case "pending_confirmation": return "in attesa di conferma dal locale";
    case "nuovo": return "confermato, in attesa di preparazione";
    case "in_preparazione": return "in preparazione";
    case "pronto": return "pronto per il ritiro o la consegna";
    default: return status;
  }
}

function fulfillmentLabel(type: string): string {
  return type === "delivery" ? "consegna a domicilio" : "asporto";
}

export async function lookupRetellCustomer(
  tenantId: string,
  callerPhone: string,
): Promise<RetellCustomerContext> {
  const empty: RetellCustomerContext = { isKnown: false, firstName: "", language: "", lastAddress: "", lastOrderSummary: "", activeOrder: null };

  const phone = normalizePhone(callerPhone);
  if (!phone) return empty;

  const db = svc();

  type ActiveOrderRow = { id: string; code: string; status: string; fulfillment_type: string; pickup_time: string | null; desired_time: string | null; created_at: string; public_token: string };
  const activeOrderQuery = db
    .from("orders")
    .select("id,code,status,fulfillment_type,pickup_time,desired_time,created_at,public_token")
    .eq("tenant_id", tenantId)
    .eq("customer_phone", phone)
    .in("status", [...ACTIVE_ORDER_STATUSES])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as Promise<{ data: ActiveOrderRow | null }>;

  const [{ data: customer }, { data: orders }, { data: activeOrderRow }] = await Promise.all([
    db
      .from("customers")
      .select("id,display_name,language")
      .eq("tenant_id", tenantId)
      .eq("phone", phone)
      .order("menuary_user_id", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("orders")
      .select("id,delivery_address,fulfillment_type")
      .eq("tenant_id", tenantId)
      .eq("customer_phone", phone)
      .in("status", ["nuovo", "in_preparazione", "pronto", "consegnato"])
      .order("created_at", { ascending: false })
      .limit(3),
    activeOrderQuery,
  ]);

  if (!customer && (!orders || orders.length === 0) && !activeOrderRow) return empty;

  const firstName = (customer as { display_name?: string | null } | null)?.display_name?.trim().split(/\s+/)[0] ?? "";
  const language = (customer as { language?: string | null } | null)?.language?.trim() ?? "";

  const lastAddress =
    (orders as { delivery_address: string | null }[] | null)?.find((o) => o.delivery_address)?.delivery_address ?? "";

  let lastOrderSummary = "";
  if (orders && orders.length > 0) {
    const lastOrderId = (orders as { id: string }[])[0].id;
    const { data: lines } = await db
      .from("order_lines")
      .select("name,qty,note,variant_label")
      .eq("order_id", lastOrderId)
      .order("position", { ascending: true });

    if (lines && lines.length > 0) {
      lastOrderSummary = (lines as { name: string; qty: number; note: string | null; variant_label: string | null }[])
        .map((l) => {
          let s = `${l.qty}× ${l.name}`;
          if (l.variant_label) s += ` (${l.variant_label})`;
          if (l.note?.trim()) s += ` — ${l.note.trim()}`;
          return s;
        })
        .join(", ");
    }
  }

  let activeOrder: RetellActiveOrder | null = null;
  if (activeOrderRow) {
    const isModifiableStatus = (MODIFIABLE_STATUSES as readonly string[]).includes(activeOrderRow.status);
    const ageMs = Date.now() - new Date(activeOrderRow.created_at).getTime();
    const isModifiable = isModifiableStatus && ageMs <= MODIFY_WINDOW_MS;
    const scheduledTime = activeOrderRow.pickup_time ?? activeOrderRow.desired_time ?? "";

    const { data: activeLines } = await db
      .from("order_lines")
      .select("name,qty")
      .eq("order_id", activeOrderRow.id)
      .order("position", { ascending: true });

    const itemsSummary = (activeLines as { name: string; qty: number }[] | null ?? [])
      .map((l) => `${l.qty}× ${l.name}`)
      .join(", ");

    activeOrder = {
      orderId: activeOrderRow.id,
      code: activeOrderRow.code,
      status: activeOrderRow.status,
      statusLabel: orderStatusLabel(activeOrderRow.status),
      fulfillmentType: fulfillmentLabel(activeOrderRow.fulfillment_type),
      scheduledTime,
      itemsSummary,
      isModifiable,
      checkoutUrl: tenantCheckoutUrl(tenantId, activeOrderRow.code, activeOrderRow.public_token),
    };
  }

  return {
    isKnown: Boolean(customer || (orders && orders.length > 0) || activeOrderRow),
    firstName,
    language,
    lastAddress,
    lastOrderSummary,
    activeOrder,
  };
}

export type ResendRetellOrderLinkInput = {
  tenantId: string;
  orderId: string;
  recipientPhone: string;
};

export async function resendRetellOrderLink(
  input: ResendRetellOrderLinkInput,
): Promise<{ sent: boolean; channel: string | null }> {
  const phone = normalizePhone(input.recipientPhone);
  if (!phone) return { sent: false, channel: null };

  const db = svc();

  type OrderRow = {
    id: string;
    code: string;
    total: number | string;
    fulfillment_type: string;
    delivery_address: string | null;
    payment_status: string;
    customer_name: string | null;
  };

  const { data } = await (db as unknown as {
    from: (table: "orders") => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: OrderRow | null }>;
          };
        };
      };
    };
  })
    .from("orders")
    .select("id,code,total,fulfillment_type,delivery_address,payment_status,customer_name")
    .eq("tenant_id", input.tenantId)
    .eq("id", input.orderId)
    .maybeSingle();

  if (!data) return { sent: false, channel: null };

  const isDelivery = data.fulfillment_type === "delivery";
  // Pagamento richiesto solo se l'ordine è ancora in attesa di pagamento online.
  const paymentRequired = data.payment_status === "pending";
  const total = Number(data.total);

  const aiSettings = await getAiPhoneSettings(input.tenantId);

  await createChannelPaymentRequest({
    tenantId: input.tenantId,
    orderId: data.id,
    channel: "retell",
    recipientPhone: phone,
    amount: total > 0 ? total : 0.01,
    description: `Riepilogo ordine ${data.code}${data.customer_name ? ` — ${data.customer_name}` : ""}`,
    paymentRequired,
    fulfillmentType: isDelivery ? "delivery" : "takeaway",
    deliveryAddress: isDelivery ? (data.delivery_address ?? undefined) : undefined,
  });

  return { sent: true, channel: aiSettings.paymentControls.defaultChannel };
}
