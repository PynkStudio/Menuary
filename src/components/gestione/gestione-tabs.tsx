"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGestioneHref } from "@/components/gestione/gestione-shell";

/** Schede di una sezione gestione; i percorsi sono relativi alla base gestione. */
export function GestioneTabs({ items, label }: { items: Array<{ path: string; label: string }>; label: string }) {
  const hrefFor = useGestioneHref();
  const pathname = usePathname();
  return (
    <nav className="ga-pills" aria-label={label}>
      {items.map((item) => {
        const href = hrefFor(item.path);
        const active = pathname === href;
        return (
          <Link
            key={item.path}
            href={href}
            className="ga-pill"
            data-active={active}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
