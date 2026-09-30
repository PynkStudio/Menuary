"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { trackConversion } from "@/lib/tracking/client";
import { MENUARY_PHONE_E164, menuaryWhatsAppUrl } from "./contact-info";

type NavLink = { href: string; label: string; external?: boolean };

/** Menu a tendina sotto l'header, solo sotto `md`. */
export function MarketingMobileMenu({
  links,
  labels,
  children,
}: {
  links: NavLink[];
  labels: { open: string; close: string };
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="menuary-mobile-menu"
        aria-label={open ? labels.close : labels.open}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--menuary-line)] bg-[var(--menuary-paper)] text-[var(--menuary-ink)]"
      >
        {open ? <X size={18} strokeWidth={1.8} /> : <Menu size={18} strokeWidth={1.8} />}
      </button>
      {open ? (
        <div
          id="menuary-mobile-menu"
          className="absolute inset-x-0 top-full border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)] shadow-[0_24px_40px_-24px_rgba(24,35,31,0.25)]"
        >
          <nav className="menuary-container flex flex-col py-3">
            {links.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="border-b border-[var(--menuary-line)] py-4 text-[17px] font-medium last:border-b-0"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="border-b border-[var(--menuary-line)] py-4 text-[17px] font-medium last:border-b-0"
                >
                  {link.label}
                </Link>
              ),
            )}
            {children ? <div className="pt-4 pb-2">{children}</div> : null}
          </nav>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Barra fissa in basso su mobile con i tre modi di contattarci. Portale sul
 * body: il PageTransitionShell applica un transform che romperebbe
 * `position: fixed`.
 */
export function MarketingMobileBar({
  labels,
  demoHref,
}: {
  labels: { call: string; whatsapp: string; demo: string; waMessage: string };
  demoHref: string;
}) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const onDemoPage = pathname === demoHref;

  return createPortal(
    <div className="menuary-mobile-bar md:hidden">
      <a
        href={`tel:${MENUARY_PHONE_E164}`}
        onClick={() => trackConversion("contact", { label: "phone" })}
        className="menuary-mobile-bar-item"
      >
        <Phone size={17} strokeWidth={1.8} />
        {labels.call}
      </a>
      <a
        href={menuaryWhatsAppUrl(labels.waMessage)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackConversion("contact", { label: "whatsapp" })}
        className="menuary-mobile-bar-item"
      >
        <MessageCircle size={17} strokeWidth={1.8} />
        {labels.whatsapp}
      </a>
      <Link
        href={onDemoPage ? "#richiesta" : demoHref}
        className="menuary-mobile-bar-item"
        data-primary
      >
        {labels.demo}
      </Link>
    </div>,
    document.body,
  );
}

/** Link tel:/wa.me/mailto che registra la conversione "contact" al click. */
export function TrackedContactLink({
  channel,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { channel: "phone" | "whatsapp" | "email" }) {
  return (
    <a
      {...props}
      onClick={(event) => {
        trackConversion("contact", { label: channel });
        props.onClick?.(event);
      }}
    />
  );
}
