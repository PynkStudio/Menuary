import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PortalKey } from "@/lib/user-access";
import { portalEntriesForAccess, resolveUserAccessForUserId } from "@/lib/user-access-server";
import { PortalSwitcherUI } from "./portal-switcher-ui";

interface Props {
  current: PortalKey;
  cookieDomain?: string;
}

export async function PortalSwitcher({ current, cookieDomain }: Props) {
  const supabase = await createSupabaseServerClient(cookieDomain);
  const { data: { user } } = await supabase.auth.getUser();
  const portals = user ? portalEntriesForAccess(await resolveUserAccessForUserId(user.id)) : [];

  // Se l'utente ha accesso a un solo portale (quello corrente) non mostrare nulla
  if (portals.filter((p) => p.key !== current).length === 0) return null;

  return <PortalSwitcherUI portals={portals} current={current} />;
}
