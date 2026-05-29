import type { MenuSyncBundle } from "@/lib/menu-sync-types";
import type { AdminMenuItem, OrderStatus, PriceFormat } from "@/lib/types";
import type {
  HubriseCatalog,
  HubriseOptionList,
  HubriseOrderPayload,
  HubriseOrderStatus,
  HubriseProduct,
  HubriseSku,
} from "./types";

const dec = (n: number) => n.toFixed(2);

function skusForPrice(itemId: string, price: PriceFormat): HubriseSku[] {
  switch (price.kind) {
    case "single":
      return [{ ref: `${itemId}`, price: dec(price.value), enabled: true }];
    case "sized":
      return [
        { ref: `${itemId}__small`, name: "Piccolo", price: dec(price.small), enabled: true },
        { ref: `${itemId}__big`, name: "Grande", price: dec(price.big), enabled: true },
      ];
    case "persone":
      return [
        { ref: `${itemId}__per2`, name: "Per 2", price: dec(price.per2), enabled: true },
        { ref: `${itemId}__per4`, name: "Per 4", price: dec(price.per4), enabled: true },
      ];
    case "volume":
      return [
        { ref: `${itemId}__small`, name: price.small.label, price: dec(price.small.price), enabled: true },
        { ref: `${itemId}__large`, name: price.large.label, price: dec(price.large.price), enabled: true },
      ];
  }
}

function productDescription(item: AdminMenuItem): string | undefined {
  const parts: string[] = [];
  if (item.description) parts.push(item.description);
  if (item.allergens?.length) parts.push(`Allergeni: ${item.allergens.join(", ")}`);
  if (item.tags?.length) parts.push(`Tag: ${item.tags.join(", ")}`);
  return parts.length ? parts.join(" · ") : undefined;
}

export function menuaryToHubriseCatalog(bundle: MenuSyncBundle): HubriseCatalog {
  const categories = bundle.categories.map((cat) => ({
    ref: cat.id,
    name: cat.title,
    description: cat.subtitle ?? cat.description ?? undefined,
  }));

  const optionLists: HubriseOptionList[] = bundle.extraLists.map((list) => ({
    ref: list.id,
    name: list.name,
    min_selection: 0,
    options: list.extras.map((extra) => ({
      ref: extra.id,
      name: extra.name,
      price: dec(extra.price),
    })),
  }));

  // Extra inline per item (no extraListId) → option_list virtuale per-item.
  const inlineOptionLists: HubriseOptionList[] = [];

  const products: HubriseProduct[] = bundle.items.map((item) => {
    const optionListRefs: string[] = [];
    if (item.extraListId) {
      optionListRefs.push(item.extraListId);
    } else if (item.extras?.length) {
      const ref = `__inline_${item.id}`;
      inlineOptionLists.push({
        ref,
        name: "Aggiunte",
        min_selection: 0,
        options: item.extras.map((extra) => ({
          ref: extra.id,
          name: extra.name,
          price: dec(extra.price),
        })),
      });
      optionListRefs.push(ref);
    }

    const skus = skusForPrice(item.id, item.price).map((sku) => ({
      ...sku,
      enabled: sku.enabled !== false && item.available !== false,
    }));

    return {
      ref: item.id,
      category_ref: item.categoryId,
      name: item.name,
      description: productDescription(item),
      skus,
      option_list_refs: optionListRefs.length ? optionListRefs : undefined,
    };
  });

  return {
    categories,
    products,
    option_lists: [...optionLists, ...inlineOptionLists],
  };
}

// ─── Inbound ─────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<HubriseOrderStatus, OrderStatus> = {
  new: "nuovo",
  received: "nuovo",
  accepted: "in_preparazione",
  in_preparation: "in_preparazione",
  awaiting_shipment: "pronto",
  awaiting_collection: "pronto",
  in_delivery: "pronto",
  completed: "consegnato",
  rejected: "annullato",
  cancelled: "annullato",
  delivery_failed: "annullato",
};

export function mapHubriseStatus(status: HubriseOrderStatus): OrderStatus {
  return STATUS_MAP[status] ?? "nuovo";
}

/**
 * Mapping inverso Menuary → HubRise per il push status. Non bijection:
 * "consegnato" su HubRise = `completed` (final), valido per delivery e collection.
 * Ritorna null per stati che non vogliamo propagare (es. "pending_confirmation" — non arriverà mai
 * su un ordine HubRise perché auto_accepted=true; "nuovo" è già lo stato di partenza).
 */
const REVERSE_STATUS_MAP: Partial<Record<OrderStatus, HubriseOrderStatus>> = {
  in_preparazione: "in_preparation",
  pronto: "awaiting_collection",
  consegnato: "completed",
  annullato: "cancelled",
};

export function mapMenuaryStatusToHubrise(status: OrderStatus): HubriseOrderStatus | null {
  return REVERSE_STATUS_MAP[status] ?? null;
}

/** Inferisce la piattaforma origine (deliveroo, ubereats, …) dai custom_fields HubRise. */
export function detectPlatform(payload: HubriseOrderPayload): string | null {
  const fromField = payload.custom_fields?.["source"] ?? payload.custom_fields?.["platform"];
  if (fromField) return fromField.toLowerCase().replace(/\s+/g, "_");
  if (payload.partner_name) return payload.partner_name.toLowerCase().replace(/\s+/g, "_");
  return null;
}

export function formatCustomerName(c: HubriseOrderPayload["customer"]): string | null {
  if (!c) return null;
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return name || c.company_name || null;
}
