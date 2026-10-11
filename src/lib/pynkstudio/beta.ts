import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { sendEmail } from "@/lib/email/sender";
import { betaAccessHtml, betaNewHtml } from "@/lib/pynkstudio/email-templates";
import {
  betaDeviceLabel,
  betaKindLabel,
  betaMethodInfo,
  channelsForDevices,
  cleanBetaChannels,
  testerWantsBeta,
  type BetaChannel,
} from "@/lib/pynkstudio/beta-shared";

type Svc = SupabaseClient<Database>;
export type BetaTesterRow = Database["public"]["Tables"]["pynkstudio_beta_testers"]["Row"];
export type BetaRow = Database["public"]["Tables"]["pynkstudio_betas"]["Row"];

export const BETA_COOKIE = "pynk_beta";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const PYNK_FROM = "PYNK STUDIO <amministrazione@pynkstudio.eu>";
const PYNK_REPLY_TO = "amministrazione@pynkstudio.eu";
const PYNK_ORIGIN = "https://pynkstudio.eu";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isBetaToken(v: string | null | undefined): v is string {
  return !!v && UUID_RE.test(v);
}

/** Le email puntano sempre al sito pubblico (anche se partono da admin.pynkstudio.eu); in locale all'host di sviluppo, dove vive il cookie. */
export function betaOrigin(request: Request): string {
  const url = new URL(request.url);
  return /localhost|127\.0\.0\.1/.test(url.hostname) ? url.origin : PYNK_ORIGIN;
}

export function betaAccessUrl(origin: string, token: string) {
  return `${origin}/beta/accedi/${token}`;
}

export function betaUnsubscribeUrl(origin: string, token: string) {
  return `${origin}/api/pynkstudio/beta/unsubscribe?t=${token}`;
}

export function setBetaCookie(res: NextResponse, token: string) {
  res.cookies.set(BETA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearBetaCookie(res: NextResponse) {
  res.cookies.set(BETA_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function getBetaTester(svc: Svc): Promise<BetaTesterRow | null> {
  const token = (await cookies()).get(BETA_COOKIE)?.value;
  if (!isBetaToken(token)) return null;
  const { data } = await svc.from("pynkstudio_beta_testers").select("*").eq("access_token", token).maybeSingle();
  return data ?? null;
}

export async function sendBetaAccessEmail(tester: BetaTesterRow, origin: string, isNew: boolean) {
  return sendEmail({
    to: tester.email,
    fromOverride: PYNK_FROM,
    replyTo: PYNK_REPLY_TO,
    subject: isNew ? "Conferma la tua iscrizione alle beta PYNK STUDIO" : "Il tuo link per le beta PYNK STUDIO",
    html: betaAccessHtml({ firstName: tester.first_name, accessUrl: betaAccessUrl(origin, tester.access_token), isNew }),
  });
}

export async function sendBetaMail(to: string, subject: string, html: string) {
  return sendEmail({ to, fromOverride: PYNK_FROM, replyTo: PYNK_REPLY_TO, subject, html });
}

export type PublicBeta = Omit<BetaRow, "channels" | "notified_at"> & { channels: BetaChannel[] };

/** Senza profilo il visitatore vede le beta ma non i link d'invito. */
export function toPublicBeta(beta: BetaRow, withUrls: boolean): PublicBeta {
  const { notified_at: _n, ...rest } = beta;
  void _n;
  const channels = cleanBetaChannels(beta.channels).map((c) => {
    if (withUrls && !betaMethodInfo(c.method).needsApproval) return c;
    return { ...c, url: "" };
  });
  return { ...rest, channels };
}

const SEND_GAP_MS = 550; // Resend: ~2 richieste al secondo sul piano base.

/**
 * Avvisa i tester verificati che hanno almeno un dispositivo compatibile e i filtri d'interesse
 * soddisfatti. Chi è già stato avvisato per questa beta non riceve un secondo messaggio.
 */
export async function notifyBetaTesters(svc: Svc, beta: BetaRow, origin: string, dryRun: boolean) {
  const channels = cleanBetaChannels(beta.channels);
  const [{ data: testers }, { data: already }] = await Promise.all([
    svc
      .from("pynkstudio_beta_testers")
      .select("*")
      .eq("notify_enabled", true)
      .not("email_verified_at", "is", null)
      .limit(5000),
    svc.from("pynkstudio_beta_notifications").select("tester_id").eq("beta_id", beta.id).limit(10000),
  ]);
  const notified = new Set((already ?? []).map((r) => r.tester_id));
  const targets = (testers ?? []).filter(
    (t) => !notified.has(t.id) && testerWantsBeta(t, { ...beta, channels }),
  );
  if (dryRun) return { targets: targets.length, sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;
  for (const t of targets) {
    const mine = channelsForDevices(channels, t.devices);
    const result = await sendBetaMail(
      t.email,
      `${beta.name}: nuova beta disponibile`,
      betaNewHtml({
        firstName: t.first_name,
        betaName: beta.name,
        tagline: beta.tagline,
        kindLabel: betaKindLabel(beta.kind),
        version: beta.version,
        channels: mine.map((c) => ({ deviceLabel: betaDeviceLabel(c.device), methodLabel: betaMethodInfo(c.method).label })),
        areaUrl: `${origin}/beta`,
        unsubscribeUrl: betaUnsubscribeUrl(origin, t.access_token),
      }),
    );
    if (result.ok) {
      sent++;
      await svc.from("pynkstudio_beta_notifications").upsert({ beta_id: beta.id, tester_id: t.id });
    } else {
      failed++;
    }
    await new Promise((r) => setTimeout(r, SEND_GAP_MS));
  }
  if (sent > 0) {
    await svc.from("pynkstudio_betas").update({ notified_at: new Date().toISOString() }).eq("id", beta.id);
  }
  return { targets: targets.length, sent, failed };
}
