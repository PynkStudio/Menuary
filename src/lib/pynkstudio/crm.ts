import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import { ATTRIBUTION_KEYS, type Attribution } from "@/lib/tracking/types";
import { parseEmployees, type CrmActivityType } from "./crm-shared";

type Svc = SupabaseClient<Database>;
type CrmRow = Database["public"]["Tables"]["pynkstudio_crm"]["Row"];

function clean(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function cleanAttribution(value: unknown): Attribution | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const out: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const v = clean(raw[key], 200);
    if (v) out[key] = v;
  }
  const referrer = clean(raw.referrer, 300);
  const landing = clean(raw.landing_path, 200);
  const captured = clean(raw.captured_at, 40);
  if (referrer) out.referrer = referrer;
  if (landing) out.landing_path = landing;
  if (captured) out.captured_at = captured;
  return Object.keys(out).length ? out : null;
}

export function cleanList(value: unknown, maxItems = 12, maxLen = 120): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => clean(v, maxLen)).filter(Boolean).slice(0, maxItems);
}

export type CrmTouch = {
  kind: "form" | "booking" | "unsubscribe";
  source: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  employees?: string | number | null;
  industry?: string;
  interests?: string[];
  timing?: string;
  plan?: string;
  attribution?: Attribution | null;
  /** Titolo/testo della voce in timeline. */
  title: string;
  body?: string;
  meta?: Record<string, unknown>;
  booking?: { id: string; startsAt: string };
};

/**
 * Punto unico in cui ogni ingresso (form contatti, landing IA, prenotazione call, disiscrizione)
 * scrive nel CRM: crea o aggiorna il contatto, unisce i dati raccolti senza perdere quelli
 * già noti e aggiunge una voce in timeline. I campi vuoti non cancellano mai un dato esistente.
 */
export async function recordCrmTouch(svc: Svc, touch: CrmTouch): Promise<{ id: string; created: boolean } | null> {
  const email = touch.email.trim().toLowerCase();
  const { range, count } = parseEmployees(touch.employees);
  const now = new Date().toISOString();
  const attribution = (touch.attribution ?? null) as Json | null;

  const load = () => svc.from("pynkstudio_crm").select("*").eq("email", email).maybeSingle();

  for (let attempt = 0; attempt < 2; attempt++) {
    const { data: existing } = await load();

    if (existing) {
      await updateExisting(svc, existing, touch, { range, count, attribution, now });
      await addActivity(svc, existing.id, touch);
      return { id: existing.id, created: false };
    }

    const { data: created, error } = await svc
      .from("pynkstudio_crm")
      .insert({
        name: touch.name || email,
        email,
        phone: touch.phone ?? "",
        company: touch.company || null,
        employees_range: range,
        employees_count: count,
        industry: touch.industry || null,
        interests: touch.interests ?? [],
        timing: touch.timing || null,
        plan_interest: touch.plan || null,
        source: touch.source,
        tags: touch.kind === "unsubscribe" ? [] : [touch.source],
        status: touch.kind === "booking" ? "prospect" : "lead",
        first_attribution: attribution,
        last_attribution: attribution,
        submissions_count: touch.kind === "form" ? 1 : 0,
        bookings_count: touch.booking ? 1 : 0,
        last_booking_id: touch.booking?.id ?? null,
        last_booking_at: touch.booking?.startsAt ?? null,
        unsubscribed_at: touch.kind === "unsubscribe" ? now : null,
        last_activity_at: now,
      })
      .select("id")
      .single();
    // 23505: un'altra richiesta ha creato lo stesso contatto nel frattempo → riprova come aggiornamento.
    if (error?.code === "23505") continue;
    if (error || !created) throw error ?? new Error("crm_insert_failed");
    await addActivity(svc, created.id, touch);
    return { id: created.id, created: true };
  }
  return null;
}

async function updateExisting(
  svc: Svc,
  existing: CrmRow,
  touch: CrmTouch,
  ctx: { range: string | null; count: number | null; attribution: Json | null; now: string },
) {
  const patch: Database["public"]["Tables"]["pynkstudio_crm"]["Update"] = {
    updated_at: ctx.now,
    last_activity_at: ctx.now,
  };

  // Il nome resta quello già noto, salvo sia solo l'email (contatto nato da una disiscrizione).
  if (touch.name && (!existing.name || existing.name === existing.email)) patch.name = touch.name;
  if (touch.phone) patch.phone = touch.phone;
  if (touch.company) patch.company = touch.company;
  if (ctx.range || ctx.count) {
    patch.employees_range = ctx.range;
    patch.employees_count = ctx.count;
  }
  if (touch.industry) patch.industry = touch.industry;
  if (touch.timing) patch.timing = touch.timing;
  if (touch.plan) patch.plan_interest = touch.plan;
  if (touch.interests?.length) {
    patch.interests = Array.from(new Set([...existing.interests, ...touch.interests]));
  }
  if (ctx.attribution) {
    patch.last_attribution = ctx.attribution;
    if (!existing.first_attribution) patch.first_attribution = ctx.attribution;
  }
  if (!existing.tags.includes(touch.source) && touch.kind !== "unsubscribe") {
    patch.tags = [...existing.tags, touch.source];
  }

  if (touch.kind === "form") patch.submissions_count = existing.submissions_count + 1;
  if (touch.kind === "unsubscribe") patch.unsubscribed_at = ctx.now;
  if (touch.booking) {
    patch.bookings_count = existing.bookings_count + 1;
    patch.last_booking_id = touch.booking.id;
    patch.last_booking_at = touch.booking.startsAt;
  }

  // Una richiesta nuova riapre chi era stato dato per perso; una call promuove un lead a prospect.
  if (touch.kind !== "unsubscribe") {
    if (existing.status === "lost") patch.status = touch.booking ? "prospect" : "lead";
    else if (existing.status === "lead" && touch.booking) patch.status = "prospect";
  }

  const { error } = await svc.from("pynkstudio_crm").update(patch).eq("id", existing.id);
  if (error) throw error;

  if (patch.status && patch.status !== existing.status) {
    await addCrmActivity(svc, existing.id, "status", `Stato: ${existing.status} → ${patch.status}`, undefined, "sistema");
  }
}

async function addActivity(svc: Svc, contactId: string, touch: CrmTouch) {
  await addCrmActivity(svc, contactId, touch.kind, touch.title, touch.body, "sito", {
    source: touch.source,
    ...touch.meta,
    ...(touch.booking ? { booking_id: touch.booking.id, starts_at: touch.booking.startsAt } : {}),
    ...(touch.attribution ? { attribution: touch.attribution } : {}),
  });
}

export async function addCrmActivity(
  svc: Svc,
  contactId: string,
  type: CrmActivityType,
  title: string,
  body?: string,
  createdBy?: string,
  meta?: Record<string, unknown>,
) {
  const { error } = await svc.from("pynkstudio_crm_activities").insert({
    contact_id: contactId,
    type,
    title: title.slice(0, 200),
    body: body ? body.slice(0, 4000) : null,
    created_by: createdBy ?? null,
    meta: (meta ?? null) as Json | null,
  });
  if (error) console.warn("[crm] attività non registrata:", error.message);
}
