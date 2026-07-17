"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChefHat,
  ClipboardList,
  Building2,
  Blocks,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageCircle,
  LifeBuoy,
  Menu as MenuIcon,
  Package,
  QrCode,
  Settings,
  Users,
  UserCircle,
  UtensilsCrossed,
  X,
  CreditCard,
  BadgeEuro,
  Bot,
  UserCog,
  UserPlus,
  FileSignature,
  Palette,
  ServerCrash,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clearAdminSession } from "@/lib/admin-auth";
import { MailLauncherProvider } from "@pynkstudio/mailapp/react";
import { AdminPushNotifications } from "@/components/admin/platform/admin-push-notifications";
import { hasAdminPermission, type AdminPermission, type SiteadminRole } from "@/lib/admin-permissions";
import { cn } from "@/lib/utils";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useTenantOrNull } from "@/components/core/tenant-provider";
import { usePlatformMode } from "@/components/core/platform-mode-provider";

type NavFlags = {
  allowTakeaway: boolean;
  allowTableOrders: boolean;
  orderKioskEnabled: boolean;
  kitchenDisplayEnabled: boolean;
  advancedServicesEnabled: boolean;
  reservationsEnabled: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
  permission?: AdminPermission;
  /** Se assente, sempre visibile. */
  visible?: (s: NavFlags) => boolean;
};

