import { NextResponse } from "next/server";
import { getInboxUnreadCounts } from "@/lib/email/inbound-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const counts = await getInboxUnreadCounts();
    return NextResponse.json({ unread: counts.unread_total });
  } catch {
    return NextResponse.json({ unread: 0 });
  }
}
