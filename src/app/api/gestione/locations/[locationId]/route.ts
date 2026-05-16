import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type LocationUpdate = Database["public"]["Tables"]["locations"]["Update"];

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;
const RESERVED_SLUGS = new Set([
  "www", "app", "api", "mail", "smtp", "ftp", "admin",
  "demo", "gestione", "clienti", "login", "studio", "support",
]);

async function resolveAdminAccess(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string, tenantId: string) {
  const [{ data: ta }, { data: sa }] = await Promise.all([
    supabase.from("tenantadmin").select("id").eq("user_id", userId).eq("tenant_id", tenantId).eq("enabled", true).maybeSingle(),
    supabase.from("siteadmin").select("id").eq("user_id", userId).eq("enabled", true).maybeSingle(),
  ]);
  return !!(ta || sa);
}

/** PATCH /api/gestione/locations/[locationId] — aggiorna una sede */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> },
) {
  const { locationId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verifica che la sede appartenga a un tenant cui l'utente ha accesso
  const { data: existing } = await supabase
    .from("locations")
    .select("tenant_id, slug, is_default")
    .eq("id", locationId)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = await resolveAdminAccess(supabase, user.id, existing.tenant_id);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, address, city, phone, email, routingMode, isDefault } = body as {
    name?: string;
    slug?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
    routingMode?: string;
    isDefault?: boolean;
  };

  if (slug && slug !== existing.slug) {
    if (!SLUG_RE.test(slug)) return NextResponse.json({ error: "Slug non valido." }, { status: 422 });
    if (RESERVED_SLUGS.has(slug)) return NextResponse.json({ error: `"${slug}" è riservato.` }, { status: 422 });
    const { count } = await supabase
      .from("locations")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", existing.tenant_id)
      .eq("slug", slug);
    if (count && count > 0) return NextResponse.json({ error: `Slug "${slug}" già in uso.` }, { status: 409 });
  }

  // Se si imposta questa sede come default, si toglie il flag alle altre
  if (isDefault && !existing.is_default) {
    await supabase
      .from("locations")
      .update({ is_default: false })
      .eq("tenant_id", existing.tenant_id)
      .neq("id", locationId);
  }

  const update: LocationUpdate = { updated_at: new Date().toISOString() };
  if (name !== undefined) update.name = name;
  if (slug !== undefined) update.slug = slug;
  if (address !== undefined) update.address = address ?? null;
  if (city !== undefined) update.city = city ?? null;
  if (phone !== undefined) update.phone = phone ?? null;
  if (email !== undefined) update.email = email ?? null;
  if (routingMode !== undefined) update.routing_mode = routingMode;
  if (isDefault !== undefined) update.is_default = isDefault;

  const { data, error } = await supabase
    .from("locations")
    .update(update)
    .eq("id", locationId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE /api/gestione/locations/[locationId] — elimina una sede */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ locationId: string }> },
) {
  const { locationId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("locations")
    .select("tenant_id, is_default")
    .eq("id", locationId)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = await resolveAdminAccess(supabase, user.id, existing.tenant_id);
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Non si può eliminare la sede default — bisogna prima impostarne un'altra
  if (existing.is_default) {
    return NextResponse.json(
      { error: "Non puoi eliminare la sede predefinita. Imposta prima un'altra sede come default." },
      { status: 422 },
    );
  }

  const { error } = await supabase.from("locations").delete().eq("id", locationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
