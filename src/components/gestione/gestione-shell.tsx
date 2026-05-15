"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getEffectiveCapabilities,
  type StoreCapabilities,
} from "@/lib/store-roles";
import type { Database } from "@/lib/supabase/types";

interface Tenant {
  id: string;
  name: string;
  theme: { red: string; ink: string; cream: string };
}

interface CurrentUser {
  email: string;
  displayName: string | null;
  role: Database["public"]["Enums"]["admin_role"] | null;
  permissions: Record<string, boolean>;
}

interface NavItem {
  label: string;
  href: string;
  visible: (cap: StoreCapabilities) => boolean;
}

export function GestioneShell({
  tenant,
  currentUser,
  children,
}: {
  tenant: Tenant;
  currentUser: CurrentUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const cap = getEffectiveCapabilities(
    currentUser.role ?? "personale_cucina",
    currentUser.permissions,
  );

  const base = `/gestione/${tenant.id}`;

  const items: NavItem[] = [
    { label: "Dashboard", href: base, visible: () => true },
    { label: "Ordini", href: `${base}/ordini`, visible: () => true },
    { label: "Menu", href: `${base}/menu`, visible: (c) => c.can_edit_menu },
    { label: "Tavoli", href: `${base}/tavoli`, visible: (c) => c.can_manage_reservations },
    { label: "Prenotazioni", href: `${base}/prenotazioni`, visible: (c) => c.can_manage_reservations },
    { label: "Cassa", href: `${base}/cassa`, visible: (c) => c.can_cassa },
    { label: "Turni", href: `${base}/turni`, visible: () => true },
    { label: "Staff", href: `${base}/staff`, visible: (c) => c.can_manage_staff },
    { label: "Analytics", href: `${base}/analytics`, visible: (c) => c.can_view_analytics },
    { label: "Fatturazione", href: `${base}/fatturazione`, visible: (c) => c.can_view_financials },
  ];

  const visibleItems = items.filter((i) => i.visible(cap));

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(
      `https://login.menuary.it?from=gestione.${tenant.id}` as never as string,
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header brandizzato tenant */}
      <header
        className="border-b backdrop-blur"
        style={{ borderColor: `${tenant.theme.ink}1A`, backgroundColor: `${tenant.theme.cream}E6` }}
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white"
                style={{ backgroundColor: tenant.theme.red }}
              >
                Gestione
              </span>
              <span className="text-lg font-bold">{tenant.name}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="opacity-60">
                {currentUser.displayName ?? currentUser.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: tenant.theme.ink }}
              >
                <LogOut size={12} strokeWidth={2} />
                Esci
              </button>
            </div>
          </div>

          {/* Nav primario */}
          <nav className="mt-4 -mb-1 flex flex-wrap gap-1 text-sm">
            {visibleItems.map((item) => {
              const active =
                item.href === base
                  ? pathname === base
                  : pathname === item.href || pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3 py-1.5 font-semibold transition-colors"
                  style={
                    active
                      ? { backgroundColor: tenant.theme.ink, color: tenant.theme.cream }
                      : { color: `${tenant.theme.ink}99` }
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
