import {
  BETA_CATEGORIES,
  BETA_KINDS,
  BETA_LANGUAGES,
  BETA_STATUSES,
  cleanBetaChannels,
  cleanFromList,
} from "@/lib/pynkstudio/beta-shared";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

export function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Normalizza il body dell'editor beta; restituisce solo i campi presenti. */
export function parseBetaInput(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  const name = str(body.name, 120);
  if (name !== undefined) out.name = name;
  const slug = str(body.slug, 60);
  if (slug !== undefined) out.slug = slugify(slug);
  for (const [key, max] of [["tagline", 200], ["description", 4000], ["version", 40]] as const) {
    const v = str(body[key], max);
    if (v !== undefined) out[key] = v || null;
  }
  const icon = str(body.icon_url, 500);
  if (icon !== undefined) out.icon_url = icon && /^https:\/\//i.test(icon) ? icon : null;
  // Il feedback può essere un modulo/link o un indirizzo email: "nome@dominio" diventa mailto:.
  const feedback = str(body.feedback_url, 500);
  if (feedback !== undefined) {
    out.feedback_url =
      /^https:\/\//i.test(feedback) || /^mailto:[^\s@]+@[^\s@]+$/i.test(feedback) ? feedback
      : /^[^\s@:/]+@[^\s@]+\.[^\s@]+$/.test(feedback) ? `mailto:${feedback}`
      : null;
  }
  if (typeof body.category === "string" && BETA_CATEGORIES.some((c) => c.id === body.category)) out.category = body.category;
  if (typeof body.kind === "string" && BETA_KINDS.some((k) => k.id === body.kind)) out.kind = body.kind;
  if (typeof body.status === "string" && BETA_STATUSES.some((s) => s.id === body.status)) out.status = body.status;
  if (body.languages !== undefined) out.languages = cleanFromList(body.languages, BETA_LANGUAGES);
  if (body.channels !== undefined) out.channels = cleanBetaChannels(body.channels);
  if (body.ends_at !== undefined) {
    const d = typeof body.ends_at === "string" && body.ends_at ? new Date(body.ends_at) : null;
    out.ends_at = d && !Number.isNaN(d.getTime()) ? d.toISOString() : null;
  }
  return out;
}
