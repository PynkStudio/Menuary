"use client";

import { usePathname } from "next/navigation";
import {
  BadgeEuro,
  Bot,
  Building2,
  ClipboardList,
  CreditCard,
  Cpu,
  FileText,
  Globe,
  LifeBuoy,
  Mail,
  MessageCircle,
  Megaphone,
  Music,
  Palette,
  Package,
  ServerCrash,
  Settings,
  Shield,
  Users,
  UtensilsCrossed,
  Briefcase,
} from "lucide-react";
import { PynkAdminShell } from "./pynk-admin-shell";
import { PynkPortalShell, type PortalNavItem } from "./pynk-portal-shell";

const AUTH_SECTIONS = ["login", "set-password"];

/**
 * Su admin.pynkstudio.eu il middleware riscrive i path nudi (`/menuary/crm`) su
 * `/admin-pynkstudio/menuary/crm`, ma `usePathname()` restituisce quello che sta
 * nella barra del browser: entrambe le forme arrivano qui. Senza normalizzare,
 * chi apre `admin.pynkstudio.eu/menuary/crm` vedrebbe la sidebar dell'hub al
 * posto di quella del portale.
 */
function sectionOf(pathname: string): string {
  const withoutPrefix = pathname.replace(/^\/admin-pynkstudio/, "");
  return withoutPrefix.split("/").filter(Boolean)[0] ?? "";
}

// Sezioni comuni a tutti i portali prodotto: cambia solo il prefisso.
function productNav(slug: "menuary" | "bizery" | "orpheo"): PortalNavItem[] {
  const base = `/admin-pynkstudio/${slug}`;
  return [
    { href: `${base}/inbox`,        label: "Posta in arrivo",  icon: Mail },
    { href: `${base}/crm`,          label: "CRM Lead",         icon: Users },
    { href: `${base}/tenant`,       label: "Tenant & Moduli",  icon: Building2 },
    { href: `${base}/pacchetti`,    label: "Pacchetti",        icon: Package },
    { href: `${base}/abbonamenti`,  label: "Abbonamenti",      icon: CreditCard },
    { href: `${base}/contratti`,    label: "Contratti",        icon: FileText },
    { href: `${base}/provvigioni`,  label: "Provvigioni",      icon: BadgeEuro },
    { href: `${base}/supporto`,     label: "Supporto",         icon: LifeBuoy },
    { href: `${base}/errori`,       label: "Errori operativi", icon: ServerCrash },
  ];
}

// Moduli che oggi esistono solo per il food: finché non hanno un equivalente
// negli altri prodotti restano fuori dai rispettivi portali.
const MENUARY_NAV: PortalNavItem[] = [
  ...productNav("menuary"),
  { href: "/admin-pynkstudio/menuary/marketing",        label: "Marketing",          icon: Megaphone },
  { href: "/admin-pynkstudio/menuary/messaggi-wa",     label: "Messaggi WA",       icon: MessageCircle },
  { href: "/admin-pynkstudio/menuary/assistente-ai",   label: "Assistente AI",     icon: Bot },
  { href: "/admin-pynkstudio/menuary/template-design", label: "Template designer", icon: Palette },
];

const BIZERY_NAV: PortalNavItem[] = productNav("bizery");

const ORPHEO_NAV: PortalNavItem[] = productNav("orpheo");

const SECURITY_NAV: PortalNavItem[] = [
  { href: "/admin-pynkstudio/security/tenants",  label: "Organizzazioni",  icon: Building2 },
  { href: "/admin-pynkstudio/security/users",    label: "Utenti",          icon: Users },
  { href: "/admin-pynkstudio/security/audit",    label: "Audit logs",      icon: ClipboardList },
  { href: "/admin-pynkstudio/security/config",   label: "Configurazione",  icon: Settings },
];

// Piattaforma esterna (proprio backend FastAPI, non un verticale Menuary) —
// accesso platform-admin via bridge, riservato a superadmin/admin (vedi
// middleware.ts). Randa compare qui come uno dei tenant, non ha una voce a sé.
const PERX_NAV: PortalNavItem[] = [
  { href: "/admin-pynkstudio/perx/tenant",         label: "Tenant",           icon: Building2 },
  { href: "/admin-pynkstudio/perx/utenti",         label: "Utenti",           icon: Users },
  { href: "/admin-pynkstudio/perx/errori",         label: "Errori operativi", icon: ServerCrash },
  { href: "/admin-pynkstudio/perx/domain-routes",  label: "Domain routes",    icon: Globe },
];

const PORTAL_SHELLS: Record<
  string,
  { label: string; icon: React.ElementType; nav: PortalNavItem[] }
> = {
  menuary:  { label: "Menuary",  icon: UtensilsCrossed, nav: MENUARY_NAV },
  bizery:   { label: "Bizery",   icon: Briefcase,       nav: BIZERY_NAV },
  orpheo:   { label: "Orpheo",   icon: Music,           nav: ORPHEO_NAV },
  security: { label: "Security", icon: Shield,          nav: SECURITY_NAV },
  perx:     { label: "PerX",     icon: Cpu,             nav: PERX_NAV },
};

export function PynkAdminLayoutSwitch({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const section = sectionOf(pathname ?? "");

  if (AUTH_SECTIONS.includes(section)) return <>{children}</>;

  const portal = PORTAL_SHELLS[section];
  if (portal) {
    return (
      <PynkPortalShell
        portalLabel={portal.label}
        portalIcon={portal.icon}
        navItems={portal.nav}
      >
        {children}
      </PynkPortalShell>
    );
  }

  return <PynkAdminShell>{children}</PynkAdminShell>;
}
