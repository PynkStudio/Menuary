"use client";

import Link from "next/link";
import {
  Archive,
  Briefcase,
  Clapperboard,
  Inbox,
  LifeBuoy,
  Mail,
  Pencil,
  Send,
  Settings,
  Star,
  UtensilsCrossed,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboundEmailBrand } from "@/lib/email/inbound-types";

export type MailView = "inbox" | "mine" | "sent" | "starred" | "archived";
export type BrandFilter = InboundEmailBrand | "all" | "support";

type Props = {
  view: MailView;
  brand: BrandFilter;
  unreadCount: number;
  unreadMine: number;
  canCompose: boolean;
  onViewChange: (v: MailView) => void;
  onBrandChange: (b: BrandFilter) => void;
  onCompose: () => void;
};

const VIEWS: { value: MailView; label: string; icon: React.ElementType }[] = [
  { value: "inbox",    label: "Arrivo",    icon: Inbox },
  { value: "mine",     label: "Le mie",    icon: UserCheck },
  { value: "sent",     label: "Inviata",   icon: Send },
  { value: "starred",  label: "Stellate",  icon: Star },
  { value: "archived", label: "Archivio",  icon: Archive },
];

const BRANDS: { value: BrandFilter; label: string; icon: React.ElementType }[] = [
  { value: "all",     label: "Tutte",   icon: Mail },
  { value: "menuary", label: "Menuary", icon: UtensilsCrossed },
  { value: "bizery",  label: "Bizery",  icon: Briefcase },
  { value: "orpheo",  label: "Orpheo",  icon: Clapperboard },
  { value: "support", label: "Supporto", icon: LifeBuoy },
];

export function MailSidebar({ view, brand, unreadCount, unreadMine, canCompose, onViewChange, onBrandChange, onCompose }: Props) {
  return (
    <div className="flex h-full w-52 shrink-0 flex-col border-r border-[var(--ma-line)] bg-[var(--ma-surface)] p-3">
      {/* Scrivi */}
      {canCompose && (
        <button
          onClick={onCompose}
          className="menuary-admin-action-btn mb-4 flex w-full items-center justify-center gap-2"
        >
          <Pencil size={14} />
          Scrivi
        </button>
      )}

      {/* Viste */}
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ma-muted)]">
        Cassetta
      </p>
      <nav className="mb-4 space-y-0.5">
        {VIEWS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onViewChange(value)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              view === value
                ? "bg-[var(--ma-accent)] text-white"
                : "text-[var(--ma-muted)] hover:bg-[var(--ma-line)] hover:text-[var(--ma-ink)]",
            )}
          >
            <Icon size={15} />
            {label}
            {value === "inbox" && unreadCount > 0 && (
              <span className={cn(
                "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                view === "inbox" ? "bg-white/20 text-white" : "bg-[var(--ma-accent)] text-white",
              )}>
                {unreadCount}
              </span>
            )}
            {value === "mine" && unreadMine > 0 && (
              <span className={cn(
                "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                view === "mine" ? "bg-white/20 text-white" : "bg-[var(--ma-accent)] text-white",
              )}>
                {unreadMine}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Brand */}
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--ma-muted)]">
        Brand
      </p>
      <nav className="mb-4 space-y-0.5">
        {BRANDS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onBrandChange(value)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              brand === value
                ? "bg-[var(--ma-line)] text-[var(--ma-ink)]"
                : "text-[var(--ma-muted)] hover:bg-[var(--ma-line)] hover:text-[var(--ma-ink)]",
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto">
        <Link
          href="/admin/profilo"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--ma-muted)] transition-colors hover:bg-[var(--ma-line)] hover:text-[var(--ma-ink)]"
        >
          <Settings size={15} />
          Profilo e firma
        </Link>
      </div>
    </div>
  );
}
