"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeEuro,
  ExternalLink,
  FolderKanban,
  LogOut,
  Mail,
  Menu as MenuIcon,
  UserCircle,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { clearAdminSession } from "@/lib/admin-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  external?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin-pynkstudio/inbox",        label: "Posta",          icon: Mail },
  { href: "/admin-pynkstudio/crm",          label: "Progetti",       icon: FolderKanban },
  { href: "/admin-pynkstudio/patrimoniale", label: "Patrimoniale",   icon: BadgeEuro },
  { href: "https://admin.menuary.it",       label: "Controllo verticali", icon: ExternalLink, external: true },
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

  return (
    <div className="pynk-admin-root">
      <aside
        className={cn(
          "pynk-admin-sidebar fixed inset-y-0 left-0 z-30 flex w-64 flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="pynk-admin-sidebar-header flex items-center justify-between p-5">
          <Link href="/admin-pynkstudio/inbox" className="pynk-admin-brand">
            PynkStudio · admin
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Chiudi">
            <X size={22} />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((it) => {
            const active =
              !it.external &&
              (pathname === it.href || pathname?.startsWith(it.href + "/"));
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
                {it.href === "/admin-pynkstudio/inbox" && inboxUnread > 0 && (
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
        </nav>
        <Link
          href="/admin-pynkstudio/profilo"
          onClick={() => setOpen(false)}
          className="pynk-admin-nav-link mx-3 mb-1"
          data-active={pathname === "/admin-pynkstudio/profilo"}
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
