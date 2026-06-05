"use client";

import { forwardRef, type CSSProperties, type HTMLAttributes } from "react";
import { useTenantOrNull } from "@/components/core/tenant-provider";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLDivElement>;

export const GestionePortalSurface = forwardRef<HTMLDivElement, Props>(
  function GestionePortalSurface({ className, style, ...props }, ref) {
    const tenant = useTenantOrNull();
    const tenantVars = tenant
      ? ({
          ...tenantThemeCssVars(tenant.theme),
          "--ga-accent": tenant.theme.red,
          "--ga-accent-soft": `${tenant.theme.red}24`,
          "--ga-accent-ring": `${tenant.theme.red}52`,
        } as CSSProperties)
      : undefined;

    return (
      <div
        ref={ref}
        className={cn("gestione-admin", className)}
        data-gestione-tenant={tenant?.id}
        data-tenant-surface={tenant?.id}
        style={{ ...tenantVars, ...style }}
        {...props}
      />
    );
  },
);
