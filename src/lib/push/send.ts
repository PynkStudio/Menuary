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
  /** URL aperto al click sulla notifica (default: "/"). */
  url?: string;
  tag?: string;
};

/**
 * Destinatario della push: tutte le subscription di un tenant
 * (pannelli gestione/tenant) oppure di un utente siteadmin (pannello admin).
 */
export type PushTarget =
  | { tenantId: string }
  | { siteadminId: string };

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

/**
 * Invia una push a tutte le subscription del target. Ritorna il numero di
 * invii riusciti. Punto d'ingresso unico per ogni nuova notifica del portale:
 * aggiungere qui eventuali nuovi tipi di target, non duplicare l'invio.
 */
export async function sendWebPushTo(target: PushTarget, payload: PushPayload): Promise<number> {
  if (!ensureVapid()) {
    console.warn("[push] VAPID non configurate: notifica saltata.", payload.title);
    return 0;
  }
  const svc = createSupabaseServiceClient();
  if (!svc) {
    console.warn("[push] Supabase service client non configurato.");
    return 0;
  }

  let query = svc
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  query = "tenantId" in target
    ? query.eq("tenant_id", target.tenantId)
    : query.eq("siteadmin_id", target.siteadminId);
  const { data: subs, error } = await query;
  if (error || !subs?.length) return 0;

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
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

/** Invia una push a tutte le subscription di un tenant. Ritorna il numero di invii riusciti. */
export async function sendWebPush(tenantId: string, payload: PushPayload): Promise<number> {
  // I chiamanti storici (agenda Pynk) contavano sul default agenda: preservato.
  return sendWebPushTo({ tenantId }, { ...payload, url: payload.url ?? "/admin-pynkstudio/agenda" });
}

/** Invia una push a tutti i dispositivi registrati di un utente siteadmin. */
export async function sendWebPushToSiteadmin(siteadminId: string, payload: PushPayload): Promise<number> {
  return sendWebPushTo({ siteadminId }, payload);
}
