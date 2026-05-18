// Demo mode (demo.menuary.it / demo.bizery.it).
// Su demo, /gestione è accessibile senza login e qualsiasi mutazione su
// /api/gestione/* viene intercettata lato client: nessuna chiamata reale al
// server, lo stato vive solo in localStorage (scoped per tenant). I dati
// spariscono con cookie/cache wipe — è esattamente quello che vogliamo per
// una vetrina interattiva.

import { PLATFORM_HOSTS } from "@/lib/platform";

export function isDemoHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    (PLATFORM_HOSTS.preview as readonly string[]).includes(h) ||
    (PLATFORM_HOSTS["preview-bizery"] as readonly string[]).includes(h)
  );
}

export function isDemoBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return isDemoHostname(window.location.hostname);
}

const STORE_PREFIX = "menuary:demo:";

function storeKey(tenantId: string, bucket: string): string {
  return `${STORE_PREFIX}${tenantId}:${bucket}`;
}

type LocationRecord = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  is_default: boolean;
  routing_mode: "subdomain" | "path" | "both";
};

function readBucket<T>(tenantId: string, bucket: string): T[] {
  try {
    const raw = window.localStorage.getItem(storeKey(tenantId, bucket));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeBucket<T>(tenantId: string, bucket: string, items: T[]): void {
  try {
    window.localStorage.setItem(storeKey(tenantId, bucket), JSON.stringify(items));
  } catch {
    // quota piena: ignoriamo, è solo una demo.
  }
}

export function readDemoLocations(tenantId: string): LocationRecord[] {
  if (typeof window === "undefined") return [];
  return readBucket<LocationRecord>(tenantId, "locations");
}

export type StaffRecord = {
  id: string;
  email: string;
  role: string;
  display_name: string | null;
  permissions: Record<string, boolean>;
  enabled: boolean;
};

export function readDemoStaff(tenantId: string): StaffRecord[] {
  if (typeof window === "undefined") return [];
  return readBucket<StaffRecord>(tenantId, "staff");
}

function newDemoId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Match `/api/gestione/locations` (collection) o `/api/gestione/locations/{id}` (item).
const LOC_COLLECTION_RE = /\/api\/gestione\/locations\/?$/;
const LOC_ITEM_RE = /\/api\/gestione\/locations\/([^/?]+)\/?$/;

async function handleLocations(
  pathname: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // Per le locations il tenantId arriva nel body (POST) o lo leggiamo
  // dall'item esistente. Per semplicità leggiamo da pathname/body.
  const collectionMatch = LOC_COLLECTION_RE.exec(pathname);
  const itemMatch = LOC_ITEM_RE.exec(pathname);

  if (collectionMatch && method === "POST") {
    const data = (body ?? {}) as Partial<LocationRecord> & { tenantId?: string };
    const tenantId = data.tenantId ?? "";
    if (!tenantId) return jsonResponse({ error: "tenantId required" }, 400);
    const items = readBucket<LocationRecord>(tenantId, "locations");
    const created: LocationRecord = {
      id: newDemoId("loc"),
      tenant_id: tenantId,
      name: data.name ?? "",
      slug: data.slug ?? "",
      address: (data.address as string) || null,
      city: (data.city as string) || null,
      phone: (data.phone as string) || null,
      email: (data.email as string) || null,
      is_default: items.length === 0,
      routing_mode: (data.routing_mode as LocationRecord["routing_mode"]) ?? "both",
    };
    writeBucket(tenantId, "locations", [...items, created]);
    return jsonResponse(created);
  }

  if (itemMatch && (method === "PATCH" || method === "DELETE")) {
    const locationId = itemMatch[1];
    // Cerchiamo l'item in tutti i tenant — su demo c'è solo l'utente corrente.
    if (typeof window === "undefined") return null;
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(STORE_PREFIX) || !k.endsWith(":locations")) continue;
      const tenantId = k.slice(STORE_PREFIX.length, k.length - ":locations".length);
      const items = readBucket<LocationRecord>(tenantId, "locations");
      const idx = items.findIndex((l) => l.id === locationId);
      if (idx === -1) continue;

      if (method === "DELETE") {
        if (items[idx].is_default) {
          return jsonResponse({ error: "Impossibile eliminare la sede default" }, 400);
        }
        const next = items.filter((l) => l.id !== locationId);
        writeBucket(tenantId, "locations", next);
        return new Response(null, { status: 204 });
      }

      const patch = (body ?? {}) as Partial<LocationRecord> & { isDefault?: boolean; routingMode?: LocationRecord["routing_mode"] };
      const next = items.map((l) => {
        if (l.id !== locationId) {
          // se sto promuovendo un altro default, demote questo.
          return patch.isDefault ? { ...l, is_default: false } : l;
        }
        return {
          ...l,
          name: patch.name ?? l.name,
          slug: patch.slug ?? l.slug,
          address: (patch.address as string | undefined) ?? l.address,
          city: (patch.city as string | undefined) ?? l.city,
          phone: (patch.phone as string | undefined) ?? l.phone,
          email: (patch.email as string | undefined) ?? l.email,
          routing_mode: (patch.routingMode as LocationRecord["routing_mode"] | undefined) ?? l.routing_mode,
          is_default: patch.isDefault === true ? true : l.is_default,
        };
      });
      writeBucket(tenantId, "locations", next);
      const updated = next.find((l) => l.id === locationId)!;
      return jsonResponse(updated);
    }
    // Item non trovato in localStorage: rispondiamo 404 senza colpire il server.
    return jsonResponse({ error: "Not found" }, 404);
  }

  return null;
}

