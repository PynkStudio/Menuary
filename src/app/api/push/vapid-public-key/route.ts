import { NextResponse } from "next/server";

/** Chiave pubblica VAPID (impostare in env per abilitare Web Push lato client). */
export function GET() {
  const key = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ?? "";
  return NextResponse.json({ publicKey: key });
}
