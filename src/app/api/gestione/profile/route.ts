import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { isDemoHost } from "@/lib/platform";

const SUPPORTED_LANGUAGES = new Set(["it", "en", "fr", "es", "de"]);

function displayName(firstName: string, lastName: string) {
  return [firstName, lastName].filter(Boolean).join(" ").trim() || null;
}

export async function PUT(request: Request) {
  const host = request.headers.get("host");
  if (isDemoHost(host)) return NextResponse.json({ ok: true });

  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  let body: {
    tenant_slug?: string;
    first_name?: string;
    last_name?: string;
    preferred_language?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const tenantSlug = body.tenant_slug?.trim();
  if (!tenantSlug) return NextResponse.json({ error: "tenant_slug richiesto." }, { status: 400 });

  const firstName = (body.first_name ?? "").trim();
  const lastName = (body.last_name ?? "").trim();
  const preferredLanguage = (body.preferred_language ?? "it").trim().toLowerCase();
  if (!SUPPORTED_LANGUAGES.has(preferredLanguage)) {
    return NextResponse.json({ error: "Lingua non valida." }, { status: 400 });
  }

  const [{ data: siteadmin }, { data: tenantadmin }, { data: employee }, { data: adminUser }] = await Promise.all([
    supabase.from("siteadmin").select("id").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    supabase.from("employee").select("id").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
    supabase.from("admin_users").select("id").eq("auth_user_id", user.id).eq("tenant_id", tenantSlug).maybeSingle(),
  ]);

  if (!siteadmin && !tenantadmin && !employee && !adminUser) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  const patch = {
    first_name: firstName || null,
    last_name: lastName || null,
    display_name: displayName(firstName, lastName),
    preferred_language: preferredLanguage,
  };

  const updates = [];
  if (tenantadmin) updates.push(supabase.from("tenantadmin").update(patch).eq("id", tenantadmin.id));
  if (employee) updates.push(supabase.from("employee").update(patch).eq("id", employee.id));
  if (adminUser) updates.push(supabase.from("admin_users").update(patch).eq("id", adminUser.id));
  if (siteadmin) {
    updates.push(
      supabase
        .from("siteadmin")
        .update({
          first_name: firstName || null,
          last_name: lastName || null,
          display_name: displayName(firstName, lastName),
        })
        .eq("id", siteadmin.id),
    );
  }

  updates.push(
    supabase
      .from("user_profiles")
      .upsert({ user_id: user.id, preferred_language: preferredLanguage, updated_at: new Date().toISOString() }),
  );

  const results = await Promise.all(updates);
  const error = results.find((result) => result.error)?.error;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
