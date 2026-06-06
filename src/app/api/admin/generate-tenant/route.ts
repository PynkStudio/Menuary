import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { gh, extractAnimaFiles, commitAnimaToGitHub } from "@/lib/github-anima";
import { upsertTenantDemoControl } from "@/lib/demo-controls";
import { upsertTenantSupportAdminContact } from "@/lib/tenant-support/admin-contacts";

function buildTheme(primary: string) {
  return {
    red: primary, redDark: primary,
    peach: "#f1f5f9", cream: "#ffffff",
    ink: "#0f172a", brick: "#1e293b",
    mustard: primary, mustardSoft: "#f1f5f9",
    green: "#22c55e", pink: "#ec4899",
  };
}

type GeneratedTenantVertical = "food" | "services" | "creative";

function buildFeatures(vertical: GeneratedTenantVertical) {
  const base = {
    website: true, onlineMenu: true, takeaway: false, tableOrders: false,
    orderKiosk: false, kitchenDisplay: false, dinerSeparation: false,
    reservations: true, productAvailability: true, upselling: false,
    crm: false, analytics: false, takeawaySlots: false, deliveryHub: false,
    inventoryFoodCost: false, printStations: false, staffRoles: false,
    multiLocation: false, favorites: false, reviews: true, gallery: true,
  };
  if (vertical === "creative") {
    return {
      ...base,
      onlineMenu: false,
      reservations: false,
      productAvailability: false,
      crm: true,
      analytics: true,
      staffRoles: true,
      pressKit: true,
      worksCatalog: true,
      creativeBooking: true,
      rightsRoyalties: true,
      reputationReviews: true,
      fanbaseCommunity: true,
      tablePlanner: false,
    };
  }
  return vertical === "services" ? { ...base, tablePlanner: true } : { ...base, tablePlanner: false };
}

function enc(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64");
}

function dec(b64: string): string {
  return Buffer.from(b64.replace(/\n/g, ""), "base64").toString("utf-8");
}

