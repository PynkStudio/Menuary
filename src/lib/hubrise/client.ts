import "server-only";

import type { HubriseCatalog, HubriseCustomerPayload, HubriseOrderPayload } from "./types";

const API_BASE = process.env.HUBRISE_API_BASE ?? "https://api.hubrise.com/v1";

export class HubriseError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
    this.name = "HubriseError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { locationToken: string },
): Promise<T> {
  const { locationToken, headers, ...rest } = init;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": locationToken,
      ...(headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let body: unknown = null;
    try { body = await res.json(); } catch { /* ignore */ }
    throw new HubriseError(`HubRise ${res.status} ${res.statusText}`, res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Sostituisce l'intero catalogo HubRise (operazione idempotente). */
export function putCatalog(input: {
  locationToken: string;
  catalogId: string;
  catalog: HubriseCatalog;
}): Promise<{ id: string }> {
  return request<{ id: string }>(`/catalogs/${input.catalogId}`, {
    method: "PUT",
    locationToken: input.locationToken,
    body: JSON.stringify(input.catalog),
  });
}

/** Crea un nuovo catalogo per la location (usato al primo collegamento se manca catalog_id). */
export function createCatalog(input: {
  locationToken: string;
  catalog: HubriseCatalog;
  name?: string;
}): Promise<{ id: string }> {
  return request<{ id: string }>(`/catalogs`, {
    method: "POST",
    locationToken: input.locationToken,
    body: JSON.stringify({ name: input.name ?? "Menuary", ...input.catalog }),
  });
}

/** Fetch dettagli ordine — usato dal webhook quando l'event payload è solo un puntatore. */
export function getOrder(input: {
  locationToken: string;
  orderId: string;
}): Promise<HubriseOrderPayload> {
  return request<HubriseOrderPayload>(`/orders/${input.orderId}`, {
    method: "GET",
    locationToken: input.locationToken,
  });
}

/** Fetch dettagli cliente HubRise — usato dal webhook customer/update se manca il payload inline. */
export function getCustomer(input: {
  locationToken: string;
  customerListId: string;
  customerId: string;
}): Promise<HubriseCustomerPayload> {
  return request<HubriseCustomerPayload>(
    `/customer_lists/${input.customerListId}/customers/${input.customerId}`,
    { method: "GET", locationToken: input.locationToken },
  );
}

/** Aggiorna lo status di un ordine HubRise. Propaga a Deliveroo/JustEat/Glovo/UberEats. */
export function updateOrderStatus(input: {
  locationToken: string;
  orderId: string;
  /** Status HubRise (vedi types.ts). */
  status: string;
}): Promise<{ id: string; status: string }> {
  return request<{ id: string; status: string }>(`/orders/${input.orderId}`, {
    method: "PATCH",
    locationToken: input.locationToken,
    body: JSON.stringify({ status: input.status }),
  });
}
