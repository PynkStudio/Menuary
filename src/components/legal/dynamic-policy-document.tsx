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
  } = useEffectiveFeatures();
  const tenant = useTenantOrNull();
  const content = tenant ? getTenantContent(tenant.id) : null;
  const controller = useMemo(
    () =>
      content
        ? {
            name: tenant?.name ?? "",
            address: content.address.full,
            phone: content.contact.phone,
          }
        : undefined,
    [content, tenant?.name],
  );

  const flags: PolicyModuleFlags = useMemo(
    () => ({
      allowTakeaway,
      allowTableOrders,
      dinerSeparationAtTables,
      kitchenDisplayEnabled,
    }),
    [
      allowTakeaway,
      allowTableOrders,
      dinerSeparationAtTables,
      kitchenDisplayEnabled,
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
