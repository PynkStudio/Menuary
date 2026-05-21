"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseEmailAddress, type InboundEmail, type InboundEmailBrand, type ResendInboundAttachment, type ResendInboundHeader } from "./inbound-types";

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

// ─── Hydration contenuto Resend ───────────────────────────────────────────────

type ResendReceivedEmail = {
  id?: string;
  created_at?: string;
  from?: string;
  subject?: string;
  html?: string | null;
  text?: string | null;
  headers?: ResendInboundHeader[] | Record<string, string>;
  message_id?: string | null;
  attachments?: ResendInboundAttachment[];
};

type ResendListResponse = {
  data?: ResendReceivedEmail[];
};

type ResendAttachmentListResponse = {
  data?: ResendInboundAttachment[];
};

function normalizeHeaders(raw: unknown): ResendInboundHeader[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ResendInboundHeader[];
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, string>).map(([name, value]) => ({ name, value }));
  }
  return [];
}

async function fetchResendJson<T>(path: string): Promise<T | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) return null;
  return (await res.json()) as T;
}

async function fetchAttachmentContent(downloadUrl: string): Promise<string | null> {
  const res = await fetch(downloadUrl);
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString("base64");
}

async function findReceivedEmailId(email: InboundEmail): Promise<string | null> {
  const list = await fetchResendJson<ResendListResponse>("/emails/receiving");
  if (!list?.data?.length) return null;

  const matchByMessageId = email.message_id
    ? list.data.find((item) => item.message_id === email.message_id)
    : null;
  if (matchByMessageId?.id) return matchByMessageId.id;

  const createdAt = new Date(email.created_at).getTime();
  const match = list.data.find((item) => {
    const fromAddress = item.from ? parseEmailAddress(item.from).address.toLowerCase() : "";
    const itemCreatedAt = "created_at" in item && typeof item.created_at === "string"
      ? new Date(item.created_at).getTime()
      : createdAt;
    const isCloseInTime = Math.abs(itemCreatedAt - createdAt) < 7 * 24 * 60 * 60 * 1000;
    return (
      fromAddress === email.from_address.toLowerCase() &&
      item.subject === email.subject &&
      isCloseInTime
    );
  });
  return match?.id ?? null;
}

async function fetchReceivedAttachments(emailId: string): Promise<ResendInboundAttachment[]> {
  const list = await fetchResendJson<ResendAttachmentListResponse>(
    `/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
  );

  return Promise.all(
    (list?.data ?? []).map(async (attachment) => {
      if (!attachment.download_url) return attachment;
      const content = await fetchAttachmentContent(attachment.download_url).catch(() => null);
      return content ? { ...attachment, content } : attachment;
    }),
  );
}

export async function hydrateInboundEmailContent(id: string): Promise<InboundEmail | null> {
  const email = await getInboundEmailById(id);
  if (!email) return null;

  const needsBody = !email.html_body && !email.text_body;
  const needsAttachments = email.attachments.some((attachment) => !attachment.content);
  if (!needsBody && !needsAttachments) return email;

  const resendEmailId = await findReceivedEmailId(email);
  if (!resendEmailId) return email;

  const received = await fetchResendJson<ResendReceivedEmail>(
    `/emails/receiving/${encodeURIComponent(resendEmailId)}`,
  );
  if (!received) return email;

  const attachments = needsAttachments
    ? await fetchReceivedAttachments(resendEmailId)
    : email.attachments;

  const update = {
    html_body: received.html ?? email.html_body,
    text_body: received.text ?? email.text_body,
    headers: normalizeHeaders(received.headers ?? email.headers) as unknown as never,
    attachments: attachments as unknown as never,
  };

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("inbound_emails")
    .update(update)
    .eq("id", id)
    .select("*")
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
