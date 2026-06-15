import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  createRenewalPayment,
  suspendSubscription,
  attachPaymentProviderRefs,
} from "@/lib/platform/subscription-service";
import { createBunqPaymentRequest } from "@/lib/payments/bunq/payment-requests";
import { paymentRedirectUrl } from "@/lib/payments/payment-urls";
import { sendEmail, PLATFORM_BRANDS, resolveSenderForVertical } from "@/lib/email/sender";
import { FORNITORE, formatEUR } from "@/lib/contracts/menuary-contract";
import type { TenantVertical } from "@/lib/tenant";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Vercel chiama i cron con Authorization: Bearer {CRON_SECRET}.
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Giorni di anticipo del promemoria prima della scadenza. */
const REMINDER_DAYS_AHEAD = 7;

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

type LeadLite = {
  business_name: string | null;
  contact_email: string | null;
  business_vertical: TenantVertical | null;
};
type PaymentRow = {
  id: string;
  amount: number;
  payment_method: string | null;
  kind: string;
  due_date: string | null;
  reminder_sent_at: string | null;
  subscription_id: string;
  platform_subscriptions: { status: string } | null;
  platform_leads: LeadLite | null;
};
type SubRow = {
  id: string;
  payment_method: string | null;
  price_override: number | null;
  billing_cycle: string;
  next_renewal_at: string | null;
  platform_leads: LeadLite | null;
};

function brandFor(vertical: TenantVertical | null) {
  const v: TenantVertical = vertical ?? "food";
  return { brand: PLATFORM_BRANDS[v], sender: resolveSenderForVertical(v) };
}

// Supabase pg_cron (pg_net) invoca via POST; manteniamo GET per test manuali.
export async function POST(req: Request) {
  return runRenewals(req);
}
export async function GET(req: Request) {
  return runRenewals(req);
}

