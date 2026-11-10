"use client";

import { Suspense } from "react";
import { useTenant } from "@/components/core/tenant-provider";
import { KimosComponiPage } from "@/components/tenants/kimos/pages/componi";
import { DishBuilderPage } from "@/components/modules/dish-builder/dish-builder-page";

/** Smista la route /componi verso la pagina del tenant, se ne ha una propria. */
export function ComponiBody() {
  const tenant = useTenant();
  return (
    <Suspense fallback={null}>{tenant.id === "kimos" ? <KimosComponiPage /> : <DishBuilderPage />}</Suspense>
  );
}
