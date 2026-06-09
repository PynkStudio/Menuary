import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { TenantLinktreeItem } from "@/components/modules/linktree/linktree-view";
import {
  instagramHref,
  tiktokHref,
  valentinaBasePath,
} from "@/components/tenants/valentina-orciuoli/content";

type LinktreeRow = {
  id: string;
  label: string;
  href: string;
  description: string | null;
  kind: string | null;
  enabled: boolean;
};

type LinktreeSelectQuery = {
  eq(column: string, value: string | boolean): LinktreeSelectQuery;
  order(column: string, options?: { ascending?: boolean }): LinktreeSelectQuery;
  then<TResult1 = { data: LinktreeRow[] | null; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: LinktreeRow[] | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>;
};

type LinktreeTableClient = {
  from(table: "tenant_linktree_links"): {
    select(columns: string): LinktreeSelectQuery;
  };
};

export const valentinaDefaultLinktreeItems: TenantLinktreeItem[] = [
  {
    label: "Sito",
    description: "Home ufficiale di Valentina Orciuoli.",
    href: valentinaBasePath,
    kind: "site",
  },
  {
    label: "Instagram",
    description: "Aggiornamenti, cover reveal e vita da autrice.",
    href: instagramHref,
    kind: "social",
  },
  {
    label: "TikTok",
    description: "Video e contenuti per lettrici e lettori.",
    href: tiktokHref,
    kind: "social",
  },
  {
    label: "Contatti",
    description: "Form, email e canali ufficiali.",
    href: `${valentinaBasePath}/contatti`,
    kind: "contact",
  },
  {
    label: "Libri",
    description: "Catalogo libri e pagine d'acquisto.",
    href: `${valentinaBasePath}/libri`,
    kind: "books",
  },
  {
    label: "Eventi",
    description: "Presentazioni, firmacopie e nuove date.",
    href: `${valentinaBasePath}/eventi`,
    kind: "events",
  },
];

export function getDefaultLinktreeItems(tenantId: string): TenantLinktreeItem[] {
  if (tenantId === "valentina-orciuoli") return valentinaDefaultLinktreeItems;
  return [];
}

export async function getTenantLinktreeItems(tenantId: string): Promise<TenantLinktreeItem[]> {
  const db = createSupabaseServiceClient();
  if (!db) return getDefaultLinktreeItems(tenantId);

  const { data, error } = await (db as unknown as LinktreeTableClient)
    .from("tenant_linktree_links")
    .select("id,label,href,description,kind,enabled,position")
    .eq("tenant_id", tenantId)
    .eq("enabled", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data?.length) return getDefaultLinktreeItems(tenantId);
  return data.map((item) => ({
    id: item.id,
    label: item.label,
    href: item.href,
    description: item.description,
    kind: item.kind,
    enabled: item.enabled,
  }));
}
