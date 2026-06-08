"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type TrackingEvent = {
  id: string;
  created_at: string;
  resend_email_id: string;
  event_type: string;
  from_address: string | null;
  to_address: string | null;
  subject: string | null;
  brand: "menuary" | "bizery" | "orpheo" | null;
  metadata: Record<string, unknown>;
};

/** Tutti gli eventi per un singolo resend_email_id (usato nel dettaglio email inviata). */
export async function getTrackingEventsForEmail(resendEmailId: string): Promise<TrackingEvent[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("email_tracking_events")
    .select("*")
    .eq("resend_email_id", resendEmailId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as TrackingEvent[];
}
