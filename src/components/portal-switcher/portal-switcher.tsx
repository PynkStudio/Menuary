import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserPortalAccess, type PortalKey } from "@/lib/user-access";
import { PortalSwitcherUI } from "./portal-switcher-ui";

interface Props {
  current: PortalKey;
  cookieDomain?: string;
}

export async function PortalSwitcher({ current, cookieDomain }: Props) {
  const supabase = await createSupabaseServerClient(cookieDomain);
  const portals = await getUserPortalAccess(supabase);

  // Se l'utente ha accesso a un solo portale (quello corrente) non mostrare nulla
  if (portals.filter((p) => p.key !== current).length === 0) return null;

  return <PortalSwitcherUI portals={portals} current={current} />;
}
