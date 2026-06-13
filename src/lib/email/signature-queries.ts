import type { InboundEmailBrand } from "./inbound-types";

// ── Firme automatiche standard ───────────────────────────────────────────────
// Template fissi per brand compilati con i dati del profilo
// siteadmin di chi invia la mail. NON sono modificabili dal singolo utente:
// l'unica personalizzazione passa dalla pagina /admin/profilo.

const ROLE_LABEL_IT: Record<string, string> = {
  superadmin:      "Amministratore di sistema",
  admin:           "Amministratore",
  amministrazione: "Amministrazione",
  venditore:       "Consulente commerciale",
  lead_inserter:   "Sviluppo commerciale",
};

const BRAND_TEMPLATE = {
  menuary: {
    label:    "Menuary",
    tagline:  "La piattaforma dei ristoranti italiani",
    email:    "hello@menuary.it",
    website:  "menuary.it",
    accent:   "#A95F45",
    accentInk:"#743D2F",
    paper:    "#FFFAF2",
    rule:     "#E6DFD2",
  },
  bizery: {
    label:    "Bizery",
    tagline:  "La piattaforma delle attività di servizio",
    email:    "hello@bizery.it",
    website:  "bizery.it",
    accent:   "#3B6CB5",
    accentInk:"#234A85",
    paper:    "#F5F7FB",
    rule:     "#DFE5F0",
  },
  orpheo: {
    label:    "Orpheo",
    tagline:  "La piattaforma per artisti e professionisti creativi",
    email:    "hello@weuseorpheo.com",
    website:  "weuseorpheo.com",
    accent:   "#7C3AED",
    accentInk:"#4C1D95",
    paper:    "#FBFAF7",
    rule:     "#E7E0F0",
  },
  pynkstudio: {
    label:    "PynkStudio",
    tagline:  "Gruppo creativo e tecnologico",
    email:    "hello@pynkstudio.it",
    website:  "pynkstudio.it",
    accent:   "#D946A8",
    accentInk:"#9B2D7A",
    paper:    "#FDF5FA",
    rule:     "#F0DDE9",
  },
} as const;

export type AutoSignatureProfile = {
  first_name: string | null;
  last_name:  string | null;
  display_name: string | null;
  email:      string | null;
  role:       string | null;
  phone:      string | null;
  work_hours: string | null;
};

export type AutoSignature = {
  html:     string;
  fromName: string;
};

/**
 * Costruisce la firma standard del brand a partire dal profilo siteadmin
 * dell'utente che invia. La struttura è identica per tutti gli utenti dello
 * stesso brand; cambiano solo nome, ruolo, telefono e orari.
 */
export function buildAutoSignature(
  profile: AutoSignatureProfile,
  brand: InboundEmailBrand,
): AutoSignature {
  const t = BRAND_TEMPLATE[brand];

  const fullName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    profile.display_name?.trim() ||
    "";

  const roleLabel =
    (profile.role && ROLE_LABEL_IT[profile.role]) || (profile.role ?? "");

  const contactLine: string[] = [];
  if (profile.phone) {
    contactLine.push(
      `<a href="tel:${escape(profile.phone)}" style="color:${t.accentInk};text-decoration:none">${escape(profile.phone)}</a>`,
    );
  }
  if (profile.email) {
    contactLine.push(
      `<a href="mailto:${escape(profile.email)}" style="color:${t.accentInk};text-decoration:none">${escape(profile.email)}</a>`,
    );
  }

  const html = `
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;color:#1f2a26;font-size:13px;line-height:1.55">
  <tr>
    <td style="padding:14px 16px;border-left:3px solid ${t.accent};background:${t.paper};border-radius:0 6px 6px 0">
      <div style="font-size:15px;font-weight:600;color:${t.accentInk};letter-spacing:-0.005em">
        ${escape(fullName) || "&nbsp;"}
      </div>
      ${roleLabel ? `<div style="margin-top:2px;color:#52605a;font-size:12px">${escape(roleLabel)} · ${t.label}</div>` : `<div style="margin-top:2px;color:#52605a;font-size:12px">${t.label}</div>`}
      ${profile.work_hours ? `<div style="margin-top:6px;color:#6b7570;font-size:12px">Orari: ${escape(profile.work_hours)}</div>` : ""}
      ${contactLine.length ? `<div style="margin-top:8px;font-size:12px">${contactLine.join(' &nbsp;·&nbsp; ')}</div>` : ""}
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid ${t.rule};font-size:11px;color:#7a8480">
        <a href="mailto:${t.email}" style="color:#7a8480;text-decoration:none">${t.email}</a>
        &nbsp;·&nbsp;
        <a href="https://${t.website}" style="color:#7a8480;text-decoration:none">${t.website}</a>
        <div style="margin-top:2px;color:#9aa39e;font-style:italic">${t.tagline}</div>
      </div>
    </td>
  </tr>
</table>`.trim();

  const fromName = fullName || t.label;

  return { html, fromName };
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
