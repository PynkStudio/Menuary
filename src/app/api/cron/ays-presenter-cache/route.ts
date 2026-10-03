import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const BUCKET = "ays-presenter-cache";
const RETENTION_DAYS = 30;
const BATCH_SIZE = 500;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createSupabaseServiceClient();
  if (!supabase) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("ays_presenter_cache_entries")
    .select("cache_key, object_path")
    .lt("last_accessed_at", cutoff)
    .order("last_accessed_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) return NextResponse.json({ error: "cache_query_failed" }, { status: 500 });
  if (!data?.length) return NextResponse.json({ ok: true, removed: 0, cutoff });

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove(data.map((entry) => entry.object_path));
  if (storageError) return NextResponse.json({ error: "storage_cleanup_failed" }, { status: 502 });

  const { error: metadataError } = await supabase
    .from("ays_presenter_cache_entries")
    .delete()
    .in("cache_key", data.map((entry) => entry.cache_key));
  if (metadataError) return NextResponse.json({ error: "metadata_cleanup_failed" }, { status: 500 });

  return NextResponse.json({ ok: true, removed: data.length, cutoff });
}
