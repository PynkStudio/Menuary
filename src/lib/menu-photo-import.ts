import type { PriceFormat } from "@/lib/menu-data";

export type ExtractedMenuPhotoItem = {
  categoryName: string;
  name: string;
  description: string;
  price: number | null;
  tags: string[];
  confidence: number;
  needsPhoto: boolean;
  sourceNote: string;
};

export type ExtractedMenuPhotoResult = {
  items: ExtractedMenuPhotoItem[];
  warnings: string[];
  rawText: string;
};

type OpenAITextContent = {
  type: "input_text";
  text: string;
};

type OpenAIImageContent = {
  type: "input_image";
  image_url: string;
  detail: "high";
};

const MENU_PHOTO_IMPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items", "warnings", "rawText"],
  properties: {
    rawText: { type: "string" },
    warnings: {
      type: "array",
      items: { type: "string" },
    },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "categoryName",
          "name",
          "description",
          "price",
          "tags",
          "confidence",
          "needsPhoto",
          "sourceNote",
        ],
        properties: {
          categoryName: { type: "string" },
          name: { type: "string" },
          description: { type: "string" },
          price: {
            anyOf: [{ type: "number" }, { type: "null" }],
          },
          tags: {
            type: "array",
            items: { type: "string" },
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },
          needsPhoto: { type: "boolean" },
          sourceNote: { type: "string" },
        },
      },
    },
  },
};

function sanitizePrice(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function sanitizeItem(item: Partial<ExtractedMenuPhotoItem>): ExtractedMenuPhotoItem | null {
  const name = typeof item.name === "string" ? item.name.trim() : "";
  if (!name) return null;
  const categoryName =
    typeof item.categoryName === "string" && item.categoryName.trim()
      ? item.categoryName.trim()
      : "Senza categoria";
  return {
    categoryName,
    name,
    description: typeof item.description === "string" ? item.description.trim() : "",
    price: sanitizePrice(item.price),
    tags: Array.isArray(item.tags)
      ? item.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean)
      : [],
    confidence:
      typeof item.confidence === "number" && Number.isFinite(item.confidence)
        ? Math.max(0, Math.min(1, item.confidence))
        : 0.6,
    needsPhoto: Boolean(item.needsPhoto),
    sourceNote: typeof item.sourceNote === "string" ? item.sourceNote.trim() : "",
  };
}

function parseResponseText(payload: unknown): string {
  const response = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };
  if (typeof response.output_text === "string") return response.output_text;
  for (const output of response.output ?? []) {
    for (const content of output.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }
  return "";
}

export function normalizeExtractedMenuPhotoResult(value: unknown): ExtractedMenuPhotoResult {
  const parsed = value as Partial<ExtractedMenuPhotoResult>;
  const items = Array.isArray(parsed.items)
    ? parsed.items.map((item) => sanitizeItem(item)).filter((item): item is ExtractedMenuPhotoItem => Boolean(item))
    : [];
  return {
    items,
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((warning): warning is string => typeof warning === "string").map((warning) => warning.trim()).filter(Boolean)
      : [],
    rawText: typeof parsed.rawText === "string" ? parsed.rawText.trim() : "",
  };
}

export async function extractMenuItemsFromImage(params: {
  imageDataUrl: string;
  locale?: string;
  context?: string;
}): Promise<ExtractedMenuPhotoResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("openai_api_key_missing");

  const text: OpenAITextContent = {
    type: "input_text",
    text: [
      "Leggi questa foto di un vecchio menu, lavagna o appunti a penna e restituisci JSON strutturato.",
      "Riconosci piu elementi se presenti. Ogni riga/prodotto deve diventare un item distinto.",
      "Non inventare elementi mancanti. Se un prezzo e ambiguo usa null e aggiungi una warning.",
      "Usa categoryName dal contesto visivo o una categoria ragionevole. La foto del singolo articolo e opzionale: needsPhoto deve essere true solo se dal testo si capisce che il menu prevede una foto/prodotto in evidenza.",
      `Lingua preferita: ${params.locale ?? "it"}.`,
      params.context ? `Contesto operativo: ${params.context}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  const image: OpenAIImageContent = {
    type: "input_image",
    image_url: params.imageDataUrl,
    detail: "high",
  };

  const body = {
    model: process.env.OPENAI_MENU_PHOTO_MODEL || "gpt-5-mini",
    input: [
      {
        role: "user",
        content: [text, image],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "menu_photo_import",
        strict: true,
        schema: MENU_PHOTO_IMPORT_SCHEMA,
      },
    },
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`openai_menu_photo_failed:${response.status}:${errorBody.slice(0, 240)}`);
  }

  const payload = await response.json();
  const outputText = parseResponseText(payload);
  if (!outputText) throw new Error("openai_menu_photo_empty_response");
  return normalizeExtractedMenuPhotoResult(JSON.parse(outputText));
}

export function priceToMenuFormat(price: number | null): PriceFormat {
  return { kind: "single", value: price ?? 0 };
}

export function slugifyMenuCode(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || `voce-${Date.now().toString(36)}`;
}
