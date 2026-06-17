import "server-only";

import { buildStripeSetupEmail } from "@/lib/email/templates/stripe-setup";
import { resolveSenderForVertical, sendEmail } from "@/lib/email/sender";
import {
  buildStripeSetupUrl,
  tenantSetupLabel,
  type TenantSetupModule,
} from "@/lib/payments/stripe/setup-link";
import type { TenantVertical } from "@/lib/tenant";

export async function sendTenantSetupEmail(input: {
  tenantId: string;
  tenantName?: string | null;
  email: string;
  vertical: TenantVertical;
  modules?: TenantSetupModule[];
}): Promise<{ ok: true; messageId: string; setupUrl: string } | { ok: false; error: string; setupUrl?: string }> {
  const modules = input.modules?.length ? input.modules : ["stripe"];
  const setupUrl = buildStripeSetupUrl({
    tenantId: input.tenantId,
    email: input.email,
    modules,
  });
  const { brand } = resolveSenderForVertical(input.vertical);
  const tenantName = input.tenantName || tenantSetupLabel(input.tenantId);
  const moduleLabels = modules.map((module) => module === "stripe" ? "Stripe" : "HubRise");
  const subject = moduleLabels.length === 1
    ? `Configura ${moduleLabels[0]} per ${tenantName}`
    : `Completa la configurazione di ${tenantName}`;
  const result = await sendEmail({
    to: input.email,
    tenantId: input.tenantId,
    subject,
    html: buildStripeSetupEmail({ brand, tenantName, setupUrl, modules }),
  });
  if (!result.ok) return { ok: false, error: result.error, setupUrl };
  return { ok: true, messageId: result.messageId, setupUrl };
}
