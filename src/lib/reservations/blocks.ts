import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Db = SupabaseClient<Database>;
type ReservationBlock = {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
};

function normalizeTime(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export async function getReservationBlock(
  db: Db,
  input: { tenantId: string; date: string; time: string; locationId?: string | null },
): Promise<ReservationBlock | null> {
  const time = normalizeTime(input.time);
  if (!time) return null;
  const query = (db as unknown as {
    from: (table: "tenant_reservation_blocks") => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            lte: (column: string, value: string) => {
              gt: (column: string, value: string) => {
                order: (column: string, options: { ascending: boolean }) => {
                  limit: (count: number) => {
                    maybeSingle: () => Promise<{ data: ReservationBlock | null; error: { message: string } | null }>;
                  };
                };
              };
            };
          };
        };
      };
    };
  }).from("tenant_reservation_blocks")
    .select("id,start_time,end_time,reason")
    .eq("tenant_id", input.tenantId)
    .eq("reservation_date", input.date)
    .lte("start_time", time)
    .gt("end_time", time)
    .order("created_at", { ascending: false })
    .limit(1);
  const result = await query.maybeSingle();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

export async function createReservationBlock(
  db: Db,
  input: {
    tenantId: string;
    date: string;
    startTime: string;
    endTime: string;
    locationId?: string | null;
    source: string;
    phone?: string | null;
    reason?: string | null;
  },
) {
  const startTime = normalizeTime(input.startTime);
  const endTime = normalizeTime(input.endTime);
  if (!startTime || !endTime || startTime >= endTime) throw new Error("invalid_reservation_block");
  const { data, error } = await (db as unknown as {
    from: (table: "tenant_reservation_blocks") => {
      insert: (row: Record<string, unknown>) => {
        select: (columns: string) => {
          single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
        };
      };
    };
  }).from("tenant_reservation_blocks").insert({
    tenant_id: input.tenantId,
    location_id: input.locationId ?? null,
    reservation_date: input.date,
    start_time: startTime,
    end_time: endTime,
    source: input.source,
    created_by_phone_e164: input.phone ?? null,
    reason: input.reason ?? null,
  }).select("id").single();
  if (error || !data) throw new Error(error?.message ?? "reservation_block_create_failed");
  return data;
}
