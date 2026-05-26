import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentSiteadmin, supportSenderForTicket, type SupportTicketRow } from "@/lib/support/admin";
import { sendEmail } from "@/lib/email/sender";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function fetchTicket(ticketId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await (admin as unknown as {
    from: (table: "support_tickets") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: SupportTicketRow | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("support_tickets")
    .select("id,tenant_id,source,requester_phone_e164,requester_email,requester_name,subject,body,status,priority,assigned_to_siteadmin_id,metadata,created_at,updated_at,last_response_at,resolved_at")
    .eq("id", ticketId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const siteadmin = await getCurrentSiteadmin();
  if (!siteadmin) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { ticketId } = await params;
  const body = await request.json().catch(() => ({})) as {
    status?: string;
    priority?: string;
    assigned_to_siteadmin_id?: string | null;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status) {
    patch.status = body.status;
    if (body.status === "resolved" || body.status === "closed") patch.resolved_at = new Date().toISOString();
    if (body.status !== "resolved" && body.status !== "closed") patch.resolved_at = null;
  }
  if (body.priority) patch.priority = body.priority;
  if (Object.prototype.hasOwnProperty.call(body, "assigned_to_siteadmin_id")) {
    patch.assigned_to_siteadmin_id = body.assigned_to_siteadmin_id;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await (admin as unknown as {
    from: (table: "support_tickets") => {
      update: (row: Record<string, unknown>) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => {
            single: () => Promise<{ data: SupportTicketRow | null; error: { message: string } | null }>;
          };
        };
      };
    };
  })
    .from("support_tickets")
    .update(patch)
    .eq("id", ticketId)
    .select("id,tenant_id,source,requester_phone_e164,requester_email,requester_name,subject,body,status,priority,assigned_to_siteadmin_id,metadata,created_at,updated_at,last_response_at,resolved_at")
    .single();

  if (error || !data) return NextResponse.json({ error: error?.message ?? "Ticket non trovato." }, { status: 404 });
  return NextResponse.json({ ticket: data });
}

export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const siteadmin = await getCurrentSiteadmin();
  if (!siteadmin) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const { ticketId } = await params;
  const body = await request.json().catch(() => ({})) as { body?: string; internal?: boolean };
  const text = body.body?.trim() ?? "";
  if (!text) return NextResponse.json({ error: "Testo risposta mancante." }, { status: 400 });

  const ticket = await fetchTicket(ticketId);
  if (!ticket) return NextResponse.json({ error: "Ticket non trovato." }, { status: 404 });

  let providerMessageId: string | null = null;
  const isInternal = body.internal || !ticket.requester_email;
  if (!isInternal && ticket.requester_email) {
    const html = `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111827">
        <p>${escapeHtml(text).replace(/\n/g, "<br />")}</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="font-size:12px;color:#6b7280">Ticket ${ticket.id}</p>
      </div>
    `;
    const result = await sendEmail({
      to: ticket.requester_email,
      subject: ticket.subject.startsWith("Re:") ? ticket.subject : `Re: ${ticket.subject || "Richiesta supporto"}`,
      html,
      tenantId: ticket.tenant_id ?? undefined,
      fromOverride: supportSenderForTicket(ticket),
      replyTo: supportSenderForTicket(ticket).match(/<(.+)>/)?.[1],
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
    providerMessageId = result.messageId;
  }

  const admin = createSupabaseAdminClient();
  const { data: message, error: msgError } = await (admin as unknown as {
    from: (table: "support_ticket_messages") => {
      insert: (row: Record<string, unknown>) => {
        select: (columns: string) => {
          single: () => Promise<{ data: unknown | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("support_ticket_messages")
    .insert({
      ticket_id: ticket.id,
      direction: isInternal ? "internal" : "outbound",
      channel: isInternal ? "admin" : "email",
      from_address: isInternal ? siteadmin.email : supportSenderForTicket(ticket),
      to_addresses: ticket.requester_email && !isInternal ? [ticket.requester_email] : [],
      body: text,
      sent_by_siteadmin_id: siteadmin.id,
      provider_message_id: providerMessageId,
    })
    .select("id,ticket_id,direction,channel,from_address,to_addresses,body,html_body,sent_by_siteadmin_id,provider_message_id,metadata,created_at")
    .single();

  if (msgError || !message) return NextResponse.json({ error: msgError?.message ?? "Messaggio non salvato." }, { status: 500 });

  const nextStatus = isInternal ? ticket.status : "waiting_customer";
  const { data: updatedTicket, error: ticketError } = await (admin as unknown as {
    from: (table: "support_tickets") => {
      update: (row: Record<string, unknown>) => {
        eq: (column: string, value: string) => {
          select: (columns: string) => {
            single: () => Promise<{ data: SupportTicketRow | null; error: { message: string } | null }>;
          };
        };
      };
    };
  })
    .from("support_tickets")
    .update({
      status: nextStatus,
      last_response_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticket.id)
    .select("id,tenant_id,source,requester_phone_e164,requester_email,requester_name,subject,body,status,priority,assigned_to_siteadmin_id,metadata,created_at,updated_at,last_response_at,resolved_at")
    .single();

  if (ticketError || !updatedTicket) return NextResponse.json({ error: ticketError?.message ?? "Ticket non aggiornato." }, { status: 500 });
  return NextResponse.json({ ticket: updatedTicket, message });
}
