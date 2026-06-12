import { NextResponse } from "next/server";
import { processNewsletterQueue } from "@/lib/newsletter/server";

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await processNewsletterQueue()) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore newsletter." }, { status: 500 });
  }
}
