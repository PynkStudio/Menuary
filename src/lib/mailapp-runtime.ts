import { configureMailappRuntime } from "@pynkstudio/mailapp/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendWebPushToSiteadmin, sendWebPushToSubscriptions } from "@/lib/push/send";
import { findTenantById } from "@/lib/tenant-registry";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";

configureMailappRuntime({
  createSupabaseAdminClient,
  createSupabaseServiceClient,
  createSupabaseServerClient: (cookieDomain) => createSupabaseServerClient(cookieDomain ?? undefined),
  sendWebPushToSiteadmin: async (siteadminId, payload) => {
    await sendWebPushToSiteadmin(siteadminId, payload);
  },
  sendWebPushToSubscriptions: async (subscriptionIds, payload) => {
    await sendWebPushToSubscriptions(subscriptionIds, payload);
  },
  findTenantById: (tenantId) => findTenantById(tenantId) ?? null,
  resolveSessionCookieDomain: (host) => resolveSessionCookieDomain(host ?? undefined) ?? null,
});
