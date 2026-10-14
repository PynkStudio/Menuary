"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeEuro,
  BookUser,
  CalendarClock,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu as MenuIcon,
  Settings2,
  Shield,
  UserCircle,
  X,
  UtensilsCrossed,
  UserCog,
  Briefcase,
  Music,
  PlugZap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { clearAdminSession } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";
import { canonicalPynkPath, isPynkNavActive } from "./pynk-path";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  external?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin-pynkstudio/mailapp",      label: "Posta",          icon: Mail },
  { href: "/admin-pynkstudio/agenda",       label: "Agenda",         icon: CalendarClock },
  { href: "/admin-pynkstudio/crm",          label: "CRM PynkStudio", icon: BookUser },
  { href: "/admin-pynkstudio/beta",         label: "Beta program",   icon: FlaskConical },
  { href: "/admin-pynkstudio/patrimoniale", label: "Patrimoniale",   icon: BadgeEuro },
  { href: "/admin-pynkstudio/utenti",       label: "Utenti interni", icon: UserCog },
  { href: "/admin-pynkstudio/mcp",          label: "MCP & agenti",   icon: PlugZap },
];

const PORTAL_ITEMS: NavItem[] = [
  { href: "/admin-pynkstudio/menuary",  label: "Menuary",  icon: UtensilsCrossed },
  { href: "/admin-pynkstudio/bizery",   label: "Bizery",   icon: Briefcase },
  { href: "/admin-pynkstudio/orpheo",   label: "Orpheo",   icon: Music },
  { href: "/admin-pynkstudio/security", label: "Security",  icon: Shield },
];

export function PynkAdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inboxUnread, setInboxUnread] = useState(0);

  useEffect(() => {
    function fetchUnread() {
      void fetch("/api/admin/inbox/unread", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: { unread?: number }) => setInboxUnread(data.unread ?? 0))
        .catch(() => {});
    }

    fetchUnread();
    const interval = setInterval(fetchUnread, 25_000);
    window.addEventListener("focus", fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchUnread);
    };
  }, []);

  function logout() {
    clearAdminSession();
    router.replace("/admin-pynkstudio/login");
  }

  const isHub = canonicalPynkPath(pathname) === "/admin-pynkstudio";

  return (
    <div className="pynk-admin-root">
      <aside
        className={cn(
          "pynk-admin-sidebar fixed inset-y-0 left-0 z-30 flex w-64 flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="pynk-admin-sidebar-header flex items-center justify-between p-5">
          <Link href="/admin-pynkstudio" className="pynk-admin-brand">
            PynkStudio
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Chiudi">
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <Link
            href="/admin-pynkstudio"
            className="pynk-admin-nav-link"
            data-active={isHub}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <div className="my-2 border-t border-white/10" />
          <span className="block px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--pa-sidebar-muted)] opacity-60">
            Strumenti
          </span>
          {NAV_ITEMS.map((it) => {
            const active = !it.external && isPynkNavActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                target={it.external ? "_blank" : undefined}
                className="pynk-admin-nav-link"
                data-active={active}
              >
                <it.icon size={18} />
                {it.label}
                {it.external && <span className="pynk-admin-nav-tag">↗</span>}
                {it.href === "/admin-pynkstudio/mailapp" && inboxUnread > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active ? "bg-white/20 text-white" : "bg-[var(--pa-accent)] text-white",
                    )}
                  >
                    {inboxUnread}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="my-2 border-t border-white/10" />
          <span className="block px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--pa-sidebar-muted)] opacity-60">
            Portali
          </span>
          {PORTAL_ITEMS.map((it) => {
            const active = isPynkNavActive(pathname, it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className="pynk-admin-nav-link"
                data-active={active}
              >
                <it.icon size={18} />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/admin-pynkstudio/impostazioni"
          onClick={() => setOpen(false)}
          className="pynk-admin-nav-link mx-3"
          data-active={isPynkNavActive(pathname, "/admin-pynkstudio/impostazioni")}
        >
          <Settings2 size={18} />
          Impostazioni
        </Link>
        <Link
          href="/admin-pynkstudio/profilo"
          onClick={() => setOpen(false)}
          className="pynk-admin-nav-link mx-3 mb-1"
          data-active={isPynkNavActive(pathname, "/admin-pynkstudio/profilo")}
        >
          <UserCircle size={18} />
          Profilo
        </Link>
        <button onClick={logout} className="pynk-admin-logout">
          <LogOut size={18} /> Esci
        </button>
      </aside>

      {open && (
        <div
          className="pynk-admin-backdrop fixed inset-0 z-20 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="lg:pl-64">
        <header className="pynk-admin-topbar sticky top-0 z-10 flex items-center justify-between px-5 py-3 lg:hidden">
          <button
            className="pynk-admin-topbar-button"
            onClick={() => setOpen(true)}
            aria-label="Apri menu"
          >
            <MenuIcon size={20} />
          </button>
          <span className="pynk-admin-topbar-title">PynkStudio</span>
          <div className="w-10" />
        </header>

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
