"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, MapPin } from "lucide-react";
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
import { getModuleLabel } from "@/lib/vertical";

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
  children,
}: {
  tenant: Tenant;
  currentUser: CurrentUser;
  locations?: TenantLocation[];
  navBaseHref?: string;
  loginFrom?: LoginFrom;
  children: React.ReactNode;
}) {
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

  const isAdmin = currentUser.isTenantAdmin;

  const items: NavItem[] = [
    { label: "Dashboard", href: dashboardHref, visible: () => true },
    { label: "Dati attività", href: sectionHref("attivita"), visible: () => access.canManageActivity },
    { label: "Ordini", href: sectionHref("ordini"), visible: () => access.hasOrders },
    { label: getModuleLabel("onlineMenu", tenant.vertical), href: sectionHref("listino"), visible: (c) => access.canManageMenu && c.can_edit_menu },
    { label: getModuleLabel("tablePlanner", tenant.vertical), href: sectionHref("tavoli"), visible: (c) => access.canManageTables && c.can_manage_reservations },
    { label: getModuleLabel("reservations", tenant.vertical), href: sectionHref("prenotazioni"), visible: (c) => access.canManageReservations && c.can_manage_reservations },
    { label: "Cassa", href: sectionHref("cassa"), visible: (c) => access.canManageCheckout && c.can_cassa },
    { label: "Turni", href: sectionHref("turni"), visible: () => access.canManageShifts },
    { label: "Staff", href: sectionHref("staff"), visible: (c) => access.canManageStaff && c.can_manage_staff },
    { label: "Kiosk", href: sectionHref("kiosk"), visible: () => isAdmin && tenant.features.orderKiosk },
    { label: "Google", href: sectionHref("google"), visible: () => isAdmin && access.hasGoogleBusiness },
    { label: "Analytics", href: sectionHref("analytics"), visible: (c) => access.canViewAnalytics && c.can_view_analytics },
    { label: "Fatturazione", href: sectionHref("fatturazione"), visible: () => isAdmin },
    { label: "Sedi", href: sectionHref("sedi"), visible: () => isAdmin && access.canManageLocations },
  ];

  const visibleItems = items.filter((i) => i.visible(cap));

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(buildLoginUrl({ from: loginFrom ?? `gestione.${tenant.id}` }));
  }

  return (
    <>
      <header className="ga-header">
        <div className="ga-header-row">
          <div className="ga-brand">
            <span className="ga-brand-tag">Gestione</span>
            <span className="ga-brand-name">{tenant.name}</span>
          </div>

          <div className="ga-user">
            <span>{currentUser.displayName ?? currentUser.email}</span>
            <button type="button" onClick={handleLogout} className="ga-logout">
              <LogOut size={12} strokeWidth={2} />
              Esci
            </button>
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
                aria-label="Sede attiva"
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