function toPascal(slug: string): string {
  return slug.split(/[-_]/).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

// ─── Generatori contenuto file ────────────────────────────────────────────────

function generateCss(slug: string, primary: string): string {
  return `/* ${slug} — CSS tokens. Personalizza prima del deploy. */
:root {
  --${slug}-primary: ${primary};
  --${slug}-primary-dark: ${primary};
  --${slug}-accent: ${primary};
  --${slug}-bg: #ffffff;
  --${slug}-ink: #0f172a;
  --${slug}-surface: #f8fafc;
  --${slug}-border: rgba(15,23,42,0.1);
}
`;
}

function generateComponent(pascal: string, businessName: string, vertical: string): string {
  return `"use client";

// TODO: implementa la UI custom per ${businessName} (verticale: ${vertical})
export function ${pascal}Page() {
  return (
    <main>
      <h1>${businessName}</h1>
      <p>Sito in costruzione.</p>
    </main>
  );
}
`;
}

function generateFlagsConst(slug: string, vertical: GeneratedTenantVertical): string {
  const name = `${slug.toUpperCase().replace(/-/g, "_")}_MODULE_FLAGS`;
  const flags =
    vertical === "creative"
      ? `{
  website: true,
  onlineMenu: false,
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: false,
  tablePlanner: false,
  productAvailability: false,
  upselling: false,
  crm: true,
  analytics: true,
  takeawaySlots: false,
  deliveryHub: false,
  cashRegister: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: true,
  multiLocation: false,
  favorites: false,
  reviews: true,
  gallery: true,
  shop: false,
  slabbby: false,
  aiPhone: false,
  aiWhatsapp: false,
  hubriseSync: false,
  payments: false,
  pressKit: true,
  worksCatalog: true,
  creativeBooking: true,
  rightsRoyalties: true,
  reputationReviews: true,
  fanbaseCommunity: true,
}`
      : vertical === "food"
        ? `{
  website: true,
  onlineMenu: true,
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: true,
  tablePlanner: false,
  productAvailability: true,
  upselling: false,
  crm: false,
  analytics: false,
  takeawaySlots: false,
  deliveryHub: false,
  cashRegister: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: false,
  multiLocation: false,
  favorites: false,
  reviews: true,
  gallery: true,
}`
        : `{
  website: true,
  onlineMenu: true,
  takeaway: false,
  tableOrders: false,
  orderKiosk: false,
  kitchenDisplay: false,
  dinerSeparation: false,
  reservations: true,
  tablePlanner: true,
  productAvailability: true,
  upselling: false,
  crm: false,
  analytics: false,
  takeawaySlots: false,
  deliveryHub: false,
  cashRegister: false,
  inventoryFoodCost: false,
  printStations: false,
  staffRoles: false,
  multiLocation: false,
  favorites: false,
  reviews: true,
  gallery: true,
}`;

  return `/** ${slug}: moduli iniziali verticale ${vertical}. Aggiorna dopo l'onboarding. */\nexport const ${name}: TenantFeatureFlags = ${flags};\n`;
}

function patchRegistry(
  src: string,
  slug: string,
  officialDomain: string,
  vertical: GeneratedTenantVertical,
  businessName: string,
  primary: string,
): string {
  const constName = `${slug.toUpperCase().replace(/-/g, "_")}_MODULE_FLAGS`;
  const flagsBlock = generateFlagsConst(slug, vertical);

  const tenantEntry = `  // ── ${businessName} ─────────────────────────────────────────────────────────
  {
    id: "${slug}",
    name: "${businessName}",
    label: "${businessName}",
    vertical: "${vertical}",
    domains: [], // dominio ufficiale previsto: ${officialDomain}; si attiva solo quando il lead diventa tenant.
    previewSlug: "${slug}",
    enabled: true,
    status: "trattativa",
    theme: {
      red: "${primary}",
      redDark: "${primary}",
      peach: "#f1f5f9",
      cream: "#ffffff",
      ink: "#0f172a",
      brick: "#1e293b",
      mustard: "${primary}",
      mustardSoft: "#f1f5f9",
      green: "#22c55e",
      pink: "#ec4899",
    },
    features: ${constName},
  },`;

  // Inserisci la flags const prima di "export const TENANTS"
  const withFlags = src.replace(
    "export const TENANTS: TenantProfile[] = [",
    `${flagsBlock}\nexport const TENANTS: TenantProfile[] = [`,
  );

  // Appendi la entry prima della chiusura del TENANTS array
  return withFlags.replace(
    "\n];\n\nexport function findTenantById",
    `\n${tenantEntry}\n];\n\nexport function findTenantById`,
  );
}

function patchContent(src: string, slug: string, businessName: string): string {
  const varName = `${slug.replace(/-/g, "_")}Content`;

  const block = `
const ${varName}: TenantContent = {
  logoSrc: "/${slug}/logo.svg",
  logoAlt: "${businessName}",
  showcaseLogoSrc: "/${slug}/hero.jpg",
  showcaseLogoAlt: "${businessName}",
  description: "${businessName}",
  url: "",
  social: { instagram: "", facebook: "", instagramLabel: "", facebookLabel: "" },
  contact: { phone: "", whatsappDigits: "", whatsappMessage: "" },
  address: { street: "", zip: "", city: "", province: "", full: "" },
  maps: { searchUrl: "", embedUrl: "" },
  hero: {
    eyebrow: "",
    titleLead: "${businessName}",
    titleAccent: ".",
    body: "",
    backdrop: "/${slug}/hero.jpg",
    ctaLabel: "Contattaci",
  },
  soulsIntro: { eyebrow: "", titleLead: "", titleAccent: "", body: "" },
  souls: [],
  dishesIntro: { eyebrow: "", title: "", subtitle: "" },
  dishes: [],
  findUs: { eyebrow: "", titleLead: "", titleAccent: "", body: "", mapTitle: "" },
  footer: { tagline: "", body: "" },
  delivery: { title: "", body: "", partners: [] },
};
`;

  // Inserisci il blocco content prima dell'import di findTenantById
  const withBlock = src.replace(
    '\nimport { findTenantById } from "./tenant-registry";',
    `${block}\nimport { findTenantById } from "./tenant-registry";`,
  );

  // Aggiungi l'if case dentro getTenantContent prima del commento "Ogni tenant"
  return withBlock.replace(
    "  // Ogni tenant deve avere il proprio blocco content sopra.",
    `  if (tenantId === "${slug}") return ${varName};\n  // Ogni tenant deve avere il proprio blocco content sopra.`,
  );
}

// ─── Route handler ────────────────────────────────────────────────────────────

async function requireDemoPermission() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;
  const { data: siteadmin } = await supabase
    .from("siteadmin")
    .select("role")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();
  return isSiteadminRole(siteadmin?.role) && hasAdminPermission(siteadmin.role, "crm:demo");
}

