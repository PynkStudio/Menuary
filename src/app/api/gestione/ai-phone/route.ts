import { NextRequest, NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import {
  buildPauseUntil,
  getAiPhoneSettings,
  upsertAiPhoneSettings,
  type AiPhoneQuickSettings,
} from "@/lib/retell/settings";

type QuickPatch = {
  tenantId?: string;
  ordersMode?: "accept" | "30m" | "day-end" | "custom" | "manual";
  ordersCustomUntil?: string | null;
  reservationsMode?: "accept" | "30m" | "day-end" | "custom" | "manual";
  reservationsCustomUntil?: string | null;
  answerAfterHours?: boolean;
  allowHumanTransfer?: boolean;
  askAllergiesForOrders?: boolean;
  suggestAlternatives?: boolean;
  collectMarketingConsent?: boolean;
  notesForAssistant?: string;
  paymentControls?: {
    enabled?: boolean;
    requireForTakeaway?: boolean;
    requireForDelivery?: boolean;
    defaultChannel?: "sms" | "whatsapp";
    sendAutomatically?: boolean;
  };
};

function tenantFrom(req: NextRequest, body?: QuickPatch | null) {
  return req.nextUrl.searchParams.get("tenantId") ?? body?.tenantId ?? "";
}

export async function GET(req: NextRequest) {
  const tenantId = tenantFrom(req);
  if (!tenantId) return NextResponse.json({ error: "tenant_required" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    return NextResponse.json({ settings: await getAiPhoneSettings(tenantId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "settings_load_failed" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as QuickPatch | null;
  const tenantId = tenantFrom(req, body);
  if (!tenantId || !body) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const current = await getAiPhoneSettings(tenantId);
    const quickSettings: Partial<AiPhoneQuickSettings> = {};
    if (body.ordersMode) {
      quickSettings.acceptNewOrders = buildPauseUntil(body.ordersMode, body.ordersCustomUntil);
    }
    if (body.reservationsMode) {
      quickSettings.acceptReservations = buildPauseUntil(body.reservationsMode, body.reservationsCustomUntil);
    }
    if (typeof body.answerAfterHours === "boolean") quickSettings.answerAfterHours = body.answerAfterHours;
    if (typeof body.allowHumanTransfer === "boolean") quickSettings.allowHumanTransfer = body.allowHumanTransfer;
    if (typeof body.askAllergiesForOrders === "boolean") quickSettings.askAllergiesForOrders = body.askAllergiesForOrders;
    if (typeof body.suggestAlternatives === "boolean") quickSettings.suggestAlternatives = body.suggestAlternatives;
    if (typeof body.collectMarketingConsent === "boolean") quickSettings.collectMarketingConsent = body.collectMarketingConsent;
    if (typeof body.notesForAssistant === "string") quickSettings.notesForAssistant = body.notesForAssistant;

    const settings = await upsertAiPhoneSettings(tenantId, {
      humanTransferEnabled: quickSettings.allowHumanTransfer ?? current.humanTransferEnabled,
      afterHoursMode: quickSettings.answerAfterHours === false ? "closed_message" : current.afterHoursMode,
      paymentControls: body.paymentControls
        ? {
            ...current.paymentControls,
            ...body.paymentControls,
          }
        : current.paymentControls,
      quickSettings,
    });
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "settings_save_failed" },
      { status: 500 },
    );
  }
}
