import type { Metadata } from "next";
import { headers } from "next/headers";
import { MenuPageShell } from "@/components/modules/menu/menu-page-shell";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";
import { CascinaErranteMenuHero } from "@/components/tenants/cascina-errante/pages/menu-hero";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = resolveTenantFromHost((await headers()).get("host"));
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
      "Il menu di Be Pork: antipasti, taglieri, burger firmati, pizze classiche e speciali Be Pork, cucina pugliese, birre tedesche. A Bari, in Via Quintino Sella.",
  };
}

export default async function MenuPage() {
  const tenant = resolveTenantFromHost((await headers()).get("host"));
  return (
    <MenuPageShell
      hero={tenant.id === "cascina-errante" ? <CascinaErranteMenuHero /> : undefined}
    />
  );
}
