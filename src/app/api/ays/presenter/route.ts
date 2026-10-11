import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { isAysPresenterAuthorized, isAysPresenterRateLimited } from "@/lib/ays-presenter/auth";
import {
  resolvePresenterVoice,
  SPEECH_TEXT_VERSION,
  synthesizePresenterSpeech,
} from "@/lib/ays-presenter/speech";

export const runtime = "nodejs";

type PresenterBody = {
  cueId?: unknown;
  text?: unknown;
  locale?: unknown;
  intensity?: unknown;
  cacheable?: unknown;
};

const BUCKET = "ays-presenter-cache";
const MAX_TEXT = 180;

function cleanString(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max)
    : "";
}

function audioResponse(bytes: ArrayBuffer, cache: "HIT" | "MISS", voiceTag: string) {
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
      "X-AYS-Presenter-Cache": cache,
      "X-AYS-Presenter-Voice": voiceTag,
    },
  });
}

/** Battute dinamiche (con nome o rare): cache condivisa con retention di 30 giorni. */
export async function POST(req: NextRequest) {
  if (!isAysPresenterAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (isAysPresenterRateLimited(req, "speech", 30)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  let body: PresenterBody;
  try {
    body = (await req.json()) as PresenterBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const cueId = cleanString(body.cueId, 120);
  const text = cleanString(body.text, MAX_TEXT);
  const locale = /^(it|en)(-[A-Z]{2})?$/.test(String(body.locale ?? "")) ? String(body.locale) : "it";
  const intensity = body.intensity === "savage" ? "savage" : "neutral";
  const cacheable = body.cacheable !== false;
  if (!cueId || !text) return NextResponse.json({ error: "invalid_cue" }, { status: 400 });

  const voice = resolvePresenterVoice("live");
  if (!voice) return NextResponse.json({ error: "speech_unavailable" }, { status: 503 });
  const digest = createHash("sha256")
    .update(JSON.stringify({ v: 3, t: SPEECH_TEXT_VERSION, text, locale, intensity, voice: voice.tag }))
    .digest("hex");
  const objectPath = `v3/${locale}/${digest}.mp3`;
  const supabase = createSupabaseServiceClient();

  if (cacheable && supabase) {
    const { data } = await supabase.storage.from(BUCKET).download(objectPath);
    if (data) {
      await supabase.rpc("touch_ays_presenter_cache", { p_cache_key: digest });
      return audioResponse(await data.arrayBuffer(), "HIT", voice.tag);
    }
  }

  const speech = await synthesizePresenterSpeech({ text, locale, intensity, purpose: "live" });
  if (!speech.ok) return NextResponse.json({ error: speech.error }, { status: speech.status });

  if (cacheable && supabase) {
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, speech.bytes, {
      contentType: "audio/mpeg",
      cacheControl: "31536000",
      upsert: false,
    });
    if (!uploadError || uploadError.message.toLowerCase().includes("already exists")) {
      await supabase.from("ays_presenter_cache_entries").upsert({
        cache_key: digest,
        object_path: objectPath,
        last_accessed_at: new Date().toISOString(),
      });
    }
  }
  return audioResponse(speech.bytes, "MISS", voice.tag);
}
