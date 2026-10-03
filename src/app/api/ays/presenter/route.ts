import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

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
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const requests = new Map<string, { count: number; resetsAt: number }>();

function authorized(req: NextRequest): boolean {
  const expected = process.env.AYS_PRESENTER_API_TOKEN;
  const actual = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function limited(ip: string): boolean {
  const now = Date.now();
  const current = requests.get(ip);
  if (!current || current.resetsAt <= now) {
    requests.set(ip, { count: 1, resetsAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_PER_WINDOW;
}

function cleanString(value: unknown, max: number): string {
  return typeof value === "string"
    ? value.normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max)
    : "";
}

function audioResponse(bytes: ArrayBuffer, cache: "HIT" | "MISS") {
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=86400",
      "X-AYS-Presenter-Cache": cache,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "speech_unavailable" }, { status: 503 });
  const voice = process.env.AYS_PRESENTER_VOICE || "cedar";
  const model = process.env.AYS_PRESENTER_TTS_MODEL || "gpt-4o-mini-tts";
  const digest = createHash("sha256")
    .update(JSON.stringify({ v: 2, text, locale, intensity, voice, model }))
    .digest("hex");
  const objectPath = `v2/${locale}/${digest}.mp3`;
  const supabase = createSupabaseServiceClient();
  const storage = supabase?.storage;

  if (cacheable && storage && supabase) {
    const { data } = await storage.from(BUCKET).download(objectPath);
    if (data) {
      await supabase.rpc("touch_ays_presenter_cache", { p_cache_key: digest });
      return audioResponse(await data.arrayBuffer(), "HIT");
    }
  }

  const speech = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: "mp3",
      instructions: [
        `Speak in ${locale.startsWith("it") ? "Italian" : "English"}.`,
        "You are a charismatic late-night game-show host: elegant, theatrical, dry, disappointed and funny.",
        intensity === "savage"
          ? "Deliver the roast sharply and confidently, close to the line without adding or changing any words."
          : "Keep the delivery dry and playful, never cruel.",
        "Read exactly the provided text. Do not add words, introductions, laughter or sound effects.",
      ].join(" "),
    }),
  });
  if (!speech.ok) {
    console.error("AYS presenter TTS failed", speech.status, await speech.text());
    return NextResponse.json({ error: "speech_generation_failed" }, { status: 502 });
  }

  const bytes = await speech.arrayBuffer();
  if (cacheable && storage && supabase) {
    const { error: uploadError } = await storage.from(BUCKET).upload(objectPath, bytes, {
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
  return audioResponse(bytes, "MISS");
}
