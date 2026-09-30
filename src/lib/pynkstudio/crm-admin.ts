import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireSiteadmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("siteadmin")
    .select("id")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return data?.id ? user : null;
}

/** Toglie i caratteri che hanno significato nel filtro `or()` di PostgREST. */
export function safeSearchTerm(raw: string): string {
  return raw.replace(/[,()*%\\]/g, " ").trim().slice(0, 80);
}

type Filterable = {
  eq: (column: string, value: string) => Filterable;
  gte: (column: string, value: number) => Filterable;
  lte: (column: string, value: string) => Filterable;
  is: (column: string, value: null) => Filterable;
  not: (column: string, operator: string, value: unknown) => Filterable;
  or: (filters: string) => Filterable;
};

/** Filtri condivisi fra lista e export CSV, letti dalla query string. */
export function applyCrmFilters<Q>(query: Q, url: URL): Q {
  let q = query as unknown as Filterable;
  const status = url.searchParams.get("status") ?? "";
  const source = url.searchParams.get("source") ?? "";
  const search = safeSearchTerm(url.searchParams.get("q") ?? "");
  const view = url.searchParams.get("view") ?? "";
  const minSize = parseInt(url.searchParams.get("minSize") ?? "", 10);

  if (status && status !== "all") q = q.eq("status", status);
  if (source && source !== "all") q = q.eq("source", source);
  if (Number.isFinite(minSize) && minSize > 0) q = q.gte("employees_count", minSize);
  if (view === "followup") {
    q = q.not("next_follow_up_at", "is", null).lte("next_follow_up_at", new Date().toISOString());
  } else if (view === "unsubscribed") {
    q = q.not("unsubscribed_at", "is", null);
  } else if (view === "reachable") {
    q = q.is("unsubscribed_at", null);
  }
  if (search) {
    q = q.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%,industry.ilike.%${search}%`,
    );
  }
  return q as unknown as Q;
}
