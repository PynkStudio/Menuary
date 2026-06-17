import webpush from "web-push";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/**
 * Invio Web Push lato server. Le chiavi VAPID vanno nelle env:
 *   NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY, WEB_PUSH_SUBJECT (mailto:).
 * Senza chiavi è un no-op sicuro (warning), così build e flussi non si rompono.
 * Le subscription morte (404/410) vengono rimosse dal DB.
 */

export type PushPayload = {
  title: string;
  body: string;
  /** URL aperto al click sulla notifica (default: agenda admin). */
  url?: string;
  tag?: string;
};

let vapidReady: boolean | null = null;

function ensureVapid(): boolean {
  if (vapidReady !== null) return vapidReady;
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT || "mailto:info@pynkstudio.it";
  if (!publicKey || !privateKey) {
    vapidReady = false;
    return false;
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
  return true;
}

/** Invia una push a tutte le subscription di un tenant. Ritorna il numero di invii riusciti. */
export async function sendWebPush(tenantId: string, payload: PushPayload): Promise<number> {
  if (!ensureVapid()) {
    console.warn("[push] VAPID non configurate: notifica saltata.", payload.title);
    return 0;
  }
  const svc = createSupabaseServiceClient();
  if (!svc) {
    console.warn("[push] Supabase service client non configurato.");
    return 0;
  }

  const { data: subs, error } = await svc
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("tenant_id", tenantId);
  if (error || !subs?.length) return 0;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/admin-pynkstudio/agenda",
    tag: payload.tag,
  });

  const deadIds: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) deadIds.push(s.id);
        else console.warn("[push] invio fallito:", statusCode ?? err);
      }
    }),
  );

  if (deadIds.length) {
    await svc.from("push_subscriptions").delete().in("id", deadIds);
  }
  return sent;
}
