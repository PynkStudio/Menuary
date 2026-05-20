import { NextRequest, NextResponse } from "next/server";
import { hasAdminPermission, isSiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { gh, extractAnimaFiles, commitAnimaToGitHub } from "@/lib/github-anima";

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

function generateFlagsConst(slug: string, vertical: "food" | "services"): string {
  const name = `${slug.toUpperCase().replace(/-/g, "_")}_MODULE_FLAGS`;
  const flags =
    vertical === "food"
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
  vertical: "food" | "services",
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
  let tenantSlug: string, domain: string, vertical: "food" | "services",
    businessName: string, primaryColor: string, leadId: string;
  let animaFile: File | null = null;

  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    tenantSlug    = fd.get("tenantSlug") as string;
    domain        = fd.get("domain") as string;
    vertical      = fd.get("vertical") as "food" | "services";
    businessName  = fd.get("businessName") as string;
    primaryColor  = fd.get("primaryColor") as string;
    leadId        = fd.get("leadId") as string;
    animaFile     = (fd.get("animaFile") as File | null) ?? null;
    // Scarta il file se è vuoto (input non compilato)
    if (animaFile && animaFile.size === 0) animaFile = null;
  } else {
    ({ tenantSlug, domain, vertical, businessName, primaryColor, leadId } =
      (await req.json()) as {
        tenantSlug: string; domain: string; vertical: "food" | "services";
        businessName: string; primaryColor: string; leadId: string;
      });
  }

  if (!tenantSlug || !domain || !vertical || !businessName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const branch = `demo/${tenantSlug}`;
  const pascal = toPascal(tenantSlug);
  const demoUrl = vertical === "services"
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
      ? (vertical === "services"
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

    return NextResponse.json({
      success: true,
      pr_url: pr.html_url,
      pr_number: pr.number,
      demo_url: demoUrl,
      figma_url: figmaUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
