import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LeadRequest = {
  name?: string;
  businessName?: string;
  restaurantName?: string;
  email?: string;
  phone?: string;
  city?: string;
  vertical?: string;
  interest?: string;
  message?: string;
  source?: string;
  website?: string;
};

function clean(value: unknown, max = 320): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function buildNotes(interest: string, message: string): string | null {
  const parts: string[] = [];
  if (interest) parts.push(`Interesse: ${interest}`);
  if (message) parts.push(message);
  return parts.length ? parts.join("\n\n") : null;
}

async function sendConfirmationEmail(
  to: string,
  contactName: string,
  vertical: "food" | "services",
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const brand = vertical === "services" ? "Bizery" : "Menuary";
  const from = process.env.RESEND_FROM_EMAIL
    ?? (vertical === "services" ? "Bizery <hello@bizery.it>" : "Menuary <hello@menuary.it>");
  const replyTo = vertical === "services" ? "hello@bizery.it" : "hello@menuary.it";

  const subject = `Abbiamo ricevuto la tua richiesta · ${brand}`;
  const firstName = contactName.split(/\s+/)[0] || "";
  const greeting = firstName ? `Ciao ${firstName},` : "Ciao,";

  const text =
    `${greeting}\n\n` +
    `grazie per aver scritto a ${brand}. Abbiamo preso in carico la tua richiesta ` +
    `e ti risponderemo entro 24 ore lavorative con una proposta su misura.\n\n` +
    `Se nel frattempo vuoi aggiungere qualcosa, rispondi pure a questa email.\n\n` +
    `— Il team ${brand}`;

  const html = `<!doctype html><html><body style="font-family:Georgia,serif;background:#f7f3ed;padding:32px;color:#2a241c;">
  <div style="max-width:540px;margin:0 auto;background:#fff;padding:40px 36px;border:1px solid #e6dfd2;">
    <p style="text-transform:uppercase;letter-spacing:0.22em;font-size:11px;color:#9a8c75;margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-weight:700;">${brand}</p>
    <h1 style="font-size:26px;line-height:1.2;margin:0 0 18px;font-weight:500;">Richiesta ricevuta.</h1>
    <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.7;margin:0 0 14px;">
      grazie per aver scritto a <strong>${brand}</strong>. Abbiamo preso in carico la tua richiesta
      e ti risponderemo <strong>entro 24 ore lavorative</strong> con una proposta su misura.
    </p>
    <p style="font-size:15px;line-height:1.7;margin:0 0 28px;">
      Se nel frattempo vuoi aggiungere qualcosa, rispondi pure a questa email.
    </p>
    <p style="font-size:14px;color:#6b5f4d;margin:0;">— Il team ${brand}</p>
  </div>
</body></html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to, reply_to: replyTo, subject, text, html }),
    });
  } catch {
    // best-effort: la lead è già stata salvata, l'email è un nice-to-have
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LeadRequest;

  const name = clean(body.name, 120);
  const businessName = clean(body.businessName || body.restaurantName, 160);
  const email = clean(body.email, 180).toLowerCase();
  const phone = clean(body.phone, 60);
  const city = clean(body.city, 120);
  const interest = clean(body.interest, 160);
  const message = clean(body.message, 1600);
  const website = clean(body.website, 160);
  const verticalRaw = clean(body.vertical, 16).toLowerCase();
  const vertical: "food" | "services" = verticalRaw === "services" ? "services" : "food";
  const source = clean(body.source, 60)
    || (vertical === "services" ? "bizery-marketing-site" : "menuary-marketing-site");

  if (website) {
    return NextResponse.json({ ok: true });
  }

  if (!name || !businessName || !email) {
    return NextResponse.json(
      {
        ok: false,
        error:
          vertical === "services"
            ? "Compila nome, azienda ed email."
            : "Compila nome, ristorante ed email.",
      },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  // platform_leads non è ancora nei tipi generati di Supabase: cast esplicito.
  const { error } = await (supabase as unknown as {
    from: (t: string) => { insert: (row: Record<string, unknown>) => Promise<{ error: unknown }> };
  })
    .from("platform_leads")
    .insert({
      business_name: businessName,
      business_vertical: vertical,
      contact_name: name,
      contact_email: email,
      contact_phone: phone || null,
      city: city || null,
      status: "lead",
      source,
      notes: buildNotes(interest, message),
    });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Invio non riuscito. Riprova tra poco." },
      { status: 500 },
    );
  }

  await sendConfirmationEmail(email, name, vertical);

  return NextResponse.json({ ok: true });
}
