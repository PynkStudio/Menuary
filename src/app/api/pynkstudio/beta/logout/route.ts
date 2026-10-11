import { NextResponse } from "next/server";
import { clearBetaCookie } from "@/lib/pynkstudio/beta";

export const dynamic = "force-dynamic";

export function POST() {
  const res = NextResponse.json({ ok: true });
  clearBetaCookie(res);
  return res;
}
