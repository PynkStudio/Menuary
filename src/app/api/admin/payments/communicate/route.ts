import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createBunqPaymentRequest } from "@/lib/payments/bunq/payment-requests";
import { pynkCheckoutUrl, pynkPaymentUrl } from "@/lib/payments/payment-urls";
import { stripeRequest } from "@/lib/payments/stripe/client";
import { attachPaymentProviderRefs } from "@/lib/platform/subscription-service";
import { PLATFORM_BRANDS, resolveSenderForVertical, sendEmail } from "@/lib/email/sender";
import { FORNITORE, formatEUR } from "@/lib/contracts/menuary-contract";
import type { TenantVertical } from "@/lib/tenant";

type PaymentRow = {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  kind: "first" | "renewal";
  payment_method: string | null;
  invoice_number: string | null;
  due_date: string | null;
  stripe_payment_link: string | null;
  bunq_payment_url: string | null;
};

type StripeSession = { id: string; url: string | null };

async function requireSiteAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: admin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(admin?.role) && hasAdminPermission(admin.role, "crm:create");
}

export async function POST(req: NextRequest) {
  if (!(await requireSiteAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const paymentId = body?.paymentId as string | undefined;
  const send = body?.send !== false;
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId obbligatorio" }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  if (!db) {
    return NextResponse.json({ error: "Servizio non configurato" }, { status: 503 });
  }

  const { data: paymentData } = await db
    .from("platform_payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  const payment = paymentData as unknown as PaymentRow | null;
  if (!payment || payment.status !== "pending") {
    return NextResponse.json({ error: "Pagamento pending non trovato" }, { status: 404 });
  }

  const { data: subscription } = await db
    .from("platform_subscriptions")
    .select("id, lead_id, contract_id, payment_method")
    .eq("id", payment.subscription_id)
    .maybeSingle();
  const { data: lead } = subscription?.lead_id
    ? await db
        .from("platform_leads")
        .select("business_name, contact_email, business_vertical")
        .eq("id", subscription.lead_id)
        .maybeSingle()
    : { data: null };
  const { data: contract } = subscription?.contract_id
    ? await db
        .from("platform_contracts")
        .select("contract_data, brand")
        .eq("id", subscription.contract_id)
        .maybeSingle()
    : { data: null };
  const contractData = contract?.contract_data as
    | {
        cliente?: { email?: string; pec?: string };
      }
    | null;

  const recipient =
    (lead?.contact_email as string | null) ??
    contractData?.cliente?.email ??
    contractData?.cliente?.pec ??
    null;
  const vertical = (
    lead?.business_vertical ??
    (contract?.brand === "orpheo"
      ? "creative"
      : contract?.brand === "bizery"
        ? "services"
        : "food")
  ) as TenantVertical;
  const brand = PLATFORM_BRANDS[vertical];
  const sender = resolveSenderForVertical(vertical);
  const method = payment.payment_method ?? subscription?.payment_method ?? "bonifico";
  const description = `${
    payment.kind === "renewal" ? "Rinnovo abbonamento" : "Primo pagamento"
  } ${brand.name} — ${lead?.business_name ?? ""}`.trim();

  let url = payment.bunq_payment_url ?? payment.stripe_payment_link;
  if (!url && method === "bunq") {
    if (!recipient) {
      return NextResponse.json({ error: "Email cliente mancante" }, { status: 409 });
    }
    const bunqRef = payment.invoice_number ?? `PAY-${payment.id.slice(0, 8)}`;
    const bunq = await createBunqPaymentRequest({
      amountEur: Number(payment.amount),
      description,
      counterpartyEmail: recipient,
      reference: bunqRef,
      redirectUrl: pynkPaymentUrl("success", bunqRef),
    });
    url = bunq.shareUrl;
    await attachPaymentProviderRefs(payment.id, {
      bunqRequestId: bunq.id,
      bunqPaymentUrl: bunq.shareUrl,
    });
  } else if (!url && method === "carta") {
    const session = await stripeRequest<StripeSession>("/checkout/sessions", {
      method: "POST",
      body: {
        mode: "payment",
        "payment_method_types[0]": "card",
        customer_email: recipient ?? undefined,
        success_url: pynkPaymentUrl("success", payment.invoice_number ?? payment.id),
        cancel_url: pynkPaymentUrl("cancelled", payment.invoice_number ?? payment.id),
        metadata: {
          payment_id: payment.id,
          subscription_id: payment.subscription_id,
          source: "platform_payment",
        },
        "line_items[0]": {
          quantity: 1,
          price_data: {
            currency: payment.currency.toLowerCase(),
            unit_amount: Math.round(Number(payment.amount) * 100),
            product_data: { name: description },
          },
        },
      },
    });
    if (!session.url) {
      return NextResponse.json({ error: "Stripe non ha restituito il link" }, { status: 502 });
    }
    url = session.url;
    await attachPaymentProviderRefs(payment.id, { stripePaymentLink: url });
  }

  if (send) {
    if (!recipient) {
      return NextResponse.json({ error: "Email cliente mancante" }, { status: 409 });
    }
    const paymentRef = payment.invoice_number ?? payment.id;
    const checkoutUrl = method === "bonifico" ? null : pynkCheckoutUrl(paymentRef);
    const result = await sendEmail({
      to: recipient,
      subject: `${payment.kind === "renewal" ? "Rinnovo" : "Pagamento"} — ${brand.name}`,
      html: buildPaymentEmail(
        lead?.business_name ?? "",
        Number(payment.amount),
        payment.due_date,
        checkoutUrl,
        brand,
      ),
      fromOverride: sender.from,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
  }

  return NextResponse.json({ sent: send, url, method });
}

function buildPaymentEmail(
  businessName: string,
  amount: number,
  dueDate: string | null,
  url: string | null,
  brand: (typeof PLATFORM_BRANDS)[TenantVertical],
) {
  const action = url
    ? `<p><a href="${url}" style="display:inline-block;padding:12px 20px;background:${brand.primary};color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Procedi al pagamento</a></p>`
    : `<p>Effettui il bonifico di <strong>${formatEUR(amount)}</strong> sul conto IBAN <strong>${FORNITORE.iban}</strong>.</p>`;
  return `<!DOCTYPE html><html lang="it"><body style="font-family:-apple-system,system-ui,sans-serif">
    <h2>Pagamento ${brand.name}</h2>
    <p>Gentile ${businessName || "cliente"}, è in attesa un pagamento di <strong>${formatEUR(amount)}</strong>${dueDate ? ` con scadenza ${new Date(dueDate).toLocaleDateString("it-IT")}` : ""}.</p>
    ${action}
    <p style="font-size:12px;color:${brand.muted}">${brand.name} · ${FORNITORE.ragioneSociale}</p>
  </body></html>`;
}
