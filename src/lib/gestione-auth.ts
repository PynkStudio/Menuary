import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { isDemoHost } from "@/lib/platform";

export type GestioneAuth =
  | { ok: true; isDemo: true }
  | { ok: true; isDemo: false; userId: string; isAdmin: boolean }
  | { ok: false };

/**
 * Verifica che l'utente corrente abbia accesso al pannello gestione del tenant.
 * In demo l'accesso è sempre garantito (lettura/scrittura mock). Fuori demo
 * l'utente deve essere siteadmin, tenantadmin o employee abilitato per il tenant.
 */
export async function authorizeGestione(tenantSlug: string): Promise<GestioneAuth> {
  const host = (await headers()).get("host") ?? "";
  if (isDemoHost(host)) return { ok: true, isDemo: true };

  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const [{ data: sa }, { data: ta }, { data: emp }] = await Promise.all([
    supabase.from("siteadmin").select("role").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("user_id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    supabase.from("employee").select("user_id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
  ]);

  if (!sa && !ta && !emp) return { ok: false };
  return { ok: true, isDemo: false, userId: user.id, isAdmin: Boolean(sa || ta) };
}
