import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/sender";
import { buildMarketingEmail } from "@/lib/email/templates/marketing";
import { resolveSender } from "@/lib/email/sender";
import { parseEmailAddress } from "@/lib/email/inbound-types";
import { detectBrandFromSender } from "@/lib/email/tracking-types";

/**
 * POST /api/email/send
 *
 * Invia un'email singola o multipla tramite Resend.
 * Accessibile a siteadmin (qualsiasi tenant) e tenantadmin (solo il proprio tenant).
 *
 * Body:
 *   to         string | string[]   — destinatari
 *   subject    string              — oggetto
 *   tenantId?  string              — determina mittente e brand (default: piattaforma food)
 *   html?      string              — HTML custom (esclude template)
 *   template?  { title, body, preheader?, cta?, extraSections?, unsubscribeUrl? }
 *   replyTo?   string
 *
 * Futura espansione:
 *   - templateId: string   → ID template salvato su DB
 *   - scheduleAt: string   → ISO date per invio programmato (via cron/queue)
 *   - listId: string       → ID audience Resend per campagne massive
 */

type TemplateInput = {
  title: string;
  body: string;
  preheader?: string;
  cta?: { label: string; url: string };
  extraSections?: string;
  unsubscribeUrl?: string;
};

type RequestBody = {
  to: string | string[];
  subject: string;
  tenantId?: string;
  html?: string;
  template?: TemplateInput;
  replyTo?: string;
  /** Solo siteadmin: sovrascrive mittente automatico. */
  fromOverride?: string;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const { to, subject, tenantId, html, template, replyTo, fromOverride } = body;

  if (!to || !subject) {
    return NextResponse.json({ error: "to e subject sono richiesti." }, { status: 400 });
  }
  if (!html && !template) {
    return NextResponse.json({ error: "Fornire html oppure template." }, { status: 400 });
  }

  // ── Autorizzazione ──────────────────────────────────────────────────────────
  const adminClient = createSupabaseAdminClient();

  const [{ data: sa }, { data: ta }] = await Promise.all([
    adminClient.from("siteadmin").select("id").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    tenantId
      ? adminClient
          .from("tenantadmin")
          .select("id")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .eq("enabled", true)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isSiteAdmin = !!sa;
  const isTenantAdmin = !!ta;

  if (!isSiteAdmin && !isTenantAdmin) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  // fromOverride riservato ai siteadmin
  if (fromOverride && !isSiteAdmin) {
    return NextResponse.json({ error: "fromOverride riservato ai siteadmin." }, { status: 403 });
  }

  // ── Costruzione HTML ────────────────────────────────────────────────────────
  let emailHtml: string;

  if (html) {
    emailHtml = html;
  } else {
    const { brand } = resolveSender(tenantId);
    emailHtml = buildMarketingEmail({ brand, ...template! });
  }

  // ── Invio ───────────────────────────────────────────────────────────────────
  const resolvedSender = resolveSender(tenantId);
  const effectiveFrom = (isSiteAdmin ? fromOverride : undefined) ?? resolvedSender.from;

  const result = await sendEmail({
    to,
    subject,
    html: emailHtml,
    tenantId,
    replyTo,
    fromOverride: isSiteAdmin ? fromOverride : undefined,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  // ── Salva in sent_emails (best-effort, non blocca la risposta) ──────────────
  const svc = createSupabaseServiceClient();
  if (svc && result.messageId) {
    const toList = Array.isArray(to) ? to : [to];
    const { name: fromName, address: fromAddress } = parseEmailAddress(effectiveFrom);
    const brand = detectBrandFromSender(fromAddress);

    void svc.from("sent_emails").insert({
      resend_message_id: result.messageId,
      from_address:      fromAddress,
      from_name:         fromName,
      to_addresses:      toList,
      subject,
      html_body:         emailHtml,
      brand,
      sent_by_user_id:   user.id,
    });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
