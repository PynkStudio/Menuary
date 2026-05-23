"use server";

import { revalidatePath } from "next/cache";
import { authorizeGestione } from "@/lib/gestione-auth";
import {
  adjustMemberPoints,
  deleteEarnRule,
  deleteReward,
  upsertEarnRule,
  upsertProgram,
  upsertReward,
} from "@/lib/fidelity/queries";
import type {
  FidelityEarnKind,
  FidelityExpiryKind,
  FidelityRewardKind,
} from "@/lib/fidelity/types";

const REV = (s: string) => revalidatePath(`/gestione/${s}/fidelity`, "layout");

async function guard(tenantSlug: string) {
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) throw new Error("unauthorized");
  if (auth.isDemo) return { isDemo: true as const };
  return { isDemo: false as const };
}

export async function saveProgram(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  if (!tenantSlug) return;
  const g = await guard(tenantSlug);
  if (g.isDemo) return;

  const expiryKind = String(formData.get("expiry_kind") ?? "days_from_accrual") as FidelityExpiryKind;
  const expiryDaysRaw = String(formData.get("expiry_days") ?? "365");
  const expiryDate = String(formData.get("expiry_custom_date") ?? "").trim() || null;

  await upsertProgram({
    tenant_id: tenantSlug,
    is_active: formData.get("is_active") === "on",
    program_name: String(formData.get("program_name") ?? "Programma Fedeltà").trim(),
    points_label: String(formData.get("points_label") ?? "punti").trim(),
    expiry_kind: expiryKind,
    expiry_days: expiryKind === "days_from_accrual" ? Math.max(1, Number(expiryDaysRaw) || 365) : null,
    expiry_custom_date: expiryKind === "custom_date" ? expiryDate : null,
    optin_text: String(formData.get("optin_text") ?? "").trim(),
    terms_url: String(formData.get("terms_url") ?? "").trim() || null,
  });
  REV(tenantSlug);
}

function parseEarnParams(kind: FidelityEarnKind, fd: FormData): Record<string, unknown> {
  switch (kind) {
    case "signup_bonus":
      return { points: Number(fd.get("points") ?? 0) };
    case "per_euro_spent":
      return {
        points_per_euro: Number(fd.get("points_per_euro") ?? 1),
        min_order: Number(fd.get("min_order") ?? 0),
      };
    case "per_order_count":
      return {
        points_per_order: Number(fd.get("points_per_order") ?? 10),
        min_order: Number(fd.get("min_order") ?? 0),
      };
    case "day_of_week_bonus":
      return {
        weekday: Number(fd.get("weekday") ?? 1),
        multiplier: Number(fd.get("multiplier") ?? 2),
      };
    case "date_range_bonus":
      return {
        from: String(fd.get("from") ?? ""),
        to: String(fd.get("to") ?? ""),
        multiplier: Number(fd.get("multiplier") ?? 2),
      };
  }
}

export async function saveEarnRule(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  if (!tenantSlug) return;
  const g = await guard(tenantSlug);
  if (g.isDemo) return;

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const kind = String(formData.get("kind") ?? "per_euro_spent") as FidelityEarnKind;

  await upsertEarnRule({
    ...(id ? { id } : {}),
    tenant_id: tenantSlug,
    kind,
    label: String(formData.get("label") ?? "").trim() || `Regola ${kind}`,
    params: parseEarnParams(kind, formData),
    priority: Number(formData.get("priority") ?? 100),
    is_active: formData.get("is_active") === "on",
  });
  REV(tenantSlug);
}

export async function removeEarnRule(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;
  const g = await guard(tenantSlug);
  if (g.isDemo) return;
  await deleteEarnRule(id, tenantSlug);
  REV(tenantSlug);
}

function parseRewardPayload(kind: FidelityRewardKind, fd: FormData): Record<string, unknown> {
  switch (kind) {
    case "order_discount_amount":
      return { amount_eur: Number(fd.get("amount_eur") ?? 5) };
    case "free_product":
      return { menu_item_id: String(fd.get("menu_item_id") ?? "").trim() };
    case "external_coupon_code":
      return {
        code_prefix: String(fd.get("code_prefix") ?? "FID").trim() || "FID",
        code_length: Math.max(4, Number(fd.get("code_length") ?? 8)),
      };
    case "category_percent_discount":
      return {
        category_id: String(fd.get("category_id") ?? "").trim(),
        percent: Math.max(1, Math.min(100, Number(fd.get("percent") ?? 20))),
      };
  }
}

export async function saveReward(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  if (!tenantSlug) return;
  const g = await guard(tenantSlug);
  if (g.isDemo) return;

  const id = String(formData.get("id") ?? "").trim() || undefined;
  const kind = String(formData.get("kind") ?? "order_discount_amount") as FidelityRewardKind;
  const stockRaw = String(formData.get("stock") ?? "").trim();

  await upsertReward({
    ...(id ? { id } : {}),
    tenant_id: tenantSlug,
    kind,
    name: String(formData.get("name") ?? "Premio").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    points_cost: Math.max(1, Number(formData.get("points_cost") ?? 100)),
    payload: parseRewardPayload(kind, formData),
    stock: stockRaw === "" ? null : Math.max(0, Number(stockRaw)),
    valid_from: String(formData.get("valid_from") ?? "").trim() || null,
    valid_to: String(formData.get("valid_to") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
    sort_order: Number(formData.get("sort_order") ?? 100),
  });
  REV(tenantSlug);
}

export async function removeReward(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!tenantSlug || !id) return;
  const g = await guard(tenantSlug);
  if (g.isDemo) return;
  await deleteReward(id, tenantSlug);
  REV(tenantSlug);
}

export async function adjustPoints(formData: FormData) {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const memberId = String(formData.get("memberId") ?? "");
  const points = Number(formData.get("points") ?? 0);
  const note = String(formData.get("note") ?? "").trim() || "Aggiustamento manuale";
  if (!tenantSlug || !memberId || !points) return;
  const g = await guard(tenantSlug);
  if (g.isDemo) return;
  await adjustMemberPoints({ tenantId: tenantSlug, memberId, points, note });
  REV(tenantSlug);
}
