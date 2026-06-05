"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, Settings, UserRound } from "lucide-react";
import type { LoginFrom } from "@/lib/login-url";
import {
  getEffectiveCapabilities,
  type StoreCapabilities,
  type EmployeeRole,
} from "@/lib/store-roles";
import type { TenantFeatureFlags, TenantLocation } from "@/lib/tenant";
import type { TenantVertical } from "@/lib/tenant";
import { isMultiLocation } from "@/lib/location";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import { getModuleLabel, getVerticalMeta } from "@/lib/vertical";
import type { GestioneMessages } from "@/i18n/gestione";

interface Tenant {
  id: string;
  name: string;
  vertical: TenantVertical;
  theme: { red: string; ink: string; cream: string };
  features: TenantFeatureFlags;
}

interface CurrentUser {
  email: string;
  displayName: string | null;
  role: EmployeeRole | null;
  permissions: Record<string, boolean>;
  isTenantAdmin: boolean;
}

interface NavItem {
  label: string;
  href: string;
  visible: (cap: StoreCapabilities) => boolean;
}

export function GestioneShell({
  tenant,
  currentUser,
  locations = [],
  navBaseHref,
  children,
  messages,
}: {
  tenant: Tenant;
  currentUser: CurrentUser;
  locations?: TenantLocation[];
  navBaseHref?: string;
  loginFrom?: LoginFrom;
  isDemo?: boolean;
  children: React.ReactNode;
  messages: GestioneMessages;
}) {
  const t = messages.shell;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isMulti = isMultiLocation(locations);
  const activeLocationSlug = searchParams.get("loc") ?? locations.find((l) => l.isDefault)?.slug ?? locations[0]?.slug;
  const activeLocation = locations.find((l) => l.slug === activeLocationSlug) ?? locations[0];

  function handleLocationChange(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("loc", slug);
    router.push(`${pathname}?${params.toString()}`);
  }

  const cap = getEffectiveCapabilities(
    currentUser.isTenantAdmin ? null : (currentUser.role ?? "personale_cucina"),
    currentUser.permissions,
  );
  const access = getGestioneModuleAccess(tenant.features);

  const base = navBaseHref ?? `/gestione/${tenant.id}`;
  const dashboardHref = base || "/";
  const sectionHref = (section: string) => `${base}/${section}`;
  const profileHref = sectionHref("profilo");
  const settingsHref = sectionHref("impostazioni");

  const isAdmin = currentUser.isTenantAdmin;
  const verticalMeta = getVerticalMeta(tenant.vertical);
  const supportEmail = `support@${verticalMeta.marketingDomain}`;

  const items: NavItem[] = [
    { label: t.nav.dashboard, href: dashboardHref, visible: () => true },
    { label: t.nav.orders, href: sectionHref("ordini"), visible: () => access.hasOrders },
    { label: getModuleLabel("onlineMenu", tenant.vertical), href: sectionHref("listino"), visible: (c) => access.canManageMenu && c.can_edit_menu },
    { label: getModuleLabel("tablePlanner", tenant.vertical), href: sectionHref("tavoli"), visible: (c) => access.canManageTables && c.can_manage_reservations },
    { label: getModuleLabel("reservations", tenant.vertical), href: sectionHref("prenotazioni"), visible: (c) => access.canManageReservations && c.can_manage_reservations },
    { label: t.nav.checkout, href: sectionHref("cassa"), visible: (c) => access.canManageCheckout && c.can_cassa },
    { label: t.nav.shifts, href: sectionHref("turni"), visible: () => access.canManageShifts },
    { label: t.nav.staff, href: sectionHref("staff"), visible: (c) => access.canManageStaff && c.can_manage_staff },
    { label: t.nav.kiosk, href: sectionHref("kiosk"), visible: () => isAdmin && tenant.features.orderKiosk },
    { label: t.nav.aiAssistant, href: sectionHref("assistente-ai"), visible: () => isAdmin && (tenant.features.aiPhone || tenant.features.aiWhatsapp) },
    { label: t.nav.google, href: sectionHref("google"), visible: () => isAdmin && access.hasGoogleBusiness },
    { label: t.nav.analytics, href: sectionHref("analytics"), visible: (c) => access.canViewAnalytics && c.can_view_analytics },
    { label: t.nav.loyalty, href: sectionHref("fidelity"), visible: () => isAdmin && access.canManageFidelity },
    { label: t.nav.billing, href: sectionHref("fatturazione"), visible: () => isAdmin },
    { label: t.nav.locations, href: sectionHref("sedi"), visible: () => isAdmin && access.canManageLocations },
    { label: t.nav.settings, href: settingsHref, visible: () => true },
  ];

  const visibleItems = items.filter((i) => i.visible(cap));

  return (
    <>
      <header className="ga-header">
        <div className="ga-header-row">
          <div className="ga-brand">
            <span className="ga-brand-tag">{t.brand}</span>
            <span className="ga-brand-name">{tenant.name}</span>
          </div>

          <div className="ga-user">
            <a href={`mailto:${supportEmail}`} className="ga-support-link">
              {t.support} {supportEmail}
            </a>
            <span>{currentUser.displayName ?? currentUser.email}</span>
            <Link href={profileHref} className="ga-profile-link">
              <UserRound size={12} strokeWidth={2} />
              {t.profile}
            </Link>
            <Link href={settingsHref} className="ga-profile-link" aria-label={t.settings}>
              <Settings size={13} strokeWidth={2} />
              {t.settings}
            </Link>
          </div>
        </div>

        {isMulti && (
          <div className="ga-header-row" style={{ paddingTop: 0, paddingBottom: 12 }}>
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ opacity: 0.5 }} />
              <select
                value={activeLocation?.slug ?? ""}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="ga-location-select"
                aria-label={t.activeLocation}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.slug}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <nav className="ga-nav">
          {visibleItems.map((item) => {
            const active =
              item.href === dashboardHref
                ? (pathname || "/") === dashboardHref
                : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="ga-nav-link"
                data-active={active}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="ga-main">{children}</main>
    </>
  );
}