async function runRenewals(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "service_unconfigured" }, { status: 503 });

  const today = todayISO();
  const remindDate = addDays(today, REMINDER_DAYS_AHEAD);
  const result = { reminders: 0, renewals: 0, suspensions: 0, errors: [] as string[] };

  // ─── A. Promemoria −7gg (primo pagamento o rinnovo ancora pending) ────────────
  const { data: dueSoon } = await db
    .from("platform_payments")
    .select(
      "id, amount, payment_method, kind, due_date, reminder_sent_at, subscription_id, platform_subscriptions(status), platform_leads(business_name, contact_email, business_vertical)",
    )
    .eq("status", "pending")
    .eq("due_date", remindDate);

  for (const p of (dueSoon ?? []) as unknown as PaymentRow[]) {
    const subStatus = p.platform_subscriptions?.status;
    if (subStatus === "cancelled") continue;
    if (p.reminder_sent_at === remindDate) continue;
    const email = p.platform_leads?.contact_email;
    if (!email) continue;
    try {
      const { brand, sender } = brandFor(p.platform_leads?.business_vertical ?? null);
      await sendEmail({
        to: email,
        subject: `Promemoria pagamento in scadenza — ${brand.name}`,
        html: reminderHtml(p.platform_leads?.business_name ?? "", p.amount, p.due_date ?? remindDate, brand),
        fromOverride: sender.from,
      });
      await db
        .from("platform_payments")
        .update({ reminder_sent_at: remindDate } as never)
        .eq("id", p.id);
      result.reminders++;
    } catch (err) {
      result.errors.push(`reminder ${p.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ─── B. Rinnovi giorno-0 (genera pagamento + invia link/sollecito) ────────────
  const { data: dueRenewals } = await db
    .from("platform_subscriptions")
    .select(
      "id, payment_method, price_override, billing_cycle, next_renewal_at, platform_leads(business_name, contact_email, business_vertical)",
    )
    .eq("status", "active")
    .lte("next_renewal_at", today);

  for (const s of (dueRenewals ?? []) as unknown as SubRow[]) {
    try {
      const renewal = await createRenewalPayment(s.id);
      if (!renewal) continue;
      result.renewals++;
      const email = s.platform_leads?.contact_email;
      const { brand, sender } = brandFor(s.platform_leads?.business_vertical ?? null);
      const method = s.payment_method ?? "bonifico";

      if (method === "bunq" && email) {
        // Bunq → nuovo link di pagamento il giorno del rinnovo.
        const vertical: TenantVertical = s.platform_leads?.business_vertical ?? "food";
        const contractBrand = vertical === "creative" ? "orpheo" : vertical === "services" ? "bizery" : "menuary";
        const bunq = await createBunqPaymentRequest({
          amountEur: renewal.amount,
          description: `Rinnovo abbonamento ${brand.name} — ${s.platform_leads?.business_name ?? ""}`.trim(),
          counterpartyEmail: email,
          reference: `RNW-${s.id.slice(0, 8)}`,
          redirectUrl: paymentRedirectUrl("processing", contractBrand),
        });
        await attachPaymentProviderRefs(renewal.paymentId, {
          bunqRequestId: bunq.id,
          bunqPaymentUrl: bunq.shareUrl,
        });
        const emailUrl = paymentRedirectUrl("processing", contractBrand) + `&ref=${encodeURIComponent(renewal.paymentId)}`;
        await sendEmail({
          to: email,
          subject: `Rinnovo abbonamento — ${brand.name}`,
          html: payLinkHtml(s.platform_leads?.business_name ?? "", renewal.amount, emailUrl, brand),
          fromOverride: sender.from,
        });
      } else if (method === "carta" || method === "sdd") {
        // Stripe ricorrente: addebito automatico (gestione dedicata futura) → nessun invio.
      } else if (email) {
        // Bonifico / IBAN → sollecito con coordinate.
        await sendEmail({
          to: email,
          subject: `Rinnovo abbonamento — istruzioni di pagamento — ${brand.name}`,
          html: bonificoHtml(s.platform_leads?.business_name ?? "", renewal.amount, brand),
          fromOverride: sender.from,
        });
      }
    } catch (err) {
      result.errors.push(`renewal ${s.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ─── C. Scaduti +15gg → sospensione automatica (tenant offline) ───────────────
  const { data: overdue } = await db
    .from("platform_payments")
    .select("id, subscription_id, platform_subscriptions(status)")
    .eq("status", "pending")
    .lt("due_date", today);

  const toSuspend = new Set<string>();
  for (const p of (overdue ?? []) as unknown as PaymentRow[]) {
    const st = p.platform_subscriptions?.status;
    if (st === "suspended" || st === "cancelled") continue;
    toSuspend.add(p.subscription_id);
  }
  for (const subId of toSuspend) {
    try {
      await suspendSubscription(subId);
      result.suspensions++;
    } catch (err) {
      result.errors.push(`suspend ${subId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, ...result });
}

// ─── Email templates ───────────────────────────────────────────────────────────

type Brand = (typeof PLATFORM_BRANDS)[TenantVertical];

function shell(brand: Brand, title: string, body: string): string {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,system-ui,sans-serif;background:${brand.bg};color:${brand.text}">
<div style="max-width:600px;margin:0 auto;padding:32px 20px">
  <span style="display:inline-block;padding:4px 12px;background:${brand.primary};color:#fff;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase">${brand.name}</span>
  <h2 style="margin-top:20px">${title}</h2>
  ${body}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:11px;color:${brand.muted}">${brand.name} · ${FORNITORE.ragioneSociale}</p>
</div></body></html>`;
}

function reminderHtml(name: string, amount: number, due: string, brand: Brand): string {
  const dueLabel = new Date(due).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  return shell(
    brand,
    "Promemoria pagamento",
    `<p>Gentile ${name || "cliente"},</p>
     <p>ti ricordiamo che il pagamento di <strong>${formatEUR(amount)}</strong> è in scadenza il <strong>${dueLabel}</strong>.</p>
     <p>Riceverai a breve le istruzioni per completarlo, se non l'hai già fatto.</p>`,
  );
}

function payLinkHtml(name: string, amount: number, url: string, brand: Brand): string {
  return shell(
    brand,
    "Rinnovo abbonamento",
    `<p>Gentile ${name || "cliente"},</p>
     <p>è il momento di rinnovare il tuo abbonamento. Importo: <strong>${formatEUR(amount)}</strong>.</p>
     <div style="margin:24px 0;text-align:center">
       <a href="${url}" style="display:inline-block;padding:14px 32px;background:${brand.primary};color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px">Paga ora</a>
     </div>
     <p style="font-size:12px;color:${brand.muted}">Il servizio resta attivo se il pagamento avviene entro 15 giorni.</p>`,
  );
}

function bonificoHtml(name: string, amount: number, brand: Brand): string {
  return shell(
    brand,
    "Rinnovo abbonamento",
    `<p>Gentile ${name || "cliente"},</p>
     <p>per rinnovare il tuo abbonamento effettua un bonifico di <strong>${formatEUR(amount)}</strong>:</p>
     <p style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;font-size:14px">
       Intestatario: <strong>${FORNITORE.ragioneSociale}</strong><br>
       IBAN: <strong>${FORNITORE.iban}</strong><br>
       Causale: rinnovo abbonamento ${name || ""}
     </p>
     <p style="font-size:12px;color:${brand.muted}">Il servizio resta attivo se il pagamento avviene entro 15 giorni.</p>`,
  );
}
