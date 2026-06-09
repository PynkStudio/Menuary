import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { isDemoHost } from "@/lib/platform";

type SanitizedLinkPayload = {
  id?: string;
  label: string;
  href: string;
  description: string | null;
  kind: string | null;
  enabled: boolean;
};

type LinktreeInsertRow = {
  tenant_id: string;
  label: string;
  href: string;
  description: string | null;
  kind: string;
  enabled: boolean;
  position: number;
};

type LinktreeMutationClient = {
  from(table: "tenant_linktree_links"): {
    delete(): { eq(column: string, value: string): Promise<{ error: { message: string } | null }> };
    insert(rows: LinktreeInsertRow[]): Promise<{ error: { message: string } | null }>;
  };
};

function sanitizeLinks(raw: unknown): SanitizedLinkPayload[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
      return {
        id: typeof value.id === "string" ? value.id : undefined,
        label: typeof value.label === "string" ? value.label.trim().slice(0, 80) : "",
        href: typeof value.href === "string" ? value.href.trim().slice(0, 500) : "",
        description: typeof value.description === "string" ? value.description.trim().slice(0, 180) : null,
        kind: typeof value.kind === "string" ? value.kind.trim().slice(0, 40) : "link",
        enabled: value.enabled !== false,
      };
    })
    .filter((item) => item.label && item.href)
    .slice(0, 24);
}

export async function PUT(request: Request) {
  const host = request.headers.get("host");
  let body: { tenantId?: string; links?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const tenantId = body.tenantId?.trim();
  if (!tenantId) return NextResponse.json({ error: "tenantId richiesto." }, { status: 400 });
  const links = sanitizeLinks(body.links);

  if (isDemoHost(host)) return NextResponse.json({ ok: true, links });

  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autenticato." }, { status: 401 });

  const [{ data: siteadmin }, { data: tenantadmin }] = await Promise.all([
    supabase.from("siteadmin").select("id").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
    supabase.from("tenantadmin").select("id").eq("user_id", user.id).eq("tenant_id", tenantId).eq("enabled", true).maybeSingle(),
  ]);
  if (!siteadmin && !tenantadmin) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Service role non configurato." }, { status: 500 });

  const table = (db as unknown as LinktreeMutationClient).from("tenant_linktree_links");
  const { error: deleteError } = await table.delete().eq("tenant_id", tenantId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  if (links.length) {
    const { error: insertError } = await table.insert(
      links.map((link, index) => ({
        tenant_id: tenantId,
        label: link.label,
        href: link.href,
        description: link.description || null,
        kind: link.kind || "link",
        enabled: link.enabled !== false,
        position: index,
      })),
    );
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, links });
}
