"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LogOut, MapPin } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getEffectiveCapabilities,
  type StoreCapabilities,
  type EmployeeRole,
} from "@/lib/store-roles";
import type { TenantLocation } from "@/lib/tenant";
import { isMultiLocation } from "@/lib/location";

interface Tenant {
  id: string;
  name: string;
  theme: { red: string; ink: string; cream: string };
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
  children,
}: {
  tenant: Tenant;
  currentUser: CurrentUser;
  locations?: TenantLocation[];
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
    currentUser.role ?? "personale_cucina",
    currentUser.permissions,
  );

  const base = `/gestione/${tenant.id}`;

  const isAdmin = currentUser.isTenantAdmin;

  const items: NavItem[] = [
    { label: "Dashboard", href: base, visible: () => true },
    { label: "Ordini", href: `${base}/ordini`, visible: () => true },
    { label: "Menu", href: `${base}/menu`, visible: (c) => c.can_edit_menu },
    { label: "Tavoli", href: `${base}/tavoli`, visible: (c) => c.can_manage_reservations },
    { label: "Prenotazioni", href: `${base}/prenotazioni`, visible: (c) => c.can_manage_reservations },
    { label: "Cassa", href: `${base}/cassa`, visible: (c) => c.can_cassa },
    { label: "Turni", href: `${base}/turni`, visible: () => true },
    { label: "Staff", href: `${base}/staff`, visible: (c) => c.can_manage_staff },
    { label: "Google", href: `${base}/google`, visible: () => isAdmin },
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

          {/* Selettore sede — visibile solo con 2+ sedi */}
          {isMulti && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 opacity-50 shrink-0" />
              <select
                value={activeLocation?.slug ?? ""}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="appearance-none bg-transparent font-semibold cursor-pointer focus:outline-none"
                aria-label="Sede attiva"
                style={{ color: tenant.theme.ink }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.slug}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
