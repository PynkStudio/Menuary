"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CreditCard,
  ExternalLink,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { buildLoginUrl, type LoginFrom } from "@/lib/login-url";
import { getEffectiveCapabilities, isDeviceRole, type EmployeeRole } from "@/lib/store-roles";
import type { TenantFeatureFlags, TenantLocation, TenantVertical } from "@/lib/tenant";
import { getGestioneModuleAccess } from "@/lib/gestione-routing";
import {
  GESTIONE_NAV_GROUPS,
  GESTIONE_SECTIONS,
  getGestioneSectionLabel,
  isGestioneSectionAvailable,
  type GestioneSectionKey,
  type GestioneViewer,
} from "@/lib/gestione-sections";
import { getVerticalMeta } from "@/lib/vertical";
import type { GestioneMessages } from "@/i18n/gestione";
import {
  ArrivalAlertsProvider,
  useArrivalAlerts,
  type ArrivalKind,
} from "@/lib/notifications/arrival-context";
import { ArrivalBadge, NotificationMuteToggle } from "@/components/gestione/notification-controls";
import { useGestioneLocation } from "@/components/gestione/gestione-location-provider";

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

type ShellProps = {
  tenant: Tenant;
  currentUser: CurrentUser;
  locations?: TenantLocation[];
  navBaseHref?: string;
  loginFrom?: LoginFrom;
  isDemo?: boolean;
  /** Scadenza della demo backend live, se attiva. */
  backendLiveUntil?: string | null;
  children: React.ReactNode;
  messages: GestioneMessages;
};

const ARRIVAL_BY_SECTION: Partial<Record<GestioneSectionKey, ArrivalKind>> = {
  orders: "orders",
  kitchen: "orders",
  reservations: "reservations",
};

const GestioneBaseContext = createContext<string>("");

/** Costruisce un link interno alla gestione rispettando dominio custom e preview. */
export function useGestioneHref() {
  const base = useContext(GestioneBaseContext);
  return (path: string) => {
    const clean = path.replace(/^\/+/, "");
    if (!clean) return base || "/";
    return `${base}/${clean}`;
  };
}

export function GestioneShell(props: ShellProps) {
  const { activeLocation } = useGestioneLocation();
  return (
    <ArrivalAlertsProvider tenantId={props.tenant.id} locationId={activeLocation?.id} refreshOnChange>
      <GestioneBaseContext.Provider value={props.navBaseHref ?? `/gestione/${props.tenant.id}`}>
        <GestioneShellInner {...props} />
      </GestioneBaseContext.Provider>
    </ArrivalAlertsProvider>
  );
}

