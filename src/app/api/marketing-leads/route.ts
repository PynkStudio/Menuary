import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail, resolveSenderForVertical } from "@/lib/email/sender";
import { buildContactConfirmationEmail } from "@/lib/email/templates/contact-confirmation";
import { DEFAULT_MARKET, normalizeMarketCode } from "@/lib/markets";
import { ATTRIBUTION_KEYS, type Attribution } from "@/lib/tracking/types";

type LeadRequest = {
  name?: string;
  businessName?: string;
  restaurantName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  vertical?: string;
  interest?: string;
  message?: string;
  source?: string;
  website?: string;
  attribution?: unknown;
};

/** Codici stabili: i form li traducono nella lingua del visitatore. */
type LeadErrorCode = "missing_fields" | "invalid_email" | "rate_limited" | "server_error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Limite per istanza (Fluid Compute riusa le istanze): frena i bot che
// martellano l'endpoint. Il limite per email sotto vale su tutte le istanze.
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_MAX = 8;
const ipHits = new Map<string, number[]>();

function ipLimited(ip: string | null): boolean {
  if (!ip) return false;
  const now = Date.now();
  const recent = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  recent.push(now);
  ipHits.set(ip, recent);
  if (ipHits.size > 5000) ipHits.clear();
  return recent.length > IP_MAX;
}

function clean(value: unknown, max = 320): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function cleanAttribution(value: unknown): Attribution | null {
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

function buildNotes(interest: string, message: string): string | null {
  const parts: string[] = [];
  if (interest) parts.push(`Interesse: ${interest}`);
  if (message) parts.push(message);
  return parts.length ? parts.join("\n\n") : null;
}

const ERROR_MESSAGES: Record<"food" | "services" | "creative", Record<LeadErrorCode, string>> = {
  food: {
    missing_fields: "Compila nome, ristorante ed email.",
    invalid_email: "Controlla l'indirizzo email.",
    rate_limited: "Hai già inviato una richiesta: ti ricontattiamo a breve.",
    server_error: "Invio non riuscito. Riprova tra poco.",
  },
  services: {
    missing_fields: "Compila nome, azienda ed email.",
    invalid_email: "Controlla l'indirizzo email.",
    rate_limited: "Hai già inviato una richiesta: ti ricontattiamo a breve.",
    server_error: "Invio non riuscito. Riprova tra poco.",
  },
  creative: {
    missing_fields: "Compila nome, progetto/attività ed email.",
    invalid_email: "Controlla l'indirizzo email.",
    rate_limited: "Hai già inviato una richiesta: ti ricontattiamo a breve.",
    server_error: "Invio non riuscito. Riprova tra poco.",
  },
};

function fail(vertical: "food" | "services" | "creative", code: LeadErrorCode, status: number) {
  return NextResponse.json({ ok: false, code, error: ERROR_MESSAGES[vertical][code] }, { status });
}

async function sendConfirmationEmail(
  to: string,
  contactName: string,
  businessName: string,
  vertical: "food" | "services" | "creative",
): Promise<void> {
  const { from, brand } = resolveSenderForVertical(vertical);
  const firstName = contactName.split(/\s+/)[0] ?? "";
  const html = buildContactConfirmationEmail({ brand, firstName, businessName });

  await sendEmail({
    to,
    subject: `Abbiamo ricevuto la tua richiesta · ${brand.name}`,
    html,
    fromOverride: from,
    replyTo: `hello@${brand.domain}`,
  });
}

type LeadsTable = {
  from: (t: string) => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { code?: string; message?: string } | null }>;
    select: (
      columns: string,
      options: { count: "exact"; head: true },
    ) => {
      eq: (column: string, value: string) => {
        gte: (column: string, value: string) => Promise<{ count: number | null }>;
      };
    };
  };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LeadRequest;

  const name = clean(body.name, 120);
  const businessName = clean(body.businessName || body.restaurantName, 160);
  const email = clean(body.email, 180).toLowerCase();
  const phone = clean(body.phone, 60);
  const city = clean(body.city, 120);
  const country = normalizeMarketCode(clean(body.country, 8)) ?? DEFAULT_MARKET;
  const interest = clean(body.interest, 160);
  const message = clean(body.message, 1600);
  const website = clean(body.website, 160);
  const attribution = cleanAttribution(body.attribution);
  const verticalRaw = clean(body.vertical, 16).toLowerCase();
  const vertical: "food" | "services" | "creative" =
    verticalRaw === "creative" ? "creative" : verticalRaw === "services" ? "services" : "food";
  const source = clean(body.source, 60)
    || (vertical === "creative"
      ? "orpheo-marketing-site"
      : vertical === "services"
        ? "bizery-marketing-site"
        : "menuary-marketing-site");

  if (website) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !businessName || !email) return fail(vertical, "missing_fields", 400);
  if (!EMAIL_RE.test(email)) return fail(vertical, "invalid_email", 400);

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (ipLimited(ip)) return fail(vertical, "rate_limited", 429);

  const supabase = createSupabaseAdminClient() as unknown as LeadsTable;

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: recentForEmail } = await supabase
    .from("platform_leads")
    .select("id", { count: "exact", head: true })
    .eq("contact_email", email)
    .gte("created_at", since);
  if ((recentForEmail ?? 0) >= 2) return fail(vertical, "rate_limited", 429);

  const row: Record<string, unknown> = {
    business_name: businessName,
    business_vertical: vertical,
    contact_name: name,
    contact_email: email,
    contact_phone: phone || null,
    city: city || null,
    country,
    status: "lead",
    source,
    notes: buildNotes(interest, message),
    attribution,
  };

  let { error } = await supabase.from("platform_leads").insert(row);
  // Colonna non ancora presente (migration non applicata): il lead conta più
  // dell'attribuzione, quindi si salva comunque.
  if (error && /attribution/i.test(error.message ?? "")) {
    const withoutAttribution = { ...row };
    delete withoutAttribution.attribution;
    ({ error } = await supabase.from("platform_leads").insert(withoutAttribution));
  }

  if (error) return fail(vertical, "server_error", 500);

  // Best-effort: il lead è già salvato, un errore di invio non deve far
  // ripetere la richiesta all'utente (creerebbe duplicati).
  await sendConfirmationEmail(email, name, businessName, vertical).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
