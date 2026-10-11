/**
 * Sintesi vocale del presentatore AYS. Un solo punto conosce i provider: la
 * route live e lo script del pack devono produrre la stessa voce, altrimenti
 * clip pre-registrate e battute dinamiche suonano come due persone diverse.
 *
 * Provider: ElevenLabs quando `ELEVENLABS_API_KEY` e la voce sono configurati,
 * altrimenti OpenAI. `AYS_PRESENTER_TTS_PROVIDER` forza la scelta.
 */

export type PresenterIntensity = "neutral" | "savage";
export type PresenterSpeechPurpose = "live" | "pack";

export type PresenterVoice = {
  provider: "elevenlabs" | "openai";
  voice: string;
  model: string;
  /** Identità stabile: entra nelle chiavi di cache, cambiarla rigenera tutto. */
  tag: string;
};

export type PresenterSpeechResult =
  | { ok: true; bytes: ArrayBuffer; voice: PresenterVoice }
  | { ok: false; status: number; error: string };

/** Versione della trasformazione testo→parlato; incrementarla invalida le cache. */
export const SPEECH_TEXT_VERSION = 1;

export function resolvePresenterVoice(purpose: PresenterSpeechPurpose): PresenterVoice | null {
  const forced = process.env.AYS_PRESENTER_TTS_PROVIDER;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  const elevenVoice = process.env.AYS_PRESENTER_ELEVENLABS_VOICE_ID;
  const useEleven = forced ? forced === "elevenlabs" : Boolean(elevenKey && elevenVoice);

  if (useEleven) {
    if (!elevenKey || !elevenVoice) return null;
    const model =
      purpose === "pack"
        ? process.env.AYS_PRESENTER_ELEVENLABS_PACK_MODEL || "eleven_v3"
        : process.env.AYS_PRESENTER_ELEVENLABS_LIVE_MODEL || "eleven_flash_v2_5";
    return { provider: "elevenlabs", voice: elevenVoice, model, tag: `el-${elevenVoice}-${model}` };
  }

  if (!process.env.OPENAI_API_KEY) return null;
  const voice = process.env.AYS_PRESENTER_VOICE || "cedar";
  const model = process.env.AYS_PRESENTER_TTS_MODEL || "gpt-4o-mini-tts";
  return { provider: "openai", voice, model, tag: `oa-${voice}-${model}` };
}

/**
 * Le battute sono in maiuscolo per i sottotitoli; al motore vocale arrivano in
 * minuscolo con l'iniziale di frase maiuscola, perché il tutto-maiuscolo viene
 * letto come urlato o sillabato come sigla.
 */
export function toSpokenText(text: string): string {
  const lower = text.toLocaleLowerCase("it-IT");
  return lower.replace(/(^|[.!?]\s+)(\p{L})/gu, (_, lead: string, letter: string) => lead + letter.toLocaleUpperCase("it-IT"));
}

export async function synthesizePresenterSpeech(input: {
  text: string;
  locale: string;
  intensity: PresenterIntensity;
  purpose: PresenterSpeechPurpose;
}): Promise<PresenterSpeechResult> {
  const voice = resolvePresenterVoice(input.purpose);
  if (!voice) return { ok: false, status: 503, error: "speech_unavailable" };
  const spoken = toSpokenText(input.text);
  const language = input.locale.split("-")[0];

  const response =
    voice.provider === "elevenlabs"
      ? await elevenLabsSpeech(voice, spoken, language, input.intensity)
      : await openAiSpeech(voice, spoken, language, input.intensity);

  if (!response.ok) {
    console.error("AYS presenter TTS failed", voice.provider, response.status, await response.text());
    return { ok: false, status: 502, error: "speech_generation_failed" };
  }
  return { ok: true, bytes: await response.arrayBuffer(), voice };
}

function elevenLabsSpeech(voice: PresenterVoice, text: string, language: string, intensity: PresenterIntensity) {
  const savage = intensity === "savage";
  // The fixed seed and conservative settings keep all six packs recognizably
  // the same host; v3 still gets its supported Natural stability value.
  const voiceSettings = voice.model === "eleven_v3"
    ? { stability: 0.5, similarity_boost: 0.86, style: 0.42, use_speaker_boost: true, speed: 1.03 }
    : { stability: savage ? 0.32 : 0.45, similarity_boost: 0.86, style: savage ? 0.55 : 0.35, use_speaker_boost: true, speed: 1.03 };

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.voice)}?output_format=mp3_44100_128`;
  return fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: voice.model,
      // multilingual_v2 rifiuta language_code; gli altri modelli lo usano per non sbagliare lingua sui nomi.
      ...(voice.model === "eleven_multilingual_v2" ? {} : { language_code: language }),
      voice_settings: voiceSettings,
      seed: 42817,
    }),
  });
}

function openAiSpeech(voice: PresenterVoice, text: string, language: string, intensity: PresenterIntensity) {
  return fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: voice.model,
      voice: voice.voice,
      input: text,
      response_format: "mp3",
      instructions: [
        `Speak in ${language === "it" ? "Italian" : "English"}.`,
        "You are a charismatic late-night game-show host: elegant, theatrical, dry, disappointed and funny.",
        intensity === "savage"
          ? "Deliver the roast sharply and confidently, close to the line without adding or changing any words."
          : "Keep the delivery dry and playful, never cruel.",
        "Read exactly the provided text. Do not add words, introductions, laughter or sound effects.",
      ].join(" "),
    }),
  });
}
