import { NextResponse } from "next/server";
import { requireGestione } from "@/lib/gestione-auth";
import { getTenantById } from "@/lib/data/tenant";
import {
  deleteMessage,
  deleteSubscriber,
  getNewsletterDashboard,
  saveMessage,
  saveSubscriber,
  sendCampaignNow,
  toggleAutomation,
} from "@/lib/newsletter/server";

async function requireAccess(tenantId: string) {
  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) {
    return { error: NextResponse.json({ error: "Non autorizzato." }, { status: 403 }) };
  }
  // Gli iscritti sono dati personali: la demo pubblica non li legge mai.
  if (auth.isDemo) {
    return { error: NextResponse.json({ error: "La newsletter non è disponibile nella demo." }, { status: 403 }) };
  }
  const tenant = await getTenantById(tenantId);
  if (!tenant?.features.fanbaseCommunity) {
    return { error: NextResponse.json({ error: "Modulo newsletter non attivo." }, { status: 403 }) };
  }
  return { auth };
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function translationMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
      .map(([locale, body]) => [locale, body.slice(0, 100_000)]),
  );
}

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId")?.trim() ?? "";
  const access = await requireAccess(tenantId);
  if ("error" in access) return access.error;

  try {
    return NextResponse.json(await getNewsletterDashboard(tenantId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore database." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const tenantId = text(body?.tenantId, 120);
  const action = text(body?.action, 60);
  const access = await requireAccess(tenantId);
  if ("error" in access) return access.error;

  try {
    switch (action) {
      case "save-subscriber": {
        const email = text(body?.email, 320);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return NextResponse.json({ error: "Email non valida." }, { status: 400 });
        }
        await saveSubscriber(tenantId, {
          email,
          name: text(body?.name, 160) || null,
          preferredLanguage: text(body?.preferredLanguage, 12) || null,
          source: text(body?.source, 80) || "gestione",
          subscribed: body?.subscribed !== false,
        });
        break;
      }
      case "delete-subscriber": {
        await deleteSubscriber(tenantId, text(body?.id, 80));
        break;
      }
      case "save-message": {
        const kind = body?.kind === "automation" ? "automation" : "campaign";
        const name = text(body?.name, 160);
        if (!name) return NextResponse.json({ error: "Il nome interno è obbligatorio." }, { status: 400 });
        await saveMessage(tenantId, {
          id: text(body?.id, 80) || undefined,
          kind,
          name,
          fromName: text(body?.fromName, 120) || null,
          replyTo: text(body?.replyTo, 320) || null,
          automationTrigger: kind === "automation" ? (body?.automationTrigger === "unsubscribed" ? "unsubscribed" : "subscribed") : null,
          automationDelayMinutes: Math.max(0, Math.min(525_600, Number(body?.automationDelayMinutes) || 0)),
          automationActive: body?.automationActive === true,
          scheduledAt: typeof body?.scheduledAt === "string" ? body.scheduledAt : null,
          subjectTranslations: translationMap(body?.subjectTranslations),
          preheaderTranslations: translationMap(body?.preheaderTranslations),
          bodyHtmlTranslations: translationMap(body?.bodyHtmlTranslations),
          createdBy: access.auth.isDemo ? null : access.auth.userId,
        });
        break;
      }
      case "delete-message": {
        await deleteMessage(tenantId, text(body?.id, 80));
        break;
      }
      case "send-campaign": {
        const result = await sendCampaignNow(tenantId, text(body?.id, 80));
        return NextResponse.json({ ok: true, result });
      }
      case "toggle-automation": {
        await toggleAutomation(tenantId, text(body?.id, 80), body?.active === true);
        break;
      }
      default:
        return NextResponse.json({ error: "Azione non supportata." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Errore database." }, { status: 500 });
  }
}
