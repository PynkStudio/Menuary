"use client";

import { useEffect } from "react";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import type { LoginFrom } from "@/lib/login-url";
import { tenantSlugFromFrom } from "@/lib/login-url";

interface Props {
  from: LoginFrom | null;
  children: React.ReactNode;
}

/**
 * Applica il tema CSS del tenant (o il tema neutro Menuary) al contenitore
 * del login portal, in base al parametro `from`.
 *
 * Esempi:
 *   from="gestione.bepork" → colori e font di BePork
 *   from="admin"           → nessun override (tema dark del layout)
 *   from="clienti"         → nessun override (tema Menuary light)
 */
export function LoginPortalTheme({ from, children }: Props) {
  const slug = tenantSlugFromFrom(from);
  const tenant = slug ? TENANTS.find((t) => t.id === slug) : null;
  const cssVars = tenant ? tenantThemeCssVars(tenant.theme) : {};

  useEffect(() => {
    if (!tenant) return;
    // Imposta data-tenant per eventuali CSS scoped
    document.documentElement.setAttribute("data-login-tenant", tenant.id);
    return () => document.documentElement.removeAttribute("data-login-tenant");
  }, [tenant]);

  return (
    <div style={cssVars as React.CSSProperties} className="contents">
      {children}
    </div>
  );
}
