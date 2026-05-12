"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import {
  getAdminPassword,
  getSafeAdminPostLoginPath,
  setAdminSession,
} from "@/lib/admin-auth";
import { usePlatformMode } from "@/components/platform-mode-provider";
import { useTenant } from "@/components/tenant-provider";

export default function LoginPage() {
  const mode = usePlatformMode();
  const tenant = useTenant();
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === getAdminPassword()) {
      setAdminSession();
      const nextRaw =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("next")
          : null;
      router.replace(getSafeAdminPostLoginPath(nextRaw));
    } else {
      setErr("Password errata. Riprova.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pork-ink p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl bg-pork-cream p-8 shadow-2xl"
      >
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-pork-red text-white">
          <Lock size={22} />
        </div>
        <h1 className="headline text-center text-3xl">Area riservata</h1>
        <p className="mt-1 text-center text-sm text-pork-ink/60">
          {mode === "platform-admin"
            ? "Menuary · controllo piattaforma"
            : `${tenant.name} · gestione menu e ordini`}
        </p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
            Password
          </span>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setErr(null);
            }}
            className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-4 py-3 outline-none transition-colors focus:border-pork-red"
          />
        </label>

        {err && (
          <p className="mt-2 text-sm font-semibold text-pork-red">{err}</p>
        )}

        <button type="submit" className="btn-primary mt-5 w-full">
          Entra
        </button>

        <p className="mt-4 text-center text-[11px] text-pork-ink/50">
          Usa la password fornita per il tuo ambiente. Per assistenza sull’accesso contatta chi
          gestisce il servizio.
        </p>
      </form>
    </div>
  );
}
