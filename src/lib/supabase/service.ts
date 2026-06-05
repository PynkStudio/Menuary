import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/** Client con service_role: solo server, bypassa RLS. Richiede SUPABASE_SERVICE_ROLE_KEY. */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
