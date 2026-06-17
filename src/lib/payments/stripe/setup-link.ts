import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { findTenantById } from "@/lib/tenant-registry";
import { getStripeConnectStateSecret } from "./config";

const SETUP_TTL_SECONDS = 60 * 60 * 24 * 14;

export type TenantSetupModule = "stripe" | "hubrise";

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://menuary.it"
  ).replace(/\/$/, "");
}

function sign(payload: string): string {
  return createHmac("sha256", getStripeConnectStateSecret()).update(payload).digest("hex");
}

export type StripeSetupTokenPayload = {
  tenantId: string;
  email: string | null;
  exp: number;
  modules: TenantSetupModule[];
};

export function buildStripeSetupToken(input: {
  tenantId: string;
  email?: string | null;
  modules?: TenantSetupModule[];
  ttlSeconds?: number;
}): string {
  const exp = Math.floor(Date.now() / 1000) + (input.ttlSeconds ?? SETUP_TTL_SECONDS);
  const nonce = randomBytes(12).toString("hex");
  const email = input.email?.trim().toLowerCase() ?? "";
  const encodedEmail = Buffer.from(email).toString("base64url");
  const modules = (input.modules?.length ? input.modules : ["stripe"]).join(",");
  const encodedModules = Buffer.from(modules).toString("base64url");
  const payload = `${input.tenantId}.${encodedEmail}.${encodedModules}.${nonce}.${exp}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString("base64url");
}

export function parseStripeSetupToken(token: string): {
  valid: boolean;
  reason?: string;
  payload?: StripeSetupTokenPayload;
} {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 5 && parts.length !== 6) return { valid: false, reason: "malformed" };
    const tenantId = parts[0];
    const encodedEmail = parts[1];
    const encodedModules = parts.length === 6 ? parts[2] : Buffer.from("stripe").toString("base64url");
    const nonce = parts.length === 6 ? parts[3] : parts[2];
    const expStr = parts.length === 6 ? parts[4] : parts[3];
    const sig = parts[parts.length - 1];
    const exp = Number(expStr);
    if (!tenantId || !nonce || !Number.isFinite(exp)) {
      return { valid: false, reason: "malformed" };
    }
    if (exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, reason: "expired" };
    }
    const payload = parts.length === 6
      ? `${tenantId}.${encodedEmail}.${encodedModules}.${nonce}.${expStr}`
      : `${tenantId}.${encodedEmail}.${nonce}.${expStr}`;
    const expected = sign(payload);
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: "bad_signature" };
    }
    return {
      valid: true,
      payload: {
        tenantId,
        email: Buffer.from(encodedEmail, "base64url").toString("utf8") || null,
        exp,
        modules: Buffer.from(encodedModules, "base64url")
          .toString("utf8")
          .split(",")
          .filter((item): item is TenantSetupModule => item === "stripe" || item === "hubrise"),
      },
    };
  } catch {
    return { valid: false, reason: "decode_error" };
  }
}

export function buildStripeSetupUrl(input: {
  tenantId: string;
  email?: string | null;
  modules?: TenantSetupModule[];
}): string {
  const token = buildStripeSetupToken(input);
  return `${baseUrl()}/configurazione?token=${encodeURIComponent(token)}`;
}

export function tenantSetupLabel(tenantId: string): string {
  return findTenantById(tenantId)?.name ?? tenantId;
}
