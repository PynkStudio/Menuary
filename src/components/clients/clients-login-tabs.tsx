"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "cliente" | "titolare";

export function ClientsLoginTabs() {
  const [tab, setTab] = useState<Tab>("cliente");

  return (
    <div className="mx-auto max-w-md">
      <div className="flex rounded-full border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-1">
        <button
          type="button"
          onClick={() => setTab("cliente")}
          className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
            tab === "cliente"
              ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
              : "text-[var(--menuary-muted)]"
          }`}
        >
          Cliente
        </button>
        <button
          type="button"
          onClick={() => setTab("titolare")}
          className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
            tab === "titolare"
              ? "bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
              : "text-[var(--menuary-muted)]"
          }`}
        >
          Titolare / staff
        </button>
      </div>

      {tab === "cliente" ? (
        <form className="mt-10 space-y-5" onSubmit={(e) => e.preventDefault()}>
          <p className="text-sm text-[var(--menuary-muted)]">
            Accesso con email e password (Supabase Auth). Form di esempio: collegare azioni server
            e redirect dai siti dei ristoranti.
          </p>
          <label className="block text-sm font-bold">
            Email
            <input
              type="email"
              name="email"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3 text-[var(--menuary-ink)]"
              placeholder="nome@email.it"
            />
          </label>
          <label className="block text-sm font-bold">
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-[var(--menuary-line)] bg-white px-4 py-3 text-[var(--menuary-ink)]"
            />
          </label>
          <button type="submit" className="menuary-button menuary-button-accent w-full justify-center">
            Accedi
          </button>
        </form>
      ) : (
        <div className="mt-10 space-y-4 text-sm text-[var(--menuary-muted)]">
          <p>
            Per gestire menu, ordini e impostazioni del locale usa il back-office dedicato su
            dominio <strong className="text-[var(--menuary-ink)]">admin.menuary.it</strong>.
          </p>
          <Link
            href="https://admin.menuary.it"
            className="menuary-button menuary-button-dark inline-flex w-full justify-center"
          >
            Vai ad admin.menuary.it
          </Link>
        </div>
      )}
    </div>
  );
}
