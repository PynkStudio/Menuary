/**
 * Pubblica il pack del presentatore AYS.
 *
 *   npm run ays:pack -- [--locale it] [--dry-run] [--prune]
 *
 * Legge `content/ays-presenter/pack.<locale>.json`, sintetizza solo le clip
 * nuove o cambiate (testo, take, intensità o voce), le carica nel bucket
 * `ays-presenter-pack` e pubblica il manifest con revisione +1. Gli host lo
 * scaricano al prossimo avvio/lobby. Una riga tolta dal JSON sparisce dagli
 * host alla sincronizzazione successiva; `--prune` cancella anche le clip non
 * più referenziate dal bucket.
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e la voce
 * (ELEVENLABS_API_KEY + AYS_PRESENTER_ELEVENLABS_VOICE_ID, o OPENAI_API_KEY).
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  AYS_PACK_BUCKET,
  AYS_PACK_FORMAT,
  isPackManifest,
  validatePackSource,
  type PackClip,
  type PackManifest,
  type PackSource,
} from "../src/lib/ays-presenter/pack";
import { resolvePresenterVoice, SPEECH_TEXT_VERSION, synthesizePresenterSpeech } from "../src/lib/ays-presenter/speech";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono obbligatorie");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function main() {
  const locale = option("locale") ?? "it";
  const dryRun = flag("dry-run");
  const source = JSON.parse(
    readFileSync(join(process.cwd(), "content/ays-presenter", `pack.${locale}.json`), "utf8"),
  ) as PackSource;

  const errors = validatePackSource(source);
  if (errors.length) {
    console.error(`Pack ${locale} non valido:\n- ${errors.join("\n- ")}`);
    process.exit(1);
  }

  const supabase = serviceClient();

  const packVoice = resolvePresenterVoice("pack");
  const liveVoice = resolvePresenterVoice("live");
  if (!packVoice || !liveVoice) throw new Error("Nessuna voce configurata (ElevenLabs o OpenAI)");

  const { data: current, error: readError } = await supabase
    .from("ays_presenter_packs")
    .select("revision, manifest")
    .eq("locale", locale)
    .eq("format", AYS_PACK_FORMAT)
    .maybeSingle();
  if (readError) throw readError;
  const previous = isPackManifest(current?.manifest) ? current.manifest : null;
  const previousClips = new Map<string, PackClip>();
  for (const variants of Object.values(previous?.lines ?? {})) {
    for (const variant of variants) previousClips.set(variant.clip.identity, variant.clip);
  }

  let synthesized = 0;
  let reused = 0;
  const lines: PackManifest["lines"] = {};
  for (const [lineKey, variants] of Object.entries(source.lines)) {
    lines[lineKey] = [];
    for (const variant of variants) {
      const intensity = variant.intensity ?? "any";
      const identity = createHash("sha256")
        .update(JSON.stringify({ t: SPEECH_TEXT_VERSION, text: variant.text, locale, intensity, take: variant.take ?? 1, voice: packVoice.tag }))
        .digest("hex");
      let clip = previousClips.get(identity);
      if (clip) {
        reused += 1;
      } else if (dryRun) {
        console.log(`[dry-run] da registrare: ${lineKey}.${variant.id} — ${variant.text}`);
        clip = { sha256: "0".repeat(64), bytes: 0, identity };
      } else {
        const speech = await synthesizePresenterSpeech({
          text: variant.text,
          locale,
          intensity: intensity === "savage" ? "savage" : "neutral",
          purpose: "pack",
        });
        if (!speech.ok) throw new Error(`Sintesi fallita per ${lineKey}.${variant.id}: ${speech.error}`);
        const bytes = Buffer.from(speech.bytes);
        const sha256 = createHash("sha256").update(bytes).digest("hex");
        const { error } = await supabase.storage
          .from(AYS_PACK_BUCKET)
          .upload(`clips/${sha256}.mp3`, bytes, { contentType: "audio/mpeg", upsert: false });
        if (error && !error.message.toLowerCase().includes("exists")) throw error;
        clip = { sha256, bytes: bytes.byteLength, identity };
        synthesized += 1;
        console.log(`registrata: ${lineKey}.${variant.id} — ${variant.text}`);
      }
      lines[lineKey].push({ id: `${lineKey}.${variant.id}`, text: variant.text, intensity, clip });
    }
  }

  const templates: PackManifest["templates"] = {};
  for (const [templateKey, variants] of Object.entries(source.templates)) {
    templates[templateKey] = variants.map((variant) => ({
      id: `${templateKey}.${variant.id}`,
      text: variant.text,
      intensity: variant.intensity ?? "any",
    }));
  }

  const body = {
    format: AYS_PACK_FORMAT,
    locale,
    voice: { pack: packVoice.tag, live: liveVoice.tag },
    lines,
    templates,
    titles: source.titles,
  };
  const unchanged =
    previous &&
    JSON.stringify({ ...previous, revision: undefined, publishedAt: undefined }) ===
      JSON.stringify({ ...body, revision: undefined, publishedAt: undefined });

  console.log(`clip: ${synthesized} registrate, ${reused} riusate`);
  if (unchanged) {
    console.log(`Pack ${locale} invariato (revisione ${previous.revision}).`);
  } else if (dryRun) {
    console.log(`[dry-run] verrebbe pubblicata la revisione ${(current?.revision ?? 0) + 1}.`);
  } else {
    const manifest: PackManifest = { ...body, revision: (current?.revision ?? 0) + 1, publishedAt: new Date().toISOString() };
    const { error } = await supabase.from("ays_presenter_packs").upsert({
      locale,
      format: AYS_PACK_FORMAT,
      revision: manifest.revision,
      manifest,
      published_at: manifest.publishedAt,
    });
    if (error) throw error;
    console.log(`Pubblicata la revisione ${manifest.revision} del pack ${locale}.`);
  }

  if (flag("prune") && !dryRun) await prune(supabase);
}

/** Toglie dal bucket le clip che nessun manifest pubblicato referenzia più. */
async function prune(supabase: ReturnType<typeof serviceClient>) {
  const { data: packs, error } = await supabase.from("ays_presenter_packs").select("manifest");
  if (error) throw error;
  const referenced = new Set<string>();
  for (const pack of packs ?? []) {
    if (!isPackManifest(pack.manifest)) continue;
    for (const variants of Object.values(pack.manifest.lines)) {
      for (const variant of variants) referenced.add(`${variant.clip.sha256}.mp3`);
    }
  }

  const stale: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error: listError } = await supabase.storage.from(AYS_PACK_BUCKET).list("clips", { limit: 100, offset });
    if (listError) throw listError;
    for (const object of data ?? []) if (!referenced.has(object.name)) stale.push(`clips/${object.name}`);
    if (!data || data.length < 100) break;
  }
  if (stale.length) {
    const { error: removeError } = await supabase.storage.from(AYS_PACK_BUCKET).remove(stale);
    if (removeError) throw removeError;
  }
  console.log(`prune: ${stale.length} clip rimosse.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
