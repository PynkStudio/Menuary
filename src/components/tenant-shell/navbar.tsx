"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Menu, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";
import { useFavoritesStore } from "@/store/favorites-store";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { LocationPicker } from "@/components/core/location-picker";
import { VenueWhatsappLink } from "@/components/modules/reservations/venue-display";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const navBase = [
  { label: "Menu", href: "/menu" },
  { label: "Ordina", href: "/ordina" },
  { label: "Preferiti", href: "/preferiti", favorites: true as const },
  { label: "Chi siamo", href: "/chi-siamo" },
  { label: "Galleria", href: "/galleria" },
  { label: "Recensioni", href: "/recensioni" },
  { label: "Contatti", href: "/contatti" },
];

export function Navbar() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const setFavOpen = useFavoritesStore((s) => s.setOpen);
  const { allowTakeaway, favoritesEnabled, modules } = useEffectiveFeatures();
  const tenantHref = useTenantLocalizedHref();
  const isDoca = tenant.id === "doca";

  const beporkModuleNav = useMemo(() => {
    if (tenant.id !== "bepork") return [] as { label: string; href: string }[];
    const extra: { label: string; href: string }[] = [];
    if (modules.onlineMenu) extra.push({ label: "Consigli menu", href: "/assistant-menu" });
    if (modules.tableOrders) extra.push({ label: "Tavolo QR", href: "/tavolo" });
    if (modules.staffRoles) extra.push({ label: "Staff", href: "/staff" });
    if (modules.kitchenDisplay) extra.push({ label: "Cucina", href: "/cucina" });
    return extra;
  }, [tenant.id, modules]);

  const nav = useMemo(() => {
    const filtered = navBase.filter((i) => {
      if (i.href === "/ordina") return allowTakeaway;
      if ("favorites" in i && i.favorites) return favoritesEnabled;
      return true;
    });
    if (tenant.id !== "bepork" || beporkModuleNav.length === 0) return filtered;
    const menuIdx = filtered.findIndex((i) => i.href === "/menu");
    if (menuIdx === -1) return [...beporkModuleNav.map((i) => ({ ...i, href: i.href })), ...filtered];
    return [
      ...filtered.slice(0, menuIdx + 1),
      ...beporkModuleNav.map((i) => ({ label: i.label, href: i.href })),
      ...filtered.slice(menuIdx + 1),
    ];
  }, [allowTakeaway, favoritesEnabled, tenant.id, beporkModuleNav]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    bodyScrollLock();
    return () => bodyScrollUnlock();
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "sticky inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300",
          scrolled
            ? "bg-pork-cream shadow-md"
            : "bg-transparent"
        )}
      >
        <div className="container-wide flex items-center justify-between py-3 md:py-4">
          <Link href={tenantHref("/")} className="group flex items-center gap-3" aria-label={`${tenant.name} home`}>
            <Image
              src={content.logoSrc}
              alt={content.logoAlt}
              width={56}
              height={56}
              priority
              unoptimized
              className="h-12 w-12 md:h-14 md:w-14 object-contain transition-transform group-hover:rotate-[-4deg]"
            />
            <span className="sr-only">{tenant.name}</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principale">
            {nav.map((item) =>
              "favorites" in item && item.favorites ? (
                <button
                  key="preferiti"
                  type="button"
                  onClick={() => setFavOpen(true)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-pork-ink/80 transition-colors hover:bg-pork-ink/5 hover:text-pork-ink"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={tenantHref(item.href)}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-pork-ink/80 transition-colors hover:bg-pork-ink/5 hover:text-pork-ink"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <LocationPicker />
            {isDoca ? (
              <Link href={tenantHref("/prenota")} className="btn-primary text-sm">
                <CalendarDays size={18} />
                Prenota
              </Link>
            ) : (
              <VenueWhatsappLink className="btn-primary text-sm">
                <MessageCircle size={18} />
                Prenota
              </VenueWhatsappLink>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            className="relative z-[70] inline-flex h-11 w-11 items-center justify-center rounded-full bg-pork-ink text-pork-cream lg:hidden"
            aria-label={open ? "Chiudi menu" : "Apri menu"}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-[60] min-h-dvh bg-pork-ink transition-opacity duration-300 ease-out lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,197,24,0.18),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(184,51,46,0.28),transparent_55%)]" />
        <div className="container-wide relative flex min-h-dvh flex-col justify-between pb-[max(3rem,env(safe-area-inset-bottom))] pt-[calc(7rem+env(safe-area-inset-top))]">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {nav.map((item) =>
              "favorites" in item && item.favorites ? (
                <button
                  key="preferiti"
                  type="button"
                  onClick={() => {
                    setFavOpen(true);
                    setOpen(false);
                  }}
                  className="headline block py-1 text-left text-4xl text-pork-cream active:text-pork-mustard sm:text-5xl"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.href}
                  href={tenantHref(item.href)}
                  onClick={() => setOpen(false)}
                  className="headline block py-1 text-4xl text-pork-cream active:text-pork-mustard sm:text-5xl"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
          <div className="flex flex-col gap-3">
            <LocationPicker />
            {isDoca ? (
              <Link
                href={tenantHref("/prenota")}
                className="btn-mustard w-full text-lg"
                onClick={() => setOpen(false)}
              >
                <CalendarDays size={22} />
                Prenota
              </Link>
            ) : (
              <VenueWhatsappLink
                className="btn-mustard w-full text-lg"
                onClick={() => setOpen(false)}
              >
                <MessageCircle size={22} />
                {content.hero.ctaLabel}
              </VenueWhatsappLink>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