function GestioneShellInner({
  tenant,
  currentUser,
  locations = [],
  navBaseHref,
  loginFrom,
  isDemo = false,
  backendLiveUntil = null,
  children,
  messages,
}: ShellProps) {
  const t = messages.shell;
  const n = messages.navigation;
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { activeLocation, isMulti, changing, setLocation } = useGestioneLocation();

  const viewer: GestioneViewer = useMemo(() => {
    const role = currentUser.isTenantAdmin ? null : (currentUser.role ?? "personale_cucina");
    return {
      isAdmin: currentUser.isTenantAdmin,
      isDevice: !currentUser.isTenantAdmin && isDeviceRole(currentUser.role),
      capabilities: getEffectiveCapabilities(role, currentUser.permissions),
    };
  }, [currentUser]);

  const access = getGestioneModuleAccess(tenant.features);
  const base = navBaseHref ?? `/gestione/${tenant.id}`;
  const hrefFor = (path: string) => (path ? `${base}/${path}` : base || "/");
  const verticalMeta = getVerticalMeta(tenant.vertical);
  const supportEmail = `support@${verticalMeta.marketingDomain}`;

  const labelFor = (key: GestioneSectionKey) => getGestioneSectionLabel(key, tenant, n);

  const sections = GESTIONE_SECTIONS.filter((section) => isGestioneSectionAvailable(section, tenant, viewer));
  const groups = GESTIONE_NAV_GROUPS.map((group) => ({
    group,
    items: sections.filter((section) => section.group === group),
  })).filter((entry) => entry.items.length > 0);
  const canSeeBilling = sections.some((section) => section.key === "billing");

  const isActive = (path: string) => {
    const href = hrefFor(path);
    if (!path) return (pathname || "/") === href;
    // "ordini/impostazioni" non deve accendere anche "ordini".
    const deeper = sections.some(
      (other) => other.path.startsWith(`${path}/`) && pathname?.startsWith(hrefFor(other.path)),
    );
    return !deeper && (pathname === href || Boolean(pathname?.startsWith(`${href}/`)));
  };

  useEffect(() => {
    setDrawerOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointer(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  async function handleLogout() {
    if (isDemo) {
      router.push("/");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(buildLoginUrl({ from: loginFrom ?? `gestione.${tenant.id}` }));
  }

  const userLabel = currentUser.displayName ?? currentUser.email;

  return (
    <div className="ga-shell" data-drawer-open={drawerOpen}>
      <div className="ga-topbar">
        <button
          type="button"
          className="ga-icon-button"
          aria-label={n.openMenu}
          aria-expanded={drawerOpen}
          aria-controls="ga-sidebar"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={16} strokeWidth={2} />
        </button>
        <span className="ga-brand-name">{tenant.name}</span>
        <NotificationMuteToggle />
      </div>

      {drawerOpen && <button type="button" className="ga-scrim" aria-label={n.closeMenu} onClick={() => setDrawerOpen(false)} />}

      <aside id="ga-sidebar" className="ga-header ga-sidebar" aria-label={t.brand}>
        <div className="ga-sidebar-head">
          <div className="ga-brand">
            <span className="ga-brand-tag">{t.brand}</span>
            <span className="ga-brand-name">{tenant.name}</span>
          </div>
          <button
            type="button"
            className="ga-icon-button ga-sidebar-close"
            aria-label={n.closeMenu}
            onClick={() => setDrawerOpen(false)}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {backendLiveUntil && <BackendLiveBadge until={backendLiveUntil} messages={messages} />}

        {isMulti && (
          <label className="ga-sidebar-location">
            <MapPin size={14} aria-hidden="true" />
            <select
              value={activeLocation?.id ?? ""}
              onChange={(event) => void setLocation(event.target.value)}
              className="ga-location-select"
              aria-label={t.activeLocation}
              disabled={changing}
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <nav className="ga-nav" aria-label={t.brand}>
          {groups.map(({ group, items }) => (
            <div key={group} className="ga-nav-group">
              <p className="ga-nav-group-label">{n.groups[group]}</p>
              {items.map((section) => (
                <NavLinkWithBadge
                  key={section.key}
                  href={hrefFor(section.path)}
                  label={labelFor(section.key)}
                  arrivalKind={ARRIVAL_BY_SECTION[section.key]}
                  active={isActive(section.path)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="ga-sidebar-foot" ref={accountRef}>
          {accountOpen && (
            <div className="ga-settings-popover" role="menu" aria-label={n.account}>
              <Link href={hrefFor("profilo")} role="menuitem">
                <UserRound size={14} />
                <span>{n.items.profile}</span>
              </Link>
              <Link href={hrefFor("impostazioni")} role="menuitem">
                <Settings size={14} />
                <span>{n.items.settings}</span>
              </Link>
              {canSeeBilling && (
                <Link href={hrefFor("fatturazione")} role="menuitem">
                  <CreditCard size={14} />
                  <span>{n.items.billing}</span>
                </Link>
              )}
              {access.canManagePatrimoniale && (
                <a href="https://admin.menuary.it" role="menuitem" target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={14} />
                  <span>{n.controlCenter}</span>
                </a>
              )}
              <a href={`mailto:${supportEmail}`} role="menuitem">
                <LifeBuoy size={14} />
                <span>
                  {t.support} {supportEmail}
                </span>
              </a>
              <button type="button" role="menuitem" onClick={handleLogout} className="ga-settings-popover-danger">
                <LogOut size={14} />
                <span>{t.logout}</span>
              </button>
            </div>
          )}
          <div className="ga-sidebar-user">
            <button
              type="button"
              className="ga-account-button"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
            >
              <span className="ga-account-avatar" aria-hidden="true">
                {userLabel.trim().charAt(0).toUpperCase() || "?"}
              </span>
              <span className="ga-account-name">{userLabel}</span>
            </button>
            <NotificationMuteToggle />
          </div>
        </div>
      </aside>

      <main className="ga-main">{children}</main>
    </div>
  );
}

function BackendLiveBadge({ until, messages }: { until: string; messages: GestioneMessages }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const minutes = Math.max(0, Math.ceil((new Date(until).getTime() - now) / 60_000));
  return (
    <p className="ga-backend-live" title={messages.navigation.backendLiveHint}>
      {messages.navigation.backendLive.replace("{minutes}", String(minutes))}
    </p>
  );
}

function NavLinkWithBadge({
  href,
  label,
  arrivalKind,
  active,
}: {
  href: string;
  label: string;
  arrivalKind?: ArrivalKind;
  active: boolean;
}) {
  const { counters, acknowledge } = useArrivalAlerts();
  // Su "Ordini" sommo anche i "pronti" per dare segnale al cameriere che
  // gestisce la coda.
  const count =
    arrivalKind === "orders"
      ? counters.orders + counters.ready
      : arrivalKind === "reservations"
        ? counters.reservations
        : 0;

  function handleClick() {
    if (!arrivalKind) return;
    acknowledge(arrivalKind);
    if (arrivalKind === "orders") acknowledge("ready");
  }

  return (
    <Link
      href={href}
      className="ga-nav-link"
      data-active={active}
      aria-current={active ? "page" : undefined}
      onClick={handleClick}
    >
      <span>{label}</span>
      <ArrivalBadge count={count} />
    </Link>
  );
}
