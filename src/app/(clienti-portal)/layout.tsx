import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { ClientsShell } from "@/components/clients/clients-shell";
import { PortalSwitcher } from "@/components/portal-switcher/portal-switcher";

export default async function ClientiPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  if (mode !== "clients") {
    notFound();
  }
  return (
    <>
      <ClientsShell>{children}</ClientsShell>
      <PortalSwitcher current="clienti" cookieDomain=".menuary.it" />
    </>
  );
}
