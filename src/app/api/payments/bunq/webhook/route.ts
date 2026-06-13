import { NextResponse } from "next/server";
import { handleBunqCallback } from "@/lib/payments/bunq/reconciliation";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const result = await handleBunqCallback(payload);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[bunq-webhook]", err);
    return NextResponse.json({ error: "webhook_processing_failed" }, { status: 500 });
  }
}
