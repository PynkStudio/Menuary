import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { isDemoHost } from "@/lib/platform";
import { getTenantDemoControl } from "@/lib/demo-controls";

export type GestioneAuth =
  | { ok: true; isDemo: true }
  | { ok: true; isDemo: false; userId: string; isAdmin: boolean; isPlatformAdmin: boolean }
  | { ok: false };

const PLATFORM_ADMIN_EMAILS = new Set(["hello@menuary.it"]);

function isPlatformAdminEmail(email?: string | null) {
  return Boolean(email && PLATFORM_ADMIN_EMAILS.has(email.toLowerCase()));
}

/**
 * Verifica che l'utente corrente abbia accesso al pannello gestione del tenant.
 * In demo l'accesso è sempre garantito. Se il tenant ha backendLive attivo su
 * tenant_demo_controls, le operazioni usano Supabase reale invece dei fixture.
 * Fuori demo l'utente deve essere siteadmin, tenantadmin o employee abilitato.
 */
export async function authorizeGestione(tenantSlug: string): Promise<GestioneAuth> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  if (isDemoHost(host)) {
    const control = await getTenantDemoControl(tenantSlug).catch(() => null);
    if (control?.backendLive) {
      return { ok: true, isDemo: false, userId: "demo", isAdmin: true, isPlatformAdmin: true };
    }
    return { ok: true, isDemo: true };
  }

  const bearer = requestHeaders.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) {
    const service = createSupabaseServiceClient();
    if (!service) return { ok: false };
    const { data: { user } } = await service.auth.getUser(bearer);
    if (!user) return { ok: false };

    const [{ data: sa }, { data: ta }, { data: emp }] = await Promise.all([
      service.from("siteadmin").select("role").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
      service.from("tenantadmin").select("user_id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
      service.from("employee").select("user_id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    ]);

    const isPlatformAdmin = Boolean(sa) || isPlatformAdminEmail(user.email);
    if (!isPlatformAdmin && !ta && !emp) return { ok: false };
    return { ok: true, isDemo: false, userId: user.id, isAdmin: Boolean(isPlatformAdmin || ta), isPlatformAdmin };
  }

  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const [{ data: sa }, { data: ta }, { data: emp }] = await Promise.all([
    supabase.from("siteadmin").select("role").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("user_id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    supabase.from("employee").select("user_id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
  ]);

  const isPlatformAdmin = Boolean(sa) || isPlatformAdminEmail(user.email);
  if (!isPlatformAdmin && !ta && !emp) return { ok: false };
  return { ok: true, isDemo: false, userId: user.id, isAdmin: Boolean(isPlatformAdmin || ta), isPlatformAdmin };
}
