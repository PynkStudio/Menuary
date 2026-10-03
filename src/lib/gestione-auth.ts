import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { isDemoHost } from "@/lib/platform";
import { getTenantDemoControl } from "@/lib/demo-controls";
import {
  getEffectiveCapabilities,
  isDeviceRole,
  type EmployeeRole,
  type StoreCapabilities,
} from "@/lib/store-roles";
import { viewerMeets, type GestioneRequirement } from "@/lib/gestione-sections";

export type { GestioneRequirement } from "@/lib/gestione-sections";

export type GestioneAuth =
  | { ok: true; isDemo: true }
  | {
      ok: true;
      isDemo: false;
      userId: string;
      isAdmin: boolean;
      isPlatformAdmin: boolean;
      role: EmployeeRole | null;
      isDevice: boolean;
      capabilities: StoreCapabilities;
    }
  | { ok: false };

const PLATFORM_ADMIN_EMAILS = new Set(["hello@menuary.it"]);

function isPlatformAdminEmail(email?: string | null) {
  return Boolean(email && PLATFORM_ADMIN_EMAILS.has(email.toLowerCase()));
}

type MembershipClient = NonNullable<ReturnType<typeof createSupabaseServiceClient>>;

async function resolveMembership(
  db: MembershipClient | Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: { id: string; email?: string | null },
  tenantSlug: string,
): Promise<GestioneAuth> {
  const [{ data: sa }, { data: ta }, { data: emp }] = await Promise.all([
    db.from("siteadmin").select("role").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    db.from("tenantadmin").select("user_id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    db.from("employee").select("role, permissions").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
  ]);

  const isPlatformAdmin = Boolean(sa) || isPlatformAdminEmail(user.email);
  if (!isPlatformAdmin && !ta && !emp) return { ok: false };

  const isAdmin = Boolean(isPlatformAdmin || ta);
  const role = isAdmin ? null : ((emp?.role as EmployeeRole | null) ?? null);
  return {
    ok: true,
    isDemo: false,
    userId: user.id,
    isAdmin,
    isPlatformAdmin,
    role,
    isDevice: !isAdmin && isDeviceRole(role),
    capabilities: getEffectiveCapabilities(
      isAdmin ? null : (role ?? "personale_cucina"),
      (emp?.permissions as Record<string, boolean> | null) ?? {},
    ),
  };
}

/**
 * Identifica l'utente corrente rispetto al tenant. Non applica requisiti:
 * per le operazioni usare requireGestione().
 * In demo l'accesso è sempre garantito. Con backend live (finestra di 15 minuti
 * su tenant_demo_controls) le operazioni usano Supabase reale invece dei fixture.
 */
export async function authorizeGestione(tenantSlug: string): Promise<GestioneAuth> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";
  if (isDemoHost(host)) {
    const control = await getTenantDemoControl(tenantSlug).catch(() => null);
    if (control?.backendLive) {
      return {
        ok: true,
        isDemo: false,
        userId: "demo",
        isAdmin: true,
        isPlatformAdmin: false,
        role: null,
        isDevice: false,
        capabilities: getEffectiveCapabilities(null),
      };
    }
    return { ok: true, isDemo: true };
  }

  const bearer = requestHeaders.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (bearer) {
    const service = createSupabaseServiceClient();
    if (!service) return { ok: false };
    const { data: { user } } = await service.auth.getUser(bearer);
    if (!user) return { ok: false };
    return resolveMembership(service, user, tenantSlug);
  }

  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  return resolveMembership(supabase, user, tenantSlug);
}

export function meetsGestioneRequirement(auth: GestioneAuth, need: GestioneRequirement): boolean {
  if (!auth.ok) return false;
  if (auth.isDemo) return true;
  return viewerMeets(auth, need);
}

/**
 * Unico punto di controllo per pagine, server action e API della gestione.
 * Restituisce { ok: false } sia per utente assente sia per permessi
 * insufficienti; `status` distingue i due casi per le API.
 */
export async function requireGestione(
  tenantSlug: string,
  need: GestioneRequirement = "staff",
): Promise<(GestioneAuth & { ok: true }) | { ok: false; status: 401 | 403 }> {
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) return { ok: false, status: 401 };
  if (!meetsGestioneRequirement(auth, need)) return { ok: false, status: 403 };
  return auth;
}
