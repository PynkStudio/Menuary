import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * @param cookieDomain — domain da impostare sul cookie Supabase.
 *   - ".menuary.it"  → cookie condiviso su tutti i sottodomini *.menuary.it
 *   - undefined      → nessun attributo Domain (cookie scoped al host corrente)
 *
 * Usare ".menuary.it" esplicitamente solo dal login portal e dal middleware
 * dei sottodomini Menuary. NON impostarlo su domini custom (bepork.it, ecc.)
 * perché il browser rifiuterebbe il cookie (spec violation).
 */
export async function createSupabaseServerClient(cookieDomain?: string) {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain !== undefined ? { domain: cookieDomain } : {}),
              }),
            );
          } catch {
            /* called from a Server Component — safe to ignore */
          }
        },
      },
    },
  );
}
