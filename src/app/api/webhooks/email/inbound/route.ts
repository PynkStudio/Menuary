import "@/lib/mailapp-runtime";

import { NextRequest, NextResponse } from "next/server";
import { POST as mailappInboundPOST } from "@pynkstudio/mailapp/next/routes/inbound-webhook";

import { TENANTS } from "@/lib/tenant-registry";

const PLATFORM_MAIL_DOMAINS = [
  "menuary.it",
  "bizery.it",
  "weuseorpheo.com",
  "pynkstudio.it",
  "pynkstudio.com",
  "pynkstudio.eu",
];

function isPublicMailDomain(domain: string): boolean {
  return (
    domain !== "127.0.0.1" &&
    !domain.includes("localhost") &&
    !domain.endsWith(".local")
  );
}

function normalizeDomain(domain: string): string | null {
  const normalized = domain.trim().toLowerCase().replace(/\.$/, "");
  if (!normalized || !isPublicMailDomain(normalized)) return null;
  return normalized.startsWith("www.") ? normalized.slice(4) : normalized;
}

function allowedInboundDomains(): Set<string> {
  const domains = new Set<string>();

  for (const domain of PLATFORM_MAIL_DOMAINS) {
    const normalized = normalizeDomain(domain);
    if (normalized) domains.add(normalized);
  }

  for (const tenant of TENANTS) {
    for (const domain of tenant.domains ?? []) {
      const normalized = normalizeDomain(domain);
      if (normalized) domains.add(normalized);
    }
  }

  return domains;
}

function extractAddressDomain(raw: string): string | null {
  const match = raw.match(/<([^>]+)>/);
  const address = (match?.[1] ?? raw).trim().toLowerCase();
  const domain = address.split("@")[1];
  return domain ? normalizeDomain(domain) : null;
}

function extractInboundRecipients(event: Record<string, unknown>): string[] {
  const source =
    event.type === "email.received" && event.data && typeof event.data === "object"
      ? (event.data as Record<string, unknown>)
      : event;
  const to = source.to;
  if (Array.isArray(to)) return to.filter((value): value is string => typeof value === "string");
  return typeof to === "string" ? [to] : [];
}

function isAllowedInboundEvent(event: Record<string, unknown>): boolean {
  const recipients = extractInboundRecipients(event);
  if (recipients.length === 0) return true;

  const allowed = allowedInboundDomains();
  return recipients.some((recipient) => {
    const domain = extractAddressDomain(recipient);
    return domain ? allowed.has(domain) : false;
  });
}

function forwardToMailapp(req: NextRequest, rawBody: string) {
  return mailappInboundPOST(new NextRequest(req.url, {
    method: req.method,
    headers: req.headers,
    body: rawBody,
  }));
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return forwardToMailapp(req, rawBody);
  }

  const event = parsed as Record<string, unknown>;
  const eventType = typeof event.type === "string" ? event.type : undefined;
  const isInboundEvent = !eventType || eventType === "email.received";

  if (isInboundEvent && !isAllowedInboundEvent(event)) {
    return NextResponse.json({ ok: true, ignored: true, reason: "recipient_domain_not_allowed" });
  }

  return forwardToMailapp(req, rawBody);
}
