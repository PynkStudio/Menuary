"use client";

import { MessageCircle } from "lucide-react";
import { useVenueContactPhone } from "@/components/modules/reservations/venue-display";

export function WhatsappFloat() {
  const { waHref } = useVenueContactPhone();
  return (
    <a
      href={waHref()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Prenota su WhatsApp"
      className="group fixed z-40 flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-2xl shadow-black/30 transition-transform hover:scale-105 active:scale-95 max-md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] max-md:right-[max(1.25rem,env(safe-area-inset-right))] md:bottom-8 md:right-8"
    >
      <MessageCircle size={22} />
      <span className="hidden text-sm font-bold uppercase tracking-wide md:inline">
        Prenota
      </span>
    </a>
  );
}
