"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Building2, CreditCard, Globe2, KeyRound, LogOut, MapPin, Settings, UserRound } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildLoginUrl, type LoginFrom } from "@/lib/login-url";
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
  loginFrom,
  isDemo = false,
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
  const [settingsOpen, setSettingsOpen] = useState(false);

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
  ];

  const visibleItems = items.filter((i) => i.visible(cap));

  async function handleLogout() {
    if (isDemo) {
      router.push("/");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(buildLoginUrl({ from: loginFrom ?? `gestione.${tenant.id}` }));
  }

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
            <div className="ga-settings-menu-wrap">
              <button
                type="button"
                className="ga-icon-button"
                aria-label={t.settings}
                aria-expanded={settingsOpen}
                onClick={() => setSettingsOpen((open) => !open)}
              >
                <Settings size={15} strokeWidth={2} />
              </button>
              {settingsOpen && (
                <div className="ga-settings-popover" role="menu" aria-label={t.settings}>
                  <Link href={settingsHref} role="menuitem" onClick={() => setSettingsOpen(false)}>
                    <Settings size={14} />
                    <span>Impostazioni generali</span>
                  </Link>
                  <Link href={`${settingsHref}#abbonamento`} role="menuitem" onClick={() => setSettingsOpen(false)}>
                    <CreditCard size={14} />
                    <span>Abbonamento Menuary</span>
                  </Link>
                  <Link href={`${settingsHref}#valuta-lingue`} role="menuitem" onClick={() => setSettingsOpen(false)}>
                    <Globe2 size={14} />
                    <span>Valuta e lingue</span>
                  </Link>
                  <Link href={`${settingsHref}#password`} role="menuitem" onClick={() => setSettingsOpen(false)}>
                    <KeyRound size={14} />
                    <span>Password</span>
                  </Link>
                  <Link href={`${settingsHref}#dati-attivita`} role="menuitem" onClick={() => setSettingsOpen(false)}>
                    <Building2 size={14} />
                    <span>Dati attività</span>
                  </Link>
                  <button type="button" role="menuitem" onClick={handleLogout} className="ga-settings-popover-danger">
                    <LogOut size={14} />
                    <span>{t.logout}</span>
                  </button>
                </div>
              )}
            </div>
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
