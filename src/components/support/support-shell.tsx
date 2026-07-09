"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bug, LayoutDashboard, LogOut, ShieldAlert } from "lucide-react";
import { clearAdminSession } from "@/lib/admin-auth";

export function SupportShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  function logout() {
    clearAdminSession();
    router.replace("https://login.menuary.it?from=support&next=/");
  }

  return (
    <div className="menuary-admin-root">
      <aside className="menuary-admin-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 flex-col lg:flex">
        <div className="menuary-admin-sidebar-header p-5">
          <Link href="/" className="menuary-admin-brand">
            Menuary · support
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          <Link href="/" className="menuary-admin-nav-link" data-active="true">
            <LayoutDashboard size={18} />
            Registro errori
          </Link>
          <Link href="https://admin.menuary.it/admin/supporto" className="menuary-admin-nav-link">
            <ShieldAlert size={18} />
            Ticket supporto
          </Link>
          <Link href="https://admin.menuary.it/admin" className="menuary-admin-nav-link">
            <Bug size={18} />
            Admin platform
          </Link>
        </nav>
        <div className="mx-3 mb-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-white/60">
          <AlertTriangle className="mb-2 text-[var(--menuary-gold)]" size={18} />
          Eventi tecnici da API, edge function, app operative, stampa e automazioni.
        </div>
        <button onClick={logout} className="menuary-admin-logout">
          <LogOut size={18} /> Esci
        </button>
      </aside>
      <div className="lg:pl-64">
        <header className="menuary-admin-topbar sticky top-0 z-10 flex items-center justify-between px-5 py-3 lg:hidden">
          <span className="menuary-admin-topbar-title">Support</span>
          <button onClick={logout} className="text-sm font-bold text-[var(--menuary-ink)]">
            Esci
          </button>
        </header>
        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
