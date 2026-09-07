"use client";

import { useMemo } from "react";
import {
  buildCookieSections,
  buildPrivacySections,
  type PolicyModuleFlags,
} from "@/lib/legal/policies";
import { PolicySectionsView } from "@/components/legal/policy-sections-view";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useTenantOrNull } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { getTenantLocaleConfig } from "@/lib/tenant-locales";

export function DynamicPolicyDocument({
  variant,
}: {
  variant: "privacy" | "cookie";
}) {
  const {
    allowTakeaway,
    allowTableOrders,
    dinerSeparationAtTables,
    kitchenDisplayEnabled,
    aiPhoneEnabled,
    aiWhatsappEnabled,
    upsellingEnabled,
    modules,
  } = useEffectiveFeatures();
  const tenant = useTenantOrNull();
  const content = tenant ? getTenantContent(tenant.id) : null;
  const controller = useMemo(
    () =>
      content
        ? content.legal ?? {
            name: tenant?.name ?? "",
            address: content.address.full,
            phone: content.contact.phone,
          }
        : undefined,
    [content, tenant?.name],
  );

  // Il sito ricorda la lingua solo se ne pubblica più di una: senza, quella riga
  // dell'informativa descriverebbe un cookie che nessuno scrive.
  const localeCookie = (getTenantLocaleConfig(tenant?.id ?? "")?.locales.length ?? 0) > 1;

  const flags: PolicyModuleFlags = useMemo(
    () => ({
      allowTakeaway,
      allowTableOrders,
      dinerSeparationAtTables,
      kitchenDisplayEnabled,
      aiPhoneEnabled,
      aiWhatsappEnabled,
      upsellingEnabled,
      modules,
      localeCookie,
    }),
    [
      allowTakeaway,
      allowTableOrders,
      dinerSeparationAtTables,
      kitchenDisplayEnabled,
      aiPhoneEnabled,
      aiWhatsappEnabled,
      upsellingEnabled,
      localeCookie,
      modules,
    ],
  );

  const sections = useMemo(
    () =>
      variant === "privacy"
        ? buildPrivacySections(flags, controller)
        : buildCookieSections(flags),
    [variant, flags, controller],
  );

  return <PolicySectionsView sections={sections} />;
}
