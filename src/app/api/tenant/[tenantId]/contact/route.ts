import { NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { getTenantContent } from "@/lib/tenant-content";
import { sendEmail } from "@/lib/email/sender";

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

  let body: { name?: string; email?: string; subject?: string; message?: string };
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

  const content = getTenantContent(tenantId);
  const recipient = content.contact.email?.trim();
  if (!recipient) return NextResponse.json({ error: "Destinatario non configurato." }, { status: 500 });

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

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true });
}
