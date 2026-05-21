"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { InboundEmailBrand } from "./inbound-types";

const PAGE_SIZE = 30;

export type SentEmail = {
  id: string;
  created_at: string;
  resend_message_id: string | null;
  from_address: string;
  from_name: string | null;
  to_addresses: string[];
  subject: string;
  html_body: string | null;
  brand: InboundEmailBrand;
  sent_by_user_id: string | null;
  sent_by_name: string | null;
  status: "sent" | "delivered" | "delivery_delayed" | "bounced" | "complained";
  lead_id: string | null;
};

export type SentPage = {
  emails: SentEmail[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getSentEmails(
  brand?: InboundEmailBrand | "all" | "support",
  page = 1,
): Promise<SentPage> {
  const admin = createSupabaseAdminClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = admin
    .from("sent_emails")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (brand === "support") {
    query = query.in("from_address", ["support@menuary.it", "support@bizery.it"]);
  } else if (brand && brand !== "all") {
    query = query.eq("brand", brand);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  return {
    emails: (data ?? []) as unknown as SentEmail[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export async function getSentEmailById(id: string): Promise<SentEmail | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("sent_emails")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as SentEmail | null;
}