export async function POST(req: NextRequest) {
  if (!await requireDemoPermission()) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
  }

  // Supporta sia multipart/form-data (con file) che application/json (senza)
  const ct = req.headers.get("content-type") ?? "";
  let tenantSlug: string, domain: string, vertical: GeneratedTenantVertical,
    businessName: string, primaryColor: string, leadId: string,
    address: string, city: string, ownerPhone: string;
  let animaFile: File | null = null;

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    tenantSlug    = fd.get("tenantSlug") as string;
    domain        = fd.get("domain") as string;
    vertical      = fd.get("vertical") as GeneratedTenantVertical;
    businessName  = fd.get("businessName") as string;
    primaryColor  = fd.get("primaryColor") as string;
    leadId        = fd.get("leadId") as string;
    address       = (fd.get("address") as string | null) ?? "";
    city          = (fd.get("city") as string | null) ?? "";
    ownerPhone    = (fd.get("ownerPhone") as string | null) ?? "";
    animaFile     = (fd.get("animaFile") as File | null) ?? null;
    // Scarta il file se è vuoto (input non compilato)
    if (animaFile && animaFile.size === 0) animaFile = null;
  } else {
    const body = (await req.json()) as {
      tenantSlug: string; domain: string; vertical: GeneratedTenantVertical;
      businessName: string; primaryColor: string; leadId: string;
      address?: string; city?: string; ownerPhone?: string;
    };
    ({ tenantSlug, domain, vertical, businessName, primaryColor, leadId } = body);
    address = body.address ?? "";
    city = body.city ?? "";
    ownerPhone = body.ownerPhone ?? "";
  }

  if (!tenantSlug || !domain || !vertical || !businessName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!address.trim()) {
    return NextResponse.json(
      { error: "Indirizzo della sede obbligatorio: ogni tenant nasce con una sede." },
      { status: 400 },
    );
  }

  const branch = `demo/${tenantSlug}`;
  const pascal = toPascal(tenantSlug);
  const demoUrl =
    vertical === "creative"
      ? `https://demo.weuseorpheo.com/${tenantSlug}`
      : vertical === "services"
        ? `https://demo.bizery.it/${tenantSlug}`
        : `https://demo.menuary.it/${tenantSlug}`;

  try {
    // 1. SHA del main → crea branch
    const mainRef = await gh<{ object: { sha: string } }>("/git/ref/heads/main");
    await gh("/git/refs", "POST", {
      ref: `refs/heads/${branch}`,
      sha: mainRef.object.sha,
    });

    // 2. CSS tokens
    await gh(`/contents/src/styles/tenants/${tenantSlug}.css`, "PUT", {
      message: `feat(tenant/${tenantSlug}): add CSS tokens`,
      branch,
      content: enc(generateCss(tenantSlug, primaryColor)),
    });

    // 3. Componente stub
    await gh(
      `/contents/src/components/tenants/${tenantSlug}/pages/${pascal}Page.tsx`,
      "PUT",
      {
        message: `feat(tenant/${tenantSlug}): add page component stub`,
        branch,
        content: enc(generateComponent(pascal, businessName, vertical)),
      },
    );

    // 4. Patcha tenant-registry.ts
    const regFile = await gh<{ content: string; sha: string }>(
      `/contents/src/lib/tenant-registry.ts?ref=${branch}`,
    );
    await gh(`/contents/src/lib/tenant-registry.ts`, "PUT", {
      message: `feat(tenant/${tenantSlug}): register in tenant-registry`,
      branch,
      sha: regFile.sha,
      content: enc(
        patchRegistry(dec(regFile.content), tenantSlug, domain, vertical, businessName, primaryColor),
      ),
    });

    // 5. Patcha tenant-content.ts
    const cntFile = await gh<{ content: string; sha: string }>(
      `/contents/src/lib/tenant-content.ts?ref=${branch}`,
    );
    await gh(`/contents/src/lib/tenant-content.ts`, "PUT", {
      message: `feat(tenant/${tenantSlug}): add content stub`,
      branch,
      sha: cntFile.sha,
      content: enc(patchContent(dec(cntFile.content), tenantSlug, businessName)),
    });

    // 6. Commit Anima/Figma (opzionale) — un solo commit via GitHub Tree API
    let animaFileCount = 0;
    let animaError: string | null = null;
    if (animaFile) {
      try {
        const buffer = new Uint8Array(await animaFile.arrayBuffer());
        const files = extractAnimaFiles(animaFile, buffer);
        await commitAnimaToGitHub(branch, tenantSlug, files);
        animaFileCount = files.length;
      } catch (err) {
        // Non blocca la creazione della PR — segnala solo nel body
        animaError = err instanceof Error ? err.message : "Errore sconosciuto";
      }
    }

    const figmaUrl = animaFileCount > 0
      ? (vertical === "creative"
          ? `https://demo.weuseorpheo.com/${tenantSlug}/figma`
          : vertical === "services"
            ? `https://demo.bizery.it/${tenantSlug}/figma`
            : `https://demo.menuary.it/${tenantSlug}/figma`)
      : null;

    // 7. Apri PR
    const animaSection = animaFile
      ? animaError
        ? [
            "",
            "### ⚠️ Import Figma (errore)",
            `\`\`\``,
            animaError,
            `\`\`\``,
          ]
        : [
            "",
            "### Design Figma importato",
            `- **File**: \`${animaFile.name}\` (${animaFileCount} file in \`public/${tenantSlug}/anima/\`)`,
            `- **Preview Figma**: ${figmaUrl}`,
            `- [ ] Sostituire le sezioni statiche con i moduli reali (\`<AnimaSlot />\`)`,
            `- [ ] Collegare i dati del tenant al design importato`,
          ]
      : [];

    const pr = await gh<{ html_url: string; number: number }>("/pulls", "POST", {
      title: `Demo tenant: ${businessName} (${tenantSlug})`,
      head: branch,
      base: "main",
      body: [
        "## Nuova demo generata automaticamente",
        "",
        `- **ID**: \`${tenantSlug}\``,
        `- **Nome**: ${businessName}`,
        `- **Link demo**: ${demoUrl}`,
        `- **Dominio ufficiale previsto**: ${domain}`,
        `- **Verticale**: ${vertical}`,
        `- **Lead CRM**: ${leadId}`,
        ...animaSection,
        "",
        "### Checklist dev prima della presentazione demo",
        `- [ ] UI custom in \`src/components/tenants/${tenantSlug}/\``,
        `- [ ] CSS tokens definitivi in \`src/styles/tenants/${tenantSlug}.css\``,
        `- [ ] Asset in \`public/${tenantSlug}/\``,
        `- [ ] Contenuti reali in \`tenant-content.ts\``,
        `- [ ] Lasciare il dominio ufficiale non attivo finché il lead non va in venduto`,
      ].join("\n"),
    });

    // 8. INSERT tenant + prima sede in DB (atomico via RPC)
    //    La PR sopra modifica il registry in codice; qui creiamo la riga DB
    //    che alimenta le query runtime (hours, locations, admin_users, ecc.).
    //    Un tenant non può esistere senza almeno una sede → indirizzo richiesto.
    let dbTenantCreated = false;
    let dbLocationId: string | null = null;
    let dbError: string | null = null;
    const db = createSupabaseServiceClient();
    if (db) {
      // Cast RPC: i tipi vengono dalla migrazione 20260526; rigenera con `supabase gen types`.
      const rpcCall = db.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: { tenant_id: string; location_id: string }[] | null; error: { message: string } | null }>;
      const { data: rpcData, error: rpcErr } = await rpcCall("create_tenant_with_location", {
        p_tenant_id:      tenantSlug,
        p_name:           businessName,
        p_label:          businessName,
        p_vertical:       vertical,
        p_status:         "trattativa",
        p_domains:        [],
        p_preview_slug:   tenantSlug,
        p_theme:          buildTheme(primaryColor),
        p_features:       buildFeatures(vertical),
        p_location_slug:  "principale",
        p_location_name:  "Sede principale",
        p_address:        address.trim(),
        p_city:           city.trim() || null,
        p_phone:          null,
        p_email:          null,
      });
      if (rpcErr) {
        dbError = rpcErr.message;
      } else {
        dbTenantCreated = true;
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        dbLocationId = row?.location_id ?? null;
        try {
          await upsertTenantDemoControl({
            tenantId: tenantSlug,
            previewSlug: tenantSlug,
            vertical,
          });
        } catch (controlErr) {
          dbError = controlErr instanceof Error ? controlErr.message : "tenant_demo_control_failed";
        }
        try {
          await upsertTenantSupportAdminContact({
            tenantId: tenantSlug,
            phone: ownerPhone,
            displayName: businessName,
            permissions: { source: "admin_generate_tenant", leadId },
          });
        } catch (contactErr) {
          const message = contactErr instanceof Error ? contactErr.message : "tenant_support_contact_failed";
          dbError = dbError ? `${dbError}; ${message}` : message;
        }
      }
    } else {
      dbError = "Supabase service client non disponibile";
    }

    return NextResponse.json({
      success: true,
      pr_url: pr.html_url,
      pr_number: pr.number,
      demo_url: demoUrl,
      figma_url: figmaUrl,
      db_tenant_created: dbTenantCreated,
      db_location_id: dbLocationId,
      db_error: dbError,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
