"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { InboundEmailBrand } from "./inbound-types";

export type EmailSignature = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  brand: InboundEmailBrand;
  name: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  html: string;
};

export type SignatureInput = Omit<EmailSignature, "id" | "created_at" | "updated_at">;

export async function getSignature(
  userId: string,
  brand: InboundEmailBrand,
): Promise<EmailSignature | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("email_signatures")
    .select("*")
    .eq("user_id", userId)
    .eq("brand", brand)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as unknown as EmailSignature | null;
}

export async function upsertSignature(input: SignatureInput): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("email_signatures").upsert(
    { ...input, updated_at: new Date().toISOString() },
    { onConflict: "user_id,brand" },
  );
  if (error) throw new Error(error.message);
}

/** Genera l'HTML della firma dai campi strutturati. */
export function buildSignatureHtml(sig: Omit<SignatureInput, "user_id" | "brand" | "html">): string {
  const parts: string[] = [];
  if (sig.name)    parts.push(`<strong>${sig.name}</strong>`);
  if (sig.title)   parts.push(`<span style="color:#666">${sig.title}</span>`);
  if (sig.phone)   parts.push(`Tel: <a href="tel:${sig.phone}">${sig.phone}</a>`);
  if (sig.email)   parts.push(`<a href="mailto:${sig.email}">${sig.email}</a>`);
  if (sig.website) parts.push(`<a href="${sig.website}">${sig.website.replace(/^https?:\/\//, "")}</a>`);
  return parts.join("<br>");
}
