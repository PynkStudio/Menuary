// Tipi minimi HubRise — non l'intera surface API, solo i campi che ci servono per push catalog + ingest ordini.
// Ref: https://www.hubrise.com/developers/api

export type HubriseCatalog = {
  categories: HubriseCategory[];
  products: HubriseProduct[];
  option_lists?: HubriseOptionList[];
};

export type HubriseCategory = {
  ref: string;
  name: string;
  description?: string;
};

export type HubriseProduct = {
  ref: string;
  category_ref: string;
  name: string;
  description?: string;
  skus: HubriseSku[];
  option_list_refs?: string[];
};

export type HubriseSku = {
  ref: string;
  name?: string;
  price: string;            // HubRise wants decimal string ("12.50")
  enabled?: boolean;
  tags?: string[];
};

export type HubriseOptionList = {
  ref: string;
  name: string;
  min_selection?: number;
  max_selection?: number;
  options: HubriseOption[];
};

export type HubriseOption = {
  ref: string;
  name: string;
  price: string;
};

// ─── Inbound (webhook payloads) ──────────────────────────────────────────────

export type HubriseOrderStatus =
  | "new"
  | "received"
  | "accepted"
  | "in_preparation"
  | "awaiting_shipment"
  | "awaiting_collection"
  | "in_delivery"
  | "completed"
  | "rejected"
  | "cancelled"
  | "delivery_failed";

export type HubriseServiceType = "delivery" | "collection" | "eat_in";

export type HubriseOrderPayload = {
  id: string;
  status: HubriseOrderStatus;
  service_type?: HubriseServiceType;
  expected_time?: string;          // ISO
  created_at: string;
  total: string;                   // decimal string
  customer?: HubriseCustomerPayload;
  items: HubriseOrderItem[];
  notes?: string;
  custom_fields?: Record<string, string>;
  location_id?: string;
  /** "Deliveroo", "Just Eat", "Glovo", "Uber Eats" — non sempre presente, derivato da custom_fields o partner. */
  partner_name?: string;
};

export type HubriseCustomerPayload = {
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
};

export type HubriseOrderItem = {
  product_name: string;
  sku_ref?: string;
  product_ref?: string;
  quantity: number;
  price: string;
  options?: Array<{
    option_list_name?: string;
    name: string;
    ref?: string;
    price?: string;
  }>;
  customer_notes?: string;
};

export type HubriseWebhookEvent = {
  /** Es: "order/create", "order/update", "customer/update". */
  event: string;
  /** Location HubRise (corrisponde a hubrise_links.hubrise_location_id). */
  location_id: string;
  resource_id: string;
  /** Payload denormalizzato — può essere ordine o cliente a seconda dell'event type. */
  data?: HubriseOrderPayload | HubriseCustomerPayload;
};
