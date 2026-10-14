import { NextResponse } from "next/server";
import { loadPublicOutreach, recordOutreachEvent } from "@/lib/menuary-outreach/server";
import { outreachBookingUrl } from "@/lib/menuary-outreach/copy";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await loadPublicOutreach(token);
  if (!data) return NextResponse.redirect(new URL("/", request.url));
  await recordOutreachEvent(data.lead, "booking_clicked", { clicked_at: data.lead.clicked_at ?? new Date().toISOString() });
  return NextResponse.redirect(outreachBookingUrl(data.campaign, data.lead));
}
