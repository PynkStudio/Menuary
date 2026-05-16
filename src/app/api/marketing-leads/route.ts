import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendEmail, resolveSender } from "@/lib/email/sender";
import { buildContactConfirmationEmail } from "@/lib/email/templates/contact-confirmation";

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
  businessName: string,
  vertical: "food" | "services",
): Promise<void> {
  const { brand } = resolveSender(vertical === "services" ? "bizery-demo" : "bepork");
  const firstName = contactName.split(/\s+/)[0] ?? "";
  const html = buildContactConfirmationEmail({ brand, firstName, businessName });

  await sendEmail({
    to,
    subject: `Abbiamo ricevuto la tua richiesta · ${brand.name}`,
    html,
    replyTo: `hello@${brand.domain}`,
    // tenantId non passato: il from viene risolto dal vertical via tenantId demo
    tenantId: vertical === "services" ? "bizery-demo" : "bepork",
  });
  // best-effort: la lead è già stata salvata, l'email è un nice-to-have
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

  await sendConfirmationEmail(email, name, businessName, vertical);

  return NextResponse.json({ ok: true });
}
