"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { InboundEmail, InboundEmailBrand } from "./inbound-types";

const PAGE_SIZE = 30;

export type InboxFilter = {
  brand?: InboundEmailBrand | "all";
  onlyUnread?: boolean;
  onlyStarred?: boolean;
  archived?: boolean;
  page?: number;
};

export type InboxPage = {
  emails: InboundEmail[];
  total: number;
  page: number;
  pageSize: number;
};

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getInboundEmails(filter: InboxFilter = {}): Promise<InboxPage> {
  const admin = createSupabaseAdminClient();
  const page = filter.page ?? 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = admin
    .from("inbound_emails")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filter.brand && filter.brand !== "all") query = query.eq("brand", filter.brand);
  if (filter.onlyUnread) query = query.eq("read", false);
  if (filter.onlyStarred) query = query.eq("starred", true);

  // Di default esclude archiviate, salvo quando si richiede esplicitamente
  query = query.eq("archived", filter.archived ?? false);

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  return {
    emails: (data ?? []) as unknown as InboundEmail[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

// ─── Contatori badge ──────────────────────────────────────────────────────────

export type InboxCounts = {
  unread_menuary: number;
  unread_bizery: number;
  unread_total: number;
};

export async function getInboxUnreadCounts(): Promise<InboxCounts> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("inbound_emails")
    .select("brand", { count: "exact" })
    .eq("read", false)
    .eq("archived", false);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as { brand: string }[];
  const unread_menuary = rows.filter((r) => r.brand === "menuary").length;
  const unread_bizery  = rows.filter((r) => r.brand === "bizery").length;

  return { unread_menuary, unread_bizery, unread_total: unread_menuary + unread_bizery };
}

// ─── Single email ─────────────────────────────────────────────────────────────

export async function getInboundEmailById(id: string): Promise<InboundEmail | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("inbound_emails")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as unknown as InboundEmail | null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function markEmailRead(id: string, read: boolean): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("inbound_emails")
    .update({ read })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function starEmail(id: string, starred: boolean): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("inbound_emails")
    .update({ starred })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function archiveEmail(id: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("inbound_emails")
    .update({ archived: true, read: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteEmail(id: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("inbound_emails")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
