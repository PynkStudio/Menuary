import { NextRequest, NextResponse } from "next/server";
import { findTenantById } from "@/lib/tenant-registry";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { suggestUpsellsForOrder } from "@/lib/upselling-engine";
import { validateMenuItemsForOrderChannel } from "@/lib/menu-order-channels";
import { isMenuOrderChannel } from "@/lib/menu-channels";
import type { Json } from "@/lib/database.types";
import type { MenuOrderChannel } from "@/lib/types";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Body = {
  tenantId: string;
  messages: ChatMessage[];
  channel?: MenuOrderChannel;
  tableId?: string | null;
  locale?: string;
  cartItemIds?: string[];
  favoriteItemIds?: string[];
};

type MenuItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: Json;
  tags: string[];
  allergens: string[];
  category_id: string;
};

type AssistantPayload = {
  reply: string;
  suggestions: Array<{ itemId: string; reason: string }>;
};

type CustomerContext = {
  isVegetarian: boolean;
  dietNotes: string | null;
  preferredLanguage: string | null;
  blockedAllergens: string[];
  favoriteItemIds: string[];
  frequentItems: Array<{ itemId: string | null; name: string; count: number }>;
  recentOrders: Array<{ createdAt: string; items: string[] }>;
};

const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 800;
const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "suggestions"],
  properties: {
    reply: { type: "string" },
    suggestions: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["itemId", "reason"],
        properties: {
          itemId: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
  },
};

