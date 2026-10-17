/**
 * Pack remoto del presentatore AYS: battute universali pre-registrate,
 * template con nome e titoli narrativi. La sorgente è
 * `content/ays-presenter/pack.<locale>.json`; `npm run ays:pack` sintetizza le
 * clip mancanti e pubblica il manifest in `ays_presenter_packs`. Gli host
 * tvOS/Mac lo sincronizzano: cambiare una riga qui non richiede un rilascio.
 *
 * Il formato è condiviso con `tvos/Sources/AYSHostCore/PresenterLineBook.swift`
 * nella repo AYS: un cambio incompatibile richiede un nuovo `format`.
 */

export const AYS_PACK_FORMAT = 1;
export const AYS_PACK_BUCKET = "ays-presenter-pack";

export type PackIntensity = "any" | "neutral" | "savage";

export type PackSourceVariant = {
  /** Stabile e unico nella chiave: è l'identità della riga per sottotitoli e log. */
  id: string;
  text: string;
  /** Incrementare per registrare di nuovo la stessa frase (nuova clip, stesso testo). */
  take?: number;
  intensity?: PackIntensity;
};

export type PackSource = {
  format: number;
  locale: string;
  lines: Record<string, PackSourceVariant[]>;
  templates: Record<string, Omit<PackSourceVariant, "take">[]>;
  titles: Record<string, string>;
};

export type PackClip = { sha256: string; bytes: number; identity: string };

export type PackManifest = {
  format: number;
  locale: string;
  revision: number;
  publishedAt: string;
  voice: { pack: string; live: string };
  lines: Record<string, { id: string; text: string; intensity: PackIntensity; clip: PackClip }[]>;
  templates: Record<string, { id: string; text: string; intensity: PackIntensity }[]>;
  titles: Record<string, string>;
};

/** Template noti all'app e segnaposto obbligatori. Altre chiavi vengono ignorate dall'host. */
export const PACK_TEMPLATE_PLACEHOLDERS: Record<string, string[]> = {
  "title.named": ["name", "title"],
  "title.anonymous": ["title"],
  "gameEnd.named": ["name"],
  "lobby.returning.named": ["name", "title"],
  "lobby.returning.anonymous": ["title"],
  "result.title.king.named": ["name", "title"],
  "result.title.doesNotRead.named": ["name", "title"],
  "result.mixed.oneWrong.named": ["name"],
  "result.player.stillZero": ["name"],
  "result.player.firstPointLate": ["name"],
  "result.player.wrongStreak3": ["name"],
  "result.player.lss.lastLife": ["name"],
  "result.player.lss.losingLives": ["name"],
  /** Callback per chi viene preso in giro di nuovo nella stessa partita. */
  "result.player.again": ["name"],
};

const RESULT_MECHANICS = ["button", "math", "counting", "reading", "waiting", "timing", "memory", "direction", "perception"];
for (const base of ["result.mixed.oneWrong", "result.player.stillZero", "result.player.firstPointLate", "result.player.wrongStreak3"]) {
  for (const mechanic of RESULT_MECHANICS) PACK_TEMPLATE_PLACEHOLDERS[`${base}.mechanic.${mechanic}`] = ["name"];
}

export const PACK_TITLE_KEYS = ["king", "kingUndisputed", "doesNotRead"] as const;

const KEY_PATTERN = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)*$/;
const ID_PATTERN = /^[A-Za-z0-9-]{1,32}$/;
const MAX_LINE_CHARS = 180;
const SUPPORTED_LOCALES = new Set(["en", "it", "fr", "es", "pt", "de"]);

/** Le stesse regole dell'host: maiuscolo, breve, nessun segnaposto sconosciuto. */
export function validatePackSource(source: PackSource): string[] {
  const errors: string[] = [];
  if (source.format !== AYS_PACK_FORMAT) errors.push(`format ${source.format} non supportato`);
  if (!SUPPORTED_LOCALES.has(source.locale)) errors.push(`locale ${source.locale} non supportata`);

  const checkText = (where: string, text: string) => {
    if (!text.trim()) errors.push(`${where}: testo vuoto`);
    if (text.length > MAX_LINE_CHARS) errors.push(`${where}: oltre ${MAX_LINE_CHARS} caratteri`);
    const withoutSlots = text.replace(/\{(name|title)\}/g, "");
    if (withoutSlots !== withoutSlots.toLocaleUpperCase(source.locale)) errors.push(`${where}: deve essere maiuscolo`);
    for (const slot of text.matchAll(/\{([^}]*)\}/g)) {
      if (slot[1] !== "name" && slot[1] !== "title") errors.push(`${where}: segnaposto {${slot[1]}} sconosciuto`);
    }
  };

  const checkVariants = (group: string, key: string, variants: { id: string; text: string; intensity?: PackIntensity }[]) => {
    if (!KEY_PATTERN.test(key)) errors.push(`${group}.${key}: chiave non valida`);
    if (!Array.isArray(variants) || variants.length === 0) errors.push(`${group}.${key}: nessuna variante`);
    const seen = new Set<string>();
    for (const variant of variants ?? []) {
      const where = `${group}.${key}.${variant.id}`;
      if (!ID_PATTERN.test(variant.id ?? "")) errors.push(`${where}: id non valido`);
      if (seen.has(variant.id)) errors.push(`${where}: id duplicato`);
      seen.add(variant.id);
      if (variant.intensity && !["any", "neutral", "savage"].includes(variant.intensity)) {
        errors.push(`${where}: intensity non valida`);
      }
      checkText(where, variant.text ?? "");
    }
  };

  for (const [key, variants] of Object.entries(source.lines ?? {})) {
    checkVariants("lines", key, variants);
    for (const variant of variants ?? []) {
      if (/\{/.test(variant.text)) errors.push(`lines.${key}.${variant.id}: le battute pre-registrate non hanno segnaposto`);
    }
  }
  for (const [key, variants] of Object.entries(source.templates ?? {})) {
    checkVariants("templates", key, variants);
    const required = PACK_TEMPLATE_PLACEHOLDERS[key];
    if (!required) {
      errors.push(`templates.${key}: template sconosciuto all'app`);
      continue;
    }
    for (const variant of variants ?? []) {
      const used = [...variant.text.matchAll(/\{(name|title)\}/g)].map((m) => m[1]);
      for (const slot of required) {
        if (!used.includes(slot)) errors.push(`templates.${key}.${variant.id}: manca {${slot}}`);
      }
      for (const slot of used) {
        if (!required.includes(slot)) errors.push(`templates.${key}.${variant.id}: {${slot}} non ammesso qui`);
      }
    }
  }
  for (const [key, text] of Object.entries(source.titles ?? {})) {
    if (!(PACK_TITLE_KEYS as readonly string[]).includes(key)) errors.push(`titles.${key}: titolo sconosciuto all'app`);
    checkText(`titles.${key}`, text);
  }
  return errors;
}

export function isPackManifest(value: unknown): value is PackManifest {
  if (!value || typeof value !== "object") return false;
  const m = value as Partial<PackManifest>;
  return typeof m.format === "number" && typeof m.revision === "number" && typeof m.lines === "object";
}
