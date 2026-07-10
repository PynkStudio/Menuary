import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { MenuPageShell } from "@/components/modules/menu/menu-page-shell";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { CascinaErranteMenuHero } from "@/components/tenants/cascina-errante/pages/menu-hero";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = resolveTenantFromHost((await headers()).get("host"));
  if (!tenant) return { title: "Pagina non trovata", robots: { index: false, follow: false } };
  if (tenant.id === "cascina-errante") {
    return {
      title: "Menu, Bottega e Adventure",
      description:
        "Il menu di Cascina Errante: cucina a vista, prodotti della bottega, liofilizzati gourmet ed esperienze per eventi.",
    };
  }
  return {
    title: "Menu",
    description:
      "Il menu demo di ThePork: antipasti, taglieri, burger firmati, pizze classiche e speciali, cucina italiana e birre.",
  };
}

export default async function MenuPage() {
  const tenant = resolveTenantFromHost((await headers()).get("host"));
  if (!tenant) notFound();
  return (
    <MenuPageShell
      hero={tenant.id === "cascina-errante" ? <CascinaErranteMenuHero /> : undefined}
    />
  );
}
