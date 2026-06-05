import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

export type SupportTicketStatus =
  | "open"
  | "triage"
  | "waiting_customer"
  | "in_progress"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export type SupportTicketSource = "whatsapp_customer_service" | "email" | "admin" | "gestione";

export type SupportTicketRow = {
  id: string;
  tenant_id: string | null;
  source: SupportTicketSource;
  requester_phone_e164: string | null;
  requester_email: string | null;
  requester_name: string | null;
  subject: string;
  body: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assigned_to_siteadmin_id: string | null;
  metadata: Database["public"]["Tables"]["inbound_emails"]["Row"]["headers"];
  created_at: string;
  updated_at: string;
  last_response_at: string | null;
  resolved_at: string | null;
};

export type SupportTicketMessageRow = {
  id: string;
  ticket_id: string;
  direction: "inbound" | "outbound" | "internal";
  channel: "email" | "whatsapp" | "admin";
  from_address: string | null;
  to_addresses: string[];
  body: string;
  html_body: string | null;
  sent_by_siteadmin_id: string | null;
  provider_message_id: string | null;
  metadata: Database["public"]["Tables"]["inbound_emails"]["Row"]["headers"];
  created_at: string;
};

type Siteadmin = {
  id: string;
  role: string;
  email: string | null;
  display_name: string | null;
};

export async function getCurrentSiteadmin(): Promise<Siteadmin | null> {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("siteadmin")
    .select("id, role, email, display_name")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  return (data as Siteadmin | null) ?? null;
}

export async function listSupportTickets() {
  const admin = createSupabaseAdminClient();
  const columns = "id,tenant_id,source,requester_phone_e164,requester_email,requester_name,subject,body,status,priority,assigned_to_siteadmin_id,metadata,created_at,updated_at,last_response_at,resolved_at";
  const { data, error } = await (admin as unknown as {
    from: (table: "support_tickets") => {
      select: (columns: string) => {
        order: (column: string, options: { ascending: boolean }) => Promise<{ data: SupportTicketRow[] | null; error: { message: string } | null }>;
      };
    };
  })
    .from("support_tickets")
    .select(columns)
    .order("updated_at", { ascending: false });

  if (error && /requester_email|last_response_at|resolved_at/.test(error.message)) {
    const fallback = await (admin as unknown as {
      from: (table: "support_tickets") => {
        select: (columns: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{ data: Array<Omit<SupportTicketRow, "requester_email" | "last_response_at" | "resolved_at">> | null; error: { message: string } | null }>;
        };
      };
    })
      .from("support_tickets")
      .select("id,tenant_id,source,requester_phone_e164,requester_name,subject,body,status,priority,assigned_to_siteadmin_id,metadata,created_at,updated_at")
      .order("updated_at", { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data ?? []).map((ticket) => ({
      ...ticket,
      requester_email: typeof (ticket.metadata as Record<string, unknown> | null)?.requesterEmail === "string"
        ? (ticket.metadata as Record<string, string>).requesterEmail
        : null,
      last_response_at: null,
      resolved_at: null,
    }));
  }
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listSupportTicketMessages(ticketIds: string[]) {
  if (ticketIds.length === 0) return [];
  const admin = createSupabaseAdminClient();
  const { data, error } = await (admin as unknown as {
    from: (table: "support_ticket_messages") => {
      select: (columns: string) => {
        in: (column: string, values: string[]) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{ data: SupportTicketMessageRow[] | null; error: { message: string } | null }>;
        };
      };
    };
  })
    .from("support_ticket_messages")
    .select("id,ticket_id,direction,channel,from_address,to_addresses,body,html_body,sent_by_siteadmin_id,provider_message_id,metadata,created_at")
    .in("ticket_id", ticketIds)
    .order("created_at", { ascending: true });

  if (error && /support_ticket_messages/.test(error.message)) return [];
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function supportSenderForTicket(ticket: Pick<SupportTicketRow, "source" | "metadata">): string {
  const metadata = ticket.metadata && typeof ticket.metadata === "object" && !Array.isArray(ticket.metadata)
    ? ticket.metadata as Record<string, unknown>
    : {};
  const toAddresses = Array.isArray(metadata.toAddresses) ? metadata.toAddresses : [];
  const firstSupport = toAddresses
    .map((value) => String(value).toLowerCase())
    .find((address) => address.includes("support@bizery.it") || address.includes("support@menuary.it"));
  return firstSupport?.includes("bizery.it") ? "Bizery Support <support@bizery.it>" : "Menuary Support <support@menuary.it>";
}