function parseResponseText(payload: unknown): string {
  const response = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (typeof response.output_text === "string") return response.output_text;
  return (response.output ?? [])
    .flatMap((output) => output.content ?? [])
    .filter((part) => part.type === "output_text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("\n")
    .trim();
}

function priceLabel(price: Json): string {
  if (typeof price === "number") return price.toFixed(2);
  const values: number[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) values.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  visit(price);
  return values.length ? Math.min(...values).toFixed(2) : "";
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((message): message is ChatMessage =>
      Boolean(message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string"),
    )
    .slice(-MAX_MESSAGES)
    .map((message) => ({ ...message, content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH) }))
    .filter((message) => message.content.length > 0);
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function detectBlockedAllergens(note: string | null): string[] {
  if (!note) return [];
  const text = normalizeText(note).replace(/_/g, " ");
  const aliases: Record<string, string[]> = {
    glutine: ["glutine", "celiach", "celiac", "frumento", "grano"],
    crostacei: ["crostace", "gamber", "granch", "aragost"],
    uova: ["uova", "uovo"],
    pesce: ["pesce"],
    arachidi: ["arachid"],
    soia: ["soia"],
    latte: ["latte", "lattos", "caseari"],
    frutta_guscio: ["frutta a guscio", "noci", "nocciole", "mandorle", "pistacchi"],
    sedano: ["sedano"],
    senape: ["senape"],
    sesamo: ["sesamo"],
    solfiti: ["solfit"],
    lupini: ["lupin"],
    molluschi: ["mollusc"],
  };
  return Object.entries(aliases)
    .filter(([, terms]) => terms.some((term) => text.includes(term)))
    .map(([allergen]) => allergen);
}

function isCompatibleWithProfile(item: MenuItem, context: CustomerContext | null): boolean {
  if (!context) return true;
  if (item.allergens.some((allergen) => context.blockedAllergens.includes(allergen))) return false;
  if (!context.isVegetarian) return true;
  const text = normalizeText([item.name, item.description ?? "", ...item.tags].join(" "));
  const clearlyNonVegetarian = ["carne", "manzo", "maiale", "pollo", "pesce", "salmone", "tonno", "prosciutto", "salame", "salsiccia"];
  return !clearlyNonVegetarian.some((term) => text.includes(term));
}

async function loadCustomerContext(
  svc: NonNullable<ReturnType<typeof createSupabaseServiceClient>>,
  tenantId: string,
  userId: string,
  favoriteItemIds: string[],
): Promise<CustomerContext> {
  const [{ data: profile }, { data: legacyProfile }, { data: orders }] = await Promise.all([
    svc.from("user_profiles").select("is_vegetarian,diet_notes,preferred_language").eq("user_id", userId).maybeSingle(),
    svc.from("users").select("is_vegetarian,diet_notes,preferred_language").eq("user_id", userId).maybeSingle(),
    svc
      .from("orders")
      .select("created_at,order_lines(item_id,name,qty)")
      .eq("tenant_id", tenantId)
      .eq("menuary_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);
  const source = profile ?? legacyProfile;
  const recentOrders = ((orders ?? []) as unknown as Array<{
    created_at: string;
    order_lines?: Array<{ item_id: string | null; name: string; qty: number }>;
  }>).map((order) => ({
    createdAt: order.created_at,
    items: (order.order_lines ?? []).map((line) => `${line.qty}x ${line.name}`),
  }));
  const counts = new Map<string, { itemId: string | null; name: string; count: number }>();
  for (const order of (orders ?? []) as unknown as Array<{ order_lines?: Array<{ item_id: string | null; name: string; qty: number }> }>) {
    for (const line of order.order_lines ?? []) {
      const key = line.item_id ?? normalizeText(line.name);
      const current = counts.get(key);
      counts.set(key, { itemId: line.item_id, name: line.name, count: (current?.count ?? 0) + Math.max(1, line.qty) });
    }
  }
  const dietNotes = typeof source?.diet_notes === "string" ? source.diet_notes.trim().slice(0, 500) : null;
  return {
    isVegetarian: source?.is_vegetarian === true,
    dietNotes: dietNotes || null,
    preferredLanguage: typeof source?.preferred_language === "string" ? source.preferred_language : null,
    blockedAllergens: detectBlockedAllergens(dietNotes),
    favoriteItemIds,
    frequentItems: [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    recentOrders: recentOrders.slice(0, 5),
  };
}

function fallbackReply(items: MenuItem[], query: string, locale: string, context: CustomerContext | null): AssistantPayload {
  const words = query.toLocaleLowerCase(locale).split(/\s+/).filter((word) => word.length > 2);
  const ranked = items
    .filter((item) => isCompatibleWithProfile(item, context))
    .map((item) => {
      const text = [item.name, item.description ?? "", ...item.tags, ...item.allergens].join(" ").toLocaleLowerCase(locale);
      const history = context?.frequentItems.find((entry) => entry.itemId === item.id)?.count ?? 0;
      const favorite = context?.favoriteItemIds.includes(item.id) ? 3 : 0;
      return { item, score: words.reduce((score, word) => score + (text.includes(word) ? 2 : 0), 0) + history + favorite };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  if (ranked.length === 0) {
    return {
      reply: context
        ? "Ho considerato le preferenze del tuo profilo. Dimmi cosa desideri oggi e quanto vuoi spendere: ti consiglio solo piatti disponibili e compatibili con i dati registrati."
        : "Dimmi che cosa cerchi, eventuali allergie e quanto vuoi spendere: ti consiglio solo piatti disponibili nel menu.",
      suggestions: [],
    };
  }
  return {
    reply: `${context ? "Considerando il tuo profilo e le tue preferenze, n" : "N"}el menu disponibile guarderei ${ranked.map(({ item }) => item.name).join(", ")}. Apri una proposta per aggiungerla al carrello.`,
    suggestions: ranked.map(({ item }) => ({ itemId: item.id, reason: "È coerente con quello che hai chiesto." })),
  };
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.tenantId || !findTenantById(body.tenantId)) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }
  const messages = normalizeMessages(body.messages);
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  if (!lastUserMessage) return NextResponse.json({ error: "message_required" }, { status: 400 });

  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
  const channel = isMenuOrderChannel(body.channel) ? body.channel : "site";
  const locale = /^[a-z]{2}(?:-[A-Z]{2})?$/.test(body.locale ?? "") ? body.locale! : "it";

  const [{ data: rows, error }, auth] = await Promise.all([
    svc
      .from("menu_items")
      .select("id,code,name,description,price,price_kind,tags,allergens,available,category_id")
      .eq("tenant_id", body.tenantId)
      .eq("available", true)
      .order("position", { ascending: true })
      .limit(160),
    createSupabaseServerClient(),
  ]);
  if (error) return NextResponse.json({ error: "menu_unavailable" }, { status: 503 });

  const menuItems = (rows ?? []) as MenuItem[];
  const blockedCodes = new Set(await validateMenuItemsForOrderChannel(svc, {
    tenantId: body.tenantId,
    itemCodes: menuItems.map((item) => item.code),
    channel,
    tableId: body.tableId ?? null,
  }));
  const availableItems = menuItems.filter((item) => !blockedCodes.has(item.code));
  const validIds = new Set(availableItems.map((item) => item.id));
  const validFavoriteIds = [...new Set(body.favoriteItemIds ?? [])]
    .filter((itemId) => validIds.has(itemId))
    .slice(0, 60);
  const cartCodes = availableItems
    .filter((item) => (body.cartItemIds ?? []).includes(item.id))
    .map((item) => item.code);
  const { data: { user } } = await auth.auth.getUser();
  const customerContext = user
    ? await loadCustomerContext(svc, body.tenantId, user.id, validFavoriteIds)
    : null;
  const compatibleIds = new Set(
    availableItems.filter((item) => isCompatibleWithProfile(item, customerContext)).map((item) => item.id),
  );
  const indexedSuggestions = cartCodes.length
    ? await suggestUpsellsForOrder(svc, {
        tenantId: body.tenantId,
        itemCodes: cartCodes,
        channel,
        tableId: body.tableId ?? null,
        userId: user?.id ?? null,
      })
    : [];
  const upsellContext = indexedSuggestions.map((suggestion) => ({
    itemId: availableItems.find((item) => item.code === suggestion.itemId)?.id ?? "",
    reason: suggestion.text,
  })).filter((suggestion) => suggestion.itemId);

  let result = fallbackReply(availableItems, lastUserMessage, locale, customerContext);
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey && availableItems.length > 0) {
    const menu = availableItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      price_eur: priceLabel(item.price),
      tags: item.tags.slice(0, 10),
      allergens: item.allergens,
    }));
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: process.env.OPENAI_MENU_ASSISTANT_MODEL || process.env.OPENAI_UPSELL_MODEL || "gpt-5-mini",
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: [
                `Sei il cameriere digitale del locale. Rispondi nella lingua ${locale}.`,
                "Usa esclusivamente i prodotti forniti. Non inventare ingredienti, allergeni, prezzi o disponibilità.",
                "Per allergie segnala sempre che il cliente deve chiedere conferma al personale: non garantire assenza di contaminazioni.",
                "Se customer_context è presente, usa preferenze, preferiti e storico per personalizzare senza rivelare o riepilogare dati personali non richiesti.",
                "Non suggerire prodotti con allergeni bloccati o chiaramente incompatibili con le preferenze alimentari indicate.",
                "Proponi al massimo tre prodotti pertinenti e usa esattamente il loro id. Se mancano dati, dichiaralo.",
              ].join("\n") }],
            },
            ...messages.map((message) => ({ role: message.role, content: [{ type: "input_text", text: message.content }] })),
            { role: "user", content: [{ type: "input_text", text: JSON.stringify({
              menu,
              cart_item_ids: body.cartItemIds ?? [],
              indexed_pairings: upsellContext,
              customer_context: customerContext
                ? {
                    vegetarian: customerContext.isVegetarian,
                    diet_notes: customerContext.dietNotes,
                    blocked_allergens: customerContext.blockedAllergens,
                    favorite_item_ids: customerContext.favoriteItemIds,
                    frequent_items: customerContext.frequentItems,
                    recent_orders: customerContext.recentOrders,
                  }
                : null,
            }) }] },
          ],
          text: { format: { type: "json_schema", name: "menu_assistant_reply", strict: true, schema: RESPONSE_SCHEMA } },
        }),
      });
      if (response.ok) {
        const parsed = JSON.parse(parseResponseText(await response.json())) as AssistantPayload;
        result = {
          reply: typeof parsed.reply === "string" ? parsed.reply.trim().slice(0, 1400) : result.reply,
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions
                .filter((suggestion) => validIds.has(suggestion.itemId) && compatibleIds.has(suggestion.itemId))
                .slice(0, 3)
                .map((suggestion) => ({
                  itemId: suggestion.itemId,
                  reason: String(suggestion.reason || "").slice(0, 220),
                }))
            : [],
        };
      }
    } catch (cause) {
      console.error("[menu-assistant] response failed", cause instanceof Error ? cause.message : String(cause));
    }
  }

  return NextResponse.json({ ...result, locale, channel, personalized: Boolean(customerContext) });
}