const PLATFORM_ADMIN_NAV: NavItem[] = [
  { href: "/admin/inbox", label: "Posta in arrivo", icon: Mail, permission: "inbox:view" },
  { href: "/admin/messaggi-wa", label: "Messaggi WA", icon: MessageCircle, permission: "support:manage" },
  { href: "/admin/supporto", label: "Supporto", icon: LifeBuoy, permission: "support:manage" },
  { href: "/admin/errori", label: "Errori operativi", icon: ServerCrash, permission: "errors:view" },
  { href: "/admin/crm", label: "CRM Lead", icon: Users, permission: "crm:view" },
  { href: "/admin/crm/nuovo", label: "Nuovo lead", icon: UserPlus, permission: "crm:create" },
  { href: "/admin/pacchetti", label: "Pacchetti", icon: Package, permission: "packages:manage" },
  { href: "/admin/assistente-ai", label: "Assistente AI", icon: Bot, permission: "tenant:manage" },
  { href: "/admin/abbonamenti", label: "Abbonamenti", icon: CreditCard, permission: "subscriptions:view" },
  { href: "/admin/contratti", label: "Contratti", icon: FileSignature, permission: "subscriptions:view" },
  { href: "/admin/template-design", label: "Template designer", icon: Palette, permission: "tenant:manage" },
  { href: "/admin/provvigioni", label: "Provvigioni", icon: BadgeEuro, permission: "commissions:view" },
  { href: "/admin/tenant", label: "Tenant & Moduli", icon: Building2, permission: "tenant:manage" },
  { href: "/admin/utenti", label: "Utenti interni", icon: UserCog, permission: "users:manage" },
];

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    visible: (s) => s.allowTakeaway || s.allowTableOrders || s.orderKioskEnabled,
  },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/tenant", label: "Tenant", icon: Building2 },
  {
    href: "/admin/ordini",
    label: "Ordini",
    icon: ClipboardList,
    visible: (s) => s.allowTakeaway || s.allowTableOrders || s.orderKioskEnabled,
  },
  {
    href: "/admin/tavoli",
    label: "Tavoli & QR",
    icon: QrCode,
    visible: (s) => s.allowTableOrders,
  },
  {
    href: "/admin/prenotazioni",
    label: "Prenotazioni",
    icon: CalendarCheck,
    visible: (s) => s.reservationsEnabled,
  },
  {
    href: "/admin/servizi",
    label: "Servizi",
    icon: Blocks,
    visible: (s) => s.advancedServicesEnabled,
  },
  { href: "/admin/impostazioni", label: "Impostazioni", icon: Settings },
  {
    href: "/cucina",
    label: "Schermo cucina",
    icon: ChefHat,
    external: true,
    visible: (s) => s.kitchenDisplayEnabled,
  },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [platformRole, setPlatformRole] = useState<SiteadminRole | null>(null);
  const [platformSiteadminId, setPlatformSiteadminId] = useState<string | null>(null);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [waSupportCount, setWaSupportCount] = useState(0);
  const [leadAttentionCount, setLeadAttentionCount] = useState(0);
  const [contractsAttention, setContractsAttention] = useState(0);
  const [invoiceTasks, setInvoiceTasks] = useState(0);
  const mode = usePlatformMode();

  const tenant = useTenantOrNull();
  const {
    allowTakeaway,
    allowTableOrders,
    orderKioskEnabled,
    kitchenDisplayEnabled,
    modules,
  } = useEffectiveFeatures();

  useEffect(() => {
    if (mode !== "platform-admin") return;
    let active = true;
    void fetch("/api/admin/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { id?: string; role?: SiteadminRole }) => {
        if (active) {
          setPlatformRole(data.role ?? null);
          setPlatformSiteadminId(data.id ?? null);
        }
      })
      .catch(() => {
        if (active) {
          setPlatformRole(null);
          setPlatformSiteadminId(null);
        }
      });
    return () => {
      active = false;
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "platform-admin" || !hasAdminPermission(platformRole, "support:manage")) return;

    function fetchWaSupportCount() {
      void fetch("/api/admin/support/active-count?source=whatsapp_customer_service", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { count?: number }) => setWaSupportCount(data.count ?? 0))
        .catch(() => {});
    }

    fetchWaSupportCount();
    const interval = setInterval(fetchWaSupportCount, 25_000);
    window.addEventListener("focus", fetchWaSupportCount);
    window.addEventListener("support:refresh", fetchWaSupportCount as EventListener);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchWaSupportCount);
      window.removeEventListener("support:refresh", fetchWaSupportCount as EventListener);
    };
  }, [mode, platformRole]);

  useEffect(() => {
    if (mode !== "platform-admin" || !hasAdminPermission(platformRole, "crm:view")) return;

    function fetchLeadAttention() {
      void fetch("/api/admin/leads/attention", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { count?: number }) => setLeadAttentionCount(data.count ?? 0))
        .catch(() => {});
    }

    fetchLeadAttention();
    const interval = setInterval(fetchLeadAttention, 25_000);
    window.addEventListener("focus", fetchLeadAttention);
    window.addEventListener("lead-attention:refresh", fetchLeadAttention as EventListener);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchLeadAttention);
      window.removeEventListener("lead-attention:refresh", fetchLeadAttention as EventListener);
    };
  }, [mode, platformRole]);

  useEffect(() => {
    if (mode !== "platform-admin") return;

    function fetchUnread() {
      void fetch("/api/admin/inbox/unread", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { unread?: number }) => setInboxUnread(data.unread ?? 0))
        .catch(() => {});
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 25_000);
    window.addEventListener("focus", fetchUnread);
    window.addEventListener("inbox:refresh", fetchUnread as EventListener);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchUnread);
      window.removeEventListener("inbox:refresh", fetchUnread as EventListener);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "platform-admin" || !hasAdminPermission(platformRole, "subscriptions:view")) return;

    function fetchContractsAttention() {
      void fetch("/api/admin/contracts/attention", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { count?: number }) => setContractsAttention(data.count ?? 0))
        .catch(() => {});
    }

    fetchContractsAttention();
    const interval = setInterval(fetchContractsAttention, 25_000);
    window.addEventListener("focus", fetchContractsAttention);
    window.addEventListener("contracts:refresh", fetchContractsAttention as EventListener);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchContractsAttention);
      window.removeEventListener("contracts:refresh", fetchContractsAttention as EventListener);
    };
  }, [mode, platformRole]);

  useEffect(() => {
    if (mode !== "platform-admin" || !hasAdminPermission(platformRole, "subscriptions:view")) return;

    function fetchInvoiceTasks() {
      void fetch("/api/admin/payments/invoice-tasks", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { count?: number }) => setInvoiceTasks(data.count ?? 0))
        .catch(() => {});
    }

    fetchInvoiceTasks();
    const interval = setInterval(fetchInvoiceTasks, 25_000);
    window.addEventListener("focus", fetchInvoiceTasks);
    window.addEventListener("payments:refresh", fetchInvoiceTasks as EventListener);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchInvoiceTasks);
      window.removeEventListener("payments:refresh", fetchInvoiceTasks as EventListener);
    };
  }, [mode, platformRole]);

  const advancedServicesEnabled = Boolean(
    modules.orderKiosk ||
      modules.reservations ||
      modules.tablePlanner ||
      modules.productAvailability ||
      modules.upselling ||
      modules.crm ||
      modules.analytics ||
      modules.takeawaySlots ||
      modules.deliveryHub ||
      modules.inventoryFoodCost ||
      modules.printStations ||
      modules.staffRoles ||
      modules.multiLocation,
  );

  const navItems = useMemo(() => {
    if (mode === "platform-admin") {
      return PLATFORM_ADMIN_NAV.filter(
        (it) => !it.permission || hasAdminPermission(platformRole, it.permission),
      );
    }
    const tenantHiddenItems = new Set(["/admin/tenant"]);
    const flags: NavFlags = {
      allowTakeaway,
      allowTableOrders,
      orderKioskEnabled,
      kitchenDisplayEnabled,
      advancedServicesEnabled,
      reservationsEnabled: modules.reservations,
    };
    return NAV_ITEMS.filter(
      (it) => !tenantHiddenItems.has(it.href) && (it.visible ? it.visible(flags) : true),
    );
  }, [
    allowTakeaway,
    allowTableOrders,
    orderKioskEnabled,
    kitchenDisplayEnabled,
    advancedServicesEnabled,
    modules.reservations,
    mode,
    platformRole,
  ]);

  const adminEntryHref =
    mode === "platform-admin" || allowTakeaway || allowTableOrders || orderKioskEnabled
      ? "/admin"
      : "/admin/menu";

  function logout() {
    clearAdminSession();
    router.replace("/admin/login");
  }

  const isPlatform = mode === "platform-admin";

  if (isPlatform) {
    return (
      <MailLauncherProvider>
      <div className="menuary-admin-root">
        <aside
          className={cn(
            "menuary-admin-sidebar fixed inset-y-0 left-0 z-30 flex w-64 flex-col transition-transform lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="menuary-admin-sidebar-header flex items-center justify-between p-5">
            <Link href={adminEntryHref} className="menuary-admin-brand">
              Menuary · controllo
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Chiudi">
              <X size={22} />
            </button>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((it) => {
              const active =
                !it.external &&
                (it.href === "/admin/crm"
                  ? pathname === it.href ||
                    (Boolean(pathname?.startsWith("/admin/crm/")) &&
                      !pathname?.startsWith("/admin/crm/nuovo"))
                  : pathname === it.href ||
                    (it.href !== "/admin" && pathname?.startsWith(it.href)));
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  target={it.external ? "_blank" : undefined}
                  className="menuary-admin-nav-link"
                  data-active={active}
                >
                  <Icon size={18} />
                  {it.label}
                  {it.external && <span className="menuary-admin-nav-tag">nuova tab</span>}
                  {it.href === "/admin/inbox" && inboxUnread > 0 && (
                    <span className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : "bg-[var(--ma-accent)] text-white",
                    )}>
                      {inboxUnread}
                    </span>
                  )}
                  {it.href === "/admin/messaggi-wa" && waSupportCount > 0 && (
                    <span className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : "bg-[var(--ma-accent)] text-white",
                    )}>
                      {waSupportCount}
                    </span>
                  )}
                  {it.href === "/admin/crm" && leadAttentionCount > 0 && (
                    <span className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : "bg-[var(--ma-accent)] text-white",
                    )}>
                      {leadAttentionCount}
                    </span>
                  )}
                  {it.href === "/admin/contratti" && contractsAttention > 0 && (
                    <span className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : "bg-[var(--ma-accent)] text-white",
                    )}>
                      {contractsAttention}
                    </span>
                  )}
                  {it.href === "/admin/abbonamenti" && invoiceTasks > 0 && (
                    <span className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : "bg-[var(--ma-accent)] text-white",
                    )}>
                      {invoiceTasks}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/admin/profilo"
            onClick={() => setOpen(false)}
            className="menuary-admin-nav-link mx-3 mb-1"
            data-active={pathname === "/admin/profilo"}
          >
            <UserCircle size={18} />
            Profilo
          </Link>
          <AdminPushNotifications role={platformRole} siteadminId={platformSiteadminId} />
          <button onClick={logout} className="menuary-admin-logout">
            <LogOut size={18} /> Esci
          </button>
        </aside>

        {open && (
          <div
            className="menuary-admin-backdrop fixed inset-0 z-20 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
        )}

        <div className="lg:pl-64">
          <header className="menuary-admin-topbar sticky top-0 z-10 flex items-center justify-between px-5 py-3 lg:hidden">
            <button
              className="menuary-admin-topbar-button"
              onClick={() => setOpen(true)}
              aria-label="Apri menu"
            >
              <MenuIcon size={20} />
            </button>
            <span className="menuary-admin-topbar-title">Controllo</span>
            <div className="w-10" />
          </header>

          <main className="p-5 sm:p-8">{children}</main>
        </div>
      </div>
      </MailLauncherProvider>
    );
  }

  return (
    <div className="min-h-screen bg-pork-cream">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-pork-ink text-pork-cream transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-pork-cream/10 p-5">
          <Link
            href={adminEntryHref}
            className="headline text-2xl text-pork-mustard"
          >
            {`${tenant?.name ?? "Gestione"} · gestione`}
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Chiudi"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((it) => {
            const active =
              !it.external &&
              (pathname === it.href ||
                (it.href !== "/admin" && pathname?.startsWith(it.href)));
            const Icon = it.icon;
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                target={it.external ? "_blank" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-colors",
                  active
                    ? "bg-pork-mustard text-pork-ink"
                    : "text-pork-cream/80 hover:bg-pork-cream/5 hover:text-pork-cream",
                )}
              >
                <Icon size={18} />
                {it.label}
                {it.external && (
                  <span className="ml-auto rounded-full bg-pork-cream/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                    nuova tab
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-3 rounded-xl bg-pork-red px-4 py-3 font-semibold text-white transition-colors hover:bg-pork-red-dark"
        >
          <LogOut size={18} /> Esci
        </button>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-20 bg-pork-ink/70 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-pork-ink/10 bg-pork-cream/95 px-5 py-3 backdrop-blur-lg lg:hidden">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pork-ink text-pork-cream"
            onClick={() => setOpen(true)}
            aria-label="Apri menu"
          >
            <MenuIcon size={20} />
          </button>
          <span className="impact-title text-pork-ink">Gestione</span>
          <div className="w-10" />
        </header>

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
