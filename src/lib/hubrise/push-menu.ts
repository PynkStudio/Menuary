import "server-only";

import { createHash } from "node:crypto";
import { findTenantById } from "@/lib/tenant-registry";
import type { MenuSyncBundle } from "@/lib/menu-sync-types";
import { createCatalog, HubriseError, putCatalog } from "./client";
import {
  listLinksForTenant,
  logMenuSync,
  markMenuPushed,
  updateLinkCatalogId,
  type HubriseLink,
} from "./links";
import { menuaryToHubriseCatalog } from "./mappers";

function hashCatalog(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

async function pushOne(link: HubriseLink, bundle: MenuSyncBundle, force: boolean) {
  if (!link.menuPushEnabled || link.status !== "active") {
    await logMenuSync({ tenantId: link.tenantId, linkId: link.id, status: "skipped" });
    return { skipped: true as const };
  }
  const catalog = menuaryToHubriseCatalog(bundle);
  const hash = hashCatalog(catalog);
  if (!force && link.lastMenuPushHash === hash) {
    await logMenuSync({ tenantId: link.tenantId, linkId: link.id, status: "skipped", payloadHash: hash });
    return { skipped: true as const };
  }

  try {
    if (link.catalogId) {
      await putCatalog({ locationToken: link.locationToken, catalogId: link.catalogId, catalog });
    } else {
      const created = await createCatalog({ locationToken: link.locationToken, catalog });
      await updateLinkCatalogId(link.id, created.id);
    }
    await markMenuPushed(link.id, hash);
    await logMenuSync({ tenantId: link.tenantId, linkId: link.id, status: "ok", payloadHash: hash });
    return { ok: true as const };
  } catch (err) {
    const message =
      err instanceof HubriseError
        ? `${err.message} ${JSON.stringify(err.body ?? {})}`
        : err instanceof Error
          ? err.message
          : String(err);
    await logMenuSync({
      tenantId: link.tenantId,
      linkId: link.id,
      status: "error",
      payloadHash: hash,
      error: message.slice(0, 2000),
    });
    return { error: message };
  }
}

/**
 * Pusha il menu corrente a tutte le location HubRise collegate al tenant.
 * Sicuro: se feature off, niente link o errori HubRise → restituisce risultati per location senza throw.
 */
export async function pushMenuToHubrise(input: {
  tenantId: string;
  bundle: MenuSyncBundle;
  force?: boolean;
}): Promise<Array<{ linkId: string; locationName: string | null; status: "ok" | "skipped" | "error"; error?: string }>> {
  const tenant = findTenantById(input.tenantId);
  if (!tenant?.features.hubriseSync) return [];

  const links = await listLinksForTenant(input.tenantId);
  if (links.length === 0) return [];

  const results = await Promise.all(
    links.map(async (link) => {
      const out = await pushOne(link, input.bundle, Boolean(input.force));
      if ("error" in out) {
        return { linkId: link.id, locationName: link.locationName, status: "error" as const, error: out.error };
      }
      if ("skipped" in out) {
        return { linkId: link.id, locationName: link.locationName, status: "skipped" as const };
      }
      return { linkId: link.id, locationName: link.locationName, status: "ok" as const };
    }),
  );
  return results;
}
