"use client";

import { useState } from "react";
import { LayoutGrid, X, Users, Store, ShieldCheck } from "lucide-react";
import type { PortalEntry, PortalKey } from "@/lib/user-access";

const ICONS: Record<PortalKey, React.ElementType> = {
  clienti: Users,
  gestione: Store,
  admin: ShieldCheck,
};

interface Props {
  portals: PortalEntry[];
  current: PortalKey;
}

export function PortalSwitcherUI({ portals, current }: Props) {
  const [open, setOpen] = useState(false);

  const others = portals.filter((p) => p.key !== current);
  if (others.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-56 rounded-2xl border border-black/8 bg-white p-2 shadow-xl shadow-black/10">
          <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-black/30">
            I tuoi portali
          </p>
          {others.map((p) => {
            const Icon = ICONS[p.key];
            return (
              <a
                key={p.key}
                href={p.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-black/5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/5">
                  <Icon size={15} className="text-black/60" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight">{p.label}</p>
                  <p className="truncate text-[11px] text-black/40">{p.description}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Chiudi portali" : "Cambia portale"}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white shadow-lg shadow-black/10 transition hover:bg-black/5 active:scale-95"
      >
        {open ? <X size={16} /> : <LayoutGrid size={16} />}
      </button>
    </div>
  );
}
