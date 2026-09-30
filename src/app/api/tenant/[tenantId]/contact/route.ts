import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { getTenantContent } from "@/lib/tenant-content";
import { sendEmail } from "@/lib/email/sender";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { sendWebPush } from "@/lib/push/send";
import { cleanAttribution, cleanList, recordCrmTouch } from "@/lib/pynkstudio/crm";
import { sourceLabel } from "@/lib/pynkstudio/crm-shared";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const tenant = findTenantById(tenantId);
  if (!tenant) return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });

  let body: {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
    // Facoltativi, usati solo dal CRM PynkStudio.
    phone?: string;
    company?: string;
    source?: string;
    employees?: string;
    industry?: string;
    interests?: string[];
    timing?: string;
    plan?: string;
    attribution?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Nome, email e messaggio sono obbligatori." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email non valida." }, { status: 400 });
  }

  const leadSaved =
    tenantId === "pynkstudio"
      ? await savePynkstudioLead({
          name,
          email,
          subject,
          message,
          phone: (body.phone ?? "").trim().slice(0, 40),
          company: (body.company ?? "").trim().slice(0, 160),
          source: (body.source ?? "").trim().slice(0, 40) || "contact-form",
          employees: (body.employees ?? "").toString().trim().slice(0, 40),
          industry: (body.industry ?? "").trim().slice(0, 120),
          interests: cleanList(body.interests),
          timing: (body.timing ?? "").trim().slice(0, 60),
          plan: (body.plan ?? "").trim().slice(0, 120),
          attribution: cleanAttribution(body.attribution),
        })
      : false;

  const content = getTenantContent(tenantId);
  const recipient = content.contact.email?.trim();
  if (!recipient) {
    if (leadSaved) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "Destinatario non configurato." }, { status: 500 });
  }

  const result = await sendEmail({
    tenantId,
    to: recipient,
    replyTo: email,
    subject: `[${tenant.name}] ${subject || "Nuovo messaggio dal sito"}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;color:#17111f;line-height:1.55">
        <h1 style="font-size:22px;margin:0 0 12px">Nuovo messaggio dal sito</h1>
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${subject ? `<p><strong>Oggetto:</strong> ${escapeHtml(subject)}</p>` : ""}
        <div style="margin-top:18px;padding:16px;border:1px solid #e5dfd3;background:#fbfaf7">
          ${escapeHtml(message).replaceAll("\n", "<br />")}
        </div>
      </div>
    `,
  });

  // Se il lead è già nel CRM la richiesta non è persa: l'email è solo un avviso.
  if (!result.ok && !leadSaved) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}

type PynkLead = {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone: string;
  company: string;
  source: string;
  employees: string;
  industry: string;
  interests: string[];
  timing: string;
  plan: string;
  attribution: ReturnType<typeof cleanAttribution>;
};

/**
 * Registra la richiesta nel CRM di PynkStudio (admin → CRM) e avvisa l'admin via push.
 * Best-effort: un errore qui non blocca l'invio dell'email.
 */
async function savePynkstudioLead(lead: PynkLead): Promise<boolean> {
  const svc = createSupabaseServiceClient();
  if (!svc) return false;

  const unsubscribe = lead.source === "unsubscribe";
  try {
    await recordCrmTouch(svc, {
      kind: unsubscribe ? "unsubscribe" : "form",
      source: lead.source,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      employees: lead.employees,
      industry: lead.industry,
      interests: lead.interests,
      timing: lead.timing,
      plan: lead.plan,
      attribution: lead.attribution,
      title: unsubscribe ? "Richiesta di disiscrizione" : `${sourceLabel(lead.source)}${lead.subject ? ` · ${lead.subject}` : ""}`,
      body: lead.message.slice(0, 4000),
    });
  } catch (e) {
    console.warn("[contact] crm pynkstudio fallito:", e);
    return false;
  }

  try {
    await sendWebPush("pynkstudio", {
      title: unsubscribe ? "Richiesta di disiscrizione" : "Nuova richiesta dal sito",
      body: `${lead.name}${lead.company ? ` (${lead.company})` : ""} — ${lead.subject || lead.source}`,
      url: "/admin-pynkstudio/crm",
      tag: `lead-${lead.email.toLowerCase()}`,
    });
  } catch (e) {
    console.warn("[contact] push admin fallita:", e);
  }
  return true;
}
