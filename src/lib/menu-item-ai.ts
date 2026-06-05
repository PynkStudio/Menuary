/**
 * Funzioni AI per l'editor piatto: ingredienti/allergeni, riscrivi descrizione, traduci.
 * Usano l'API OpenAI Responses direttamente (stesso pattern di menu-photo-import.ts).
 */

const OPENAI_API = "https://api.openai.com/v1/responses";
const MODEL = process.env.OPENAI_MENU_ITEM_AI_MODEL ?? "gpt-4o-mini";

// ---------- helpers ---------------------------------------------------------

function openAiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("openai_api_key_missing");
  return key;
}

function parseText(payload: unknown): string {
  const r = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (typeof r.output_text === "string") return r.output_text;
  for (const o of r.output ?? []) {
    for (const c of o.content ?? []) {
      if (c.type === "output_text" && typeof c.text === "string") return c.text;
    }
  }
  return "";
}

async function callOpenAI(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      authorization: `Bearer ${openAiKey()}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`openai_error:${res.status}:${err.slice(0, 240)}`);
  }

  const payload = await res.json();
  const text = parseText(payload);
  if (!text) throw new Error("openai_empty_response");
  return text;
}

function buildVoiceContext(voice: AiVoice | null): string {
  if (!voice) return "";
  const parts: string[] = [];
  if (voice.tone) parts.push(`Tono di voce: ${voice.tone}.`);
  if (voice.audience) parts.push(`Pubblico target: ${voice.audience}.`);
  if (voice.keywords) parts.push(`Parole chiave del brand: ${voice.keywords}.`);
  if (voice.do_examples) parts.push(`Esempi di stile corretto: ${voice.do_examples}.`);
  if (voice.dont_examples) parts.push(`Esempi da evitare: ${voice.dont_examples}.`);
  return parts.length > 0 ? `\n\nStile del ristorante:\n${parts.join("\n")}` : "";
}

// ---------- types -----------------------------------------------------------

export type AiVoice = {
  tone: string;
  audience: string;
  keywords: string;
  do_examples: string;
  dont_examples: string;
};

export type SuggestIngredientsResult = {
  ingredients: string[];
  allergens: string[];
  disclaimer: string;
};

export type RewriteDescriptionResult = {
  description: string;
};

export type TranslateItemResult = {
  name: string;
  description: string;
  ingredients: string[];
};

// ---------- suggest ingredients & allergens ---------------------------------

export async function suggestIngredients(params: {
  name: string;
  description?: string;
  imageUrl?: string;
  voice: AiVoice | null;
}): Promise<SuggestIngredientsResult> {
  const system = [
    "Sei un assistente per la gestione di menu di ristoranti.",
    "Dato il nome (e opzionalmente la descrizione) di un piatto, suggerisci una lista realistica di ingredienti principali e gli allergeni EU 1169/2011 probabilmente presenti.",
    "Restituisci SOLO JSON valido in questo formato esatto:",
    '{ "ingredients": ["ing1","ing2",...], "allergens": ["glutine","latte",...] }',
    "Gli allergeni devono essere scritti in italiano e devono appartenere ai 14 allergeni previsti dalla normativa UE.",
    "Non inventare: se non sei sicuro di un allergene non includerlo.",
    buildVoiceContext(params.voice),
  ]
    .filter(Boolean)
    .join("\n");

  const user = [
    `Nome piatto: ${params.name}`,
    params.description ? `Descrizione: ${params.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callOpenAI(system, user);

  let parsed: { ingredients?: unknown; allergens?: unknown };
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("openai_parse_error");
  }

  return {
    ingredients: Array.isArray(parsed.ingredients)
      ? (parsed.ingredients as string[]).filter((x) => typeof x === "string" && x.trim())
      : [],
    allergens: Array.isArray(parsed.allergens)
      ? (parsed.allergens as string[]).filter((x) => typeof x === "string" && x.trim())
      : [],
    disclaimer:
      "L'AI può commettere errori: verifica sempre ingredienti e allergeni prima di pubblicare.",
  };
}

// ---------- rewrite description ---------------------------------------------

export async function rewriteDescription(params: {
  name: string;
  currentDescription?: string;
  voice: AiVoice | null;
}): Promise<RewriteDescriptionResult> {
  const system = [
    "Sei un copywriter esperto di menu per ristoranti.",
    "Riscrivi la descrizione del piatto mantenendo fedeltà agli ingredienti reali.",
    "La descrizione deve essere concisa (max 2 frasi), evocativa e coerente con lo stile del ristorante.",
    "Restituisci SOLO la descrizione riscritta, senza virgolette o prefissi.",
    buildVoiceContext(params.voice),
  ]
    .filter(Boolean)
    .join("\n");

  const user = [
    `Nome piatto: ${params.name}`,
    params.currentDescription
      ? `Descrizione attuale: ${params.currentDescription}`
      : "Nessuna descrizione disponibile.",
  ].join("\n");

  const text = await callOpenAI(system, user);
  return { description: text.trim() };
}

// ---------- translate -------------------------------------------------------

const LANG_LABELS: Record<string, string> = {
  it: "italiano",
  en: "inglese",
  de: "tedesco",
  fr: "francese",
  es: "spagnolo",
  pt: "portoghese",
  nl: "olandese",
  da: "danese",
  sv: "svedese",
  nb: "norvegese",
  fi: "finlandese",
  pl: "polacco",
  cs: "ceco",
  sl: "sloveno",
  hr: "croato",
  sq: "albanese",
  el: "greco",
  zh: "cinese semplificato",
  ja: "giapponese",
};

export async function translateItem(params: {
  name?: string;
  description?: string;
  ingredients?: string[];
  fromLang: string;
  toLang: string;
  voice: AiVoice | null;
}): Promise<TranslateItemResult> {
  const from = LANG_LABELS[params.fromLang] ?? params.fromLang;
  const to = LANG_LABELS[params.toLang] ?? params.toLang;

  const system = [
    `Sei un traduttore professionista specializzato in menu di ristoranti.`,
    `Traduci dal ${from} al ${to} i campi richiesti del piatto.`,
    `Mantieni il tono del ristorante e adatta le espressioni alla cultura target senza perdere il significato originale.`,
    `Restituisci SOLO JSON valido in questo formato esatto:`,
    `{ "name": "...", "description": "...", "ingredients": ["..."] }`,
    `Il campo "ingredients" deve essere un array di stringhe tradotte (può essere vuoto).`,
    buildVoiceContext(params.voice),
  ]
    .filter(Boolean)
    .join("\n");

  const user = [
    params.name ? `Nome: ${params.name}` : "",
    params.description ? `Descrizione: ${params.description}` : "",
    params.ingredients?.length
      ? `Ingredienti: ${params.ingredients.join(", ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const raw = await callOpenAI(system, user);

  let parsed: { name?: unknown; description?: unknown; ingredients?: unknown };
  try {
    parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    throw new Error("openai_parse_error");
  }

  return {
    name: typeof parsed.name === "string" ? parsed.name.trim() : params.name ?? "",
    description:
      typeof parsed.description === "string" ? parsed.description.trim() : "",
    ingredients: Array.isArray(parsed.ingredients)
      ? (parsed.ingredients as string[]).filter((x) => typeof x === "string" && x.trim())
      : [],
  };
}
