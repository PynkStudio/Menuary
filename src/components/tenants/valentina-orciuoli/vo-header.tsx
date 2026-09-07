"use client";

import { usePathname } from "next/navigation";
import { findTenantById } from "@/lib/tenant-registry";
import { voHref, voRoute, VALENTINA_TENANT_ID } from "./routes";

type NavItem = { label: string; path: string };

/** Il taccuino compare in menu solo quando il modulo blog è acceso per il tenant. */
const blogPublished = Boolean(findTenantById(VALENTINA_TENANT_ID)?.features.blog);

/** Path relativi: il prefisso (preview o dominio custom) e la lingua li mette `voHref`. */
const navItems: NavItem[] = [
  { label: "Home", path: "" },
  { label: "Libri", path: "/libri" },
  { label: "Chi sono", path: "/autrice" },
  { label: "Eventi", path: "/eventi" },
  ...(blogPublished ? [{ label: "Dal taccuino", path: "/blog" }] : []),
  { label: "Contatti", path: "/contatti" },
];

export function ValentinaOrciuoliHeader() {
  const route = voRoute(usePathname() ?? "");

  return (
    <div className="vo-site-header">
      <header className="vo-header">
        <div className="vo-header-hairline" aria-hidden="true">
          <span />
        </div>
        <nav className="vo-nav" aria-label="Menu principale">
          {navItems.map((item) => (
            <a
              key={item.path}
              href={voHref(item.path, route)}
              aria-current={route.path === item.path ? "page" : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
    </div>
  );
}