async function handleStaff(
  pathname: string,
  method: string,
  body: unknown,
): Promise<Response | null> {
  // Invito nuovo dipendente.
  if (pathname === "/api/gestione/invite-staff" && method === "POST") {
    const data = (body ?? {}) as {
      tenant_slug?: string;
      email?: string;
      display_name?: string | null;
      role?: string;
      permissions?: Record<string, boolean>;
    };
    const tenantId = data.tenant_slug ?? "";
    if (!tenantId || !data.email) return jsonResponse({ error: "Dati invito mancanti" }, 400);
    const items = readBucket<StaffRecord>(tenantId, "staff");
    if (items.some((s) => s.email.toLowerCase() === data.email!.toLowerCase())) {
      return jsonResponse({ error: "Email già presente" }, 409);
    }
    const created: StaffRecord = {
      id: newDemoId("emp"),
      email: data.email,
      role: data.role ?? "cameriere",
      display_name: data.display_name ?? null,
      permissions: data.permissions ?? {},
      enabled: true,
    };
    writeBucket(tenantId, "staff", [...items, created]);
    return jsonResponse({ ok: true, employee: created });
  }

  // Revoca/ripristino accesso. La staff manager passa admin_user_id che,
  // su demo, è semplicemente l'id che abbiamo generato in fase di invito.
  if (pathname === "/api/admin/revoke-access" && (method === "POST" || method === "PUT")) {
    const data = (body ?? {}) as { admin_user_id?: string };
    const id = data.admin_user_id;
    if (!id) return jsonResponse({ error: "admin_user_id mancante" }, 400);
    if (typeof window === "undefined") return null;
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(STORE_PREFIX) || !k.endsWith(":staff")) continue;
      const tenantId = k.slice(STORE_PREFIX.length, k.length - ":staff".length);
      const items = readBucket<StaffRecord>(tenantId, "staff");
      const idx = items.findIndex((s) => s.id === id);
      if (idx === -1) continue;
      const next = items.map((s) => (s.id === id ? { ...s, enabled: method === "PUT" } : s));
      writeBucket(tenantId, "staff", next);
      return jsonResponse({ ok: true });
    }
    return jsonResponse({ error: "Not found" }, 404);
  }

  return null;
}

let installed = false;

// Installa un wrapper su window.fetch che redirige tutte le mutazioni
// /api/gestione/* a un handler locale. Le richieste a endpoint non gestiti
// esplicitamente ricevono una risposta 200 fittizia (no-op) per evitare
// modifiche server-side accidentali.
export function installDemoFetchInterceptor(): void {
  if (typeof window === "undefined" || installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
    const method = (init?.method ?? (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")).toUpperCase();

    let pathname = url;
    try {
      pathname = new URL(url, window.location.origin).pathname;
    } catch {
      // url malformato: lascio passare al fetch originale.
    }

    const isDemoApi =
      pathname.startsWith("/api/gestione/") ||
      pathname === "/api/admin/revoke-access";
    if (!isDemoApi) {
      return originalFetch(input, init);
    }

    // Solo le scritture (e DELETE) sono intercettate; GET passa al server
    // — su demo i server-side handler in genere restituiscono comunque
    // dati vuoti perché non c'è una sessione utente.
    if (method === "GET") {
      return originalFetch(input, init);
    }

    let body: unknown = undefined;
    const rawBody = init?.body;
    if (typeof rawBody === "string" && rawBody.length > 0) {
      try { body = JSON.parse(rawBody); } catch { body = rawBody; }
    }

    const locHandled = await handleLocations(pathname, method, body);
    if (locHandled) return locHandled;

    const staffHandled = await handleStaff(pathname, method, body);
    if (staffHandled) return staffHandled;

    // Fallback per endpoint non specializzati: 200 OK echo, niente effetti.
    return jsonResponse({ ok: true, demo: true, echoed: body ?? null });
  };
}
