import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAuthCallbackUrl } from "@/lib/login-url";
import { DEFAULT_COMMISSION_BY_SITEADMIN_ROLE, SITEADMIN_ROLES } from "@/lib/admin-permissions";
import type { Database } from "@/lib/supabase/types";

type SiteadminRole = Database["public"]["Enums"]["siteadmin_role"];
type AdminUserStatus = "active" | "invited" | "revoked";

const INVITABLE_ROLES = SITEADMIN_ROLES satisfies readonly SiteadminRole[];

type AuthUserSummary = {
  id: string;
  email?: string;
  invited_at?: string | null;
  last_sign_in_at?: string | null;
};

async function requireSiteadmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { supabase, user: null, siteadmin: null };

  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  return { supabase, user, siteadmin };
}

function canManageUsers(role: SiteadminRole | undefined): boolean {
  return role === "superadmin" || role === "admin";
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function statusFor(enabled: boolean, authUser?: AuthUserSummary): AdminUserStatus {
  if (!enabled) return "revoked";
  return authUser?.last_sign_in_at ? "active" : "invited";
}

async function listAuthUsersById(): Promise<Map<string, AuthUserSummary>> {
  const admin = createSupabaseAdminClient();
  const usersById = new Map<string, AuthUserSummary>();
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    for (const user of data.users as AuthUserSummary[]) {
      usersById.set(user.id, user);
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return usersById;
}

async function findAuthUserByEmail(email: string): Promise<AuthUserSummary | null> {
  const normalized = normalizeEmail(email);
  const usersById = await listAuthUsersById();
  return [...usersById.values()].find((user) => normalizeEmail(user.email ?? "") === normalized) ?? null;
}

export async function GET() {
  const { supabase, user, siteadmin } = await requireSiteadmin();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!siteadmin) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const { data, error } = await supabase
    .from("siteadmin")
    .select("id,user_id,email,display_name,role,commission_rate,enabled,created_at,invited_by")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let authUsers = new Map<string, AuthUserSummary>();
  try {
    authUsers = await listAuthUsersById();
  } catch {
    authUsers = new Map();
  }

  return NextResponse.json({
    users: (data ?? []).map((row) => {
      const authUser = authUsers.get(row.user_id);
      return {
        id: row.id,
        user_id: row.user_id,
        email: row.email,
        name: row.display_name ?? row.email,
        role: row.role,
        commission_rate: row.commission_rate,
        status: statusFor(row.enabled, authUser),
        invited_at: authUser?.invited_at ?? row.created_at,
        last_seen_at: authUser?.last_sign_in_at ?? null,
      };
    }),
    canManage: canManageUsers(siteadmin.role),
  });
}

export async function POST(request: Request) {
  const { supabase, user, siteadmin } = await requireSiteadmin();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!siteadmin || !canManageUsers(siteadmin.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const { email, display_name, role, commission_rate } = body as {
    email?: string;
    display_name?: string | null;
    role?: SiteadminRole;
    commission_rate?: number;
  };

  const normalizedEmail = email ? normalizeEmail(email) : "";
  if (!normalizedEmail || !role) {
    return NextResponse.json({ error: "Email e ruolo sono obbligatori." }, { status: 400 });
  }
  if (!INVITABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("siteadmin")
    .select("id, enabled")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing?.enabled) {
    return NextResponse.json({ error: "Esiste già un utente interno attivo con questa email." }, { status: 409 });
  }

  const admin = createSupabaseAdminClient();
  let authUserId: string | null = null;
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    normalizedEmail,
    { redirectTo: buildAuthCallbackUrl("admin") },
  );

  if (inviteError) {
    const existingAuthUser = await findAuthUserByEmail(normalizedEmail);
    if (!existingAuthUser) {
      return NextResponse.json({ error: `Errore invio email: ${inviteError.message}` }, { status: 500 });
    }
    authUserId = existingAuthUser.id;
  } else {
    authUserId = inviteData.user.id;
  }

  if (existing) {
    const { error } = await supabase
      .from("siteadmin")
      .update({
        user_id: authUserId,
        email: normalizedEmail,
        display_name: display_name?.trim() || null,
        role,
        commission_rate: typeof commission_rate === "number" ? commission_rate : DEFAULT_COMMISSION_BY_SITEADMIN_ROLE[role],
        enabled: true,
        invited_by: user.id,
      })
      .eq("id", existing.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase.from("siteadmin").insert({
      user_id: authUserId,
      email: normalizedEmail,
      display_name: display_name?.trim() || null,
      role,
      commission_rate: typeof commission_rate === "number" ? commission_rate : DEFAULT_COMMISSION_BY_SITEADMIN_ROLE[role],
      enabled: true,
      invited_by: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Esiste già un utente interno con questa email." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const { supabase, user, siteadmin } = await requireSiteadmin();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  if (!siteadmin || !canManageUsers(siteadmin.role)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const { id, role, enabled, commission_rate } = body as {
    id?: string;
    role?: SiteadminRole;
    enabled?: boolean;
    commission_rate?: number;
  };

  if (!id) return NextResponse.json({ error: "id richiesto." }, { status: 400 });
  if (role && !INVITABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Ruolo non valido." }, { status: 400 });
  }

  const { data: target } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("id", id)
    .maybeSingle();

  if (target?.role === "superadmin") {
    const wouldRemoveFromPool = (typeof enabled === "boolean" && !enabled) || (role && role !== "superadmin");
    if (wouldRemoveFromPool) {
      const { count } = await supabase
        .from("siteadmin")
        .select("id", { count: "exact", head: true })
        .eq("role", "superadmin")
        .eq("enabled", true);
      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: "Deve restare almeno un superadmin attivo." }, { status: 403 });
      }
    }
  }

  const update: Database["public"]["Tables"]["siteadmin"]["Update"] = {};
  if (role) update.role = role;
  if (typeof enabled === "boolean") update.enabled = enabled;
  if (typeof commission_rate === "number") {
    update.commission_rate = Math.max(0, Math.min(100, commission_rate));
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nessuna modifica richiesta." }, { status: 400 });
  }

  const { error } = await supabase
    .from("siteadmin")
    .update(update)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
