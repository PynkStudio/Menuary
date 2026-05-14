import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * @param cookieDomain — se specificato sovrascrive il domain del cookie.
 *   Usare ".menuary.it" dal login portal per condividere la sessione
 *   tra tutti i sottodomini *.menuary.it senza ulteriori scambi di token.
 */
export async function createSupabaseServerClient(cookieDomain?: string) {
  const cookieStore = await cookies();
  const domain =
    cookieDomain ??
    (process.env.NODE_ENV === "production" ? ".menuary.it" : undefined);

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
                ...(domain ? { domain } : {}),
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
