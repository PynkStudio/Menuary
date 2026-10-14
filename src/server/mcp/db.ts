import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

/** Tabelle MCP aggiunte dalla migrazione corrente, prima della rigenerazione dei tipi Supabase. */
export function createMcpServiceClient(): SupabaseClient | null {
  return createSupabaseServiceClient() as unknown as SupabaseClient | null;
}
