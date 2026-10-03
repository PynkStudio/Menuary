/**
 * Confronta i tenant del registry statico (src/lib/tenant-registry.ts) con la
 * tabella `tenants` del DB, che è la fonte usata a runtime da getTenantById().
 * Segnala tenant mancanti, verticale/stato/abilitazione diversi e flag modulo
 * divergenti. Non scrive nulla: il riallineamento si decide caso per caso.
 *
 *   npm run tenants:drift
 */
import { createClient } from "@supabase/supabase-js";
import { TENANTS } from "../src/lib/tenant-registry";
import { resolveTenantFeatures } from "../src/lib/tenant-modules";
import type { TenantFeatureFlags } from "../src/lib/tenant";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

type Row = {
  id: string;
  vertical: string | null;
  status: string | null;
  enabled: boolean;
  features: Partial<TenantFeatureFlags> | null;
};

async function main() {
  const db = createClient(url!, key!, { auth: { persistSession: false } });
  const { data, error } = await db.from("tenants").select("id,vertical,status,enabled,features");
  if (error) throw error;
  const rows = new Map((data as Row[]).map((row) => [row.id, row]));
  let issues = 0;
  const report = (tenantId: string, message: string) => {
    issues += 1;
    console.log(`- ${tenantId}: ${message}`);
  };

  for (const tenant of TENANTS) {
    const row = rows.get(tenant.id);
    if (!row) {
      report(tenant.id, "presente nel registry, assente dal DB (getTenantById usa il fallback statico)");
      continue;
    }
    if (row.vertical !== tenant.vertical) report(tenant.id, `verticale DB "${row.vertical}" ≠ registry "${tenant.vertical}"`);
    if (row.status !== tenant.status) report(tenant.id, `stato DB "${row.status}" ≠ registry "${tenant.status}"`);
    if (row.enabled !== tenant.enabled) report(tenant.id, `enabled DB ${row.enabled} ≠ registry ${tenant.enabled}`);

    const dbFlags = row.features && Object.keys(row.features).length > 0 ? row.features : null;
    if (!dbFlags) {
      report(tenant.id, "nessun flag sul DB: a runtime valgono quelli del registry");
      continue;
    }
    const effectiveDb = resolveTenantFeatures(dbFlags as TenantFeatureFlags);
    const effectiveRegistry = resolveTenantFeatures(tenant.features);
    const onlyDb = Object.keys(effectiveDb).filter(
      (k) => effectiveDb[k as keyof TenantFeatureFlags] && !effectiveRegistry[k as keyof TenantFeatureFlags],
    );
    const onlyRegistry = Object.keys(effectiveRegistry).filter(
      (k) => effectiveRegistry[k as keyof TenantFeatureFlags] && !effectiveDb[k as keyof TenantFeatureFlags],
    );
    if (onlyDb.length) report(tenant.id, `moduli attivi solo sul DB: ${onlyDb.join(", ")}`);
    if (onlyRegistry.length) report(tenant.id, `moduli attivi solo nel registry: ${onlyRegistry.join(", ")}`);
    const ignored = Object.keys(dbFlags).filter(
      (k) => k in effectiveDb && dbFlags[k as keyof TenantFeatureFlags] === true && !effectiveDb[k as keyof TenantFeatureFlags],
    );
    if (ignored.length) report(tenant.id, `flag accesi sul DB ma spenti dalle dipendenze tra moduli: ${ignored.join(", ")}`);
  }

  for (const id of rows.keys()) {
    if (!TENANTS.some((tenant) => tenant.id === id)) report(id, "presente sul DB, assente dal registry");
  }

  console.log(issues === 0 ? "Registry e DB allineati." : `\n${issues} divergenze.`);
  process.exitCode = issues === 0 ? 0 : 1;
}

void main();
