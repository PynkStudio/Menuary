"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveDestination, type LoginFrom } from "@/lib/login-url";
import { notifyParentAndClose } from "@/lib/login-popup";
import { useSearchParams } from "next/navigation";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantSlugFromFrom } from "@/lib/login-url";

interface Props {
  from: LoginFrom | null;
  next: string | null;
  popup: boolean;
  error?: string | null;
}

export function LoginPortalForm({ from, next, popup, error: initialError }: Props) {
  const searchParams = useSearchParams();
  // Origin del parent che ha aperto il popup (passato come ?origin=...)
  const parentOrigin = searchParams.get("origin") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [loading, setLoading] = useState(false);

  const slug = tenantSlugFromFrom(from);
  const tenant = slug ? TENANTS.find((t) => t.id === slug) : null;

  // Etichetta contestuale
  const portalLabel =
    tenant?.name ??
    (from === "admin"
      ? "Menuary · Back-office"
      : from === "studio"
      ? "Menuary · Studio"
      : "Menuary");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      setError("Email o password non corretti.");
      setLoading(false);
      return;
    }

    // Recupera ruolo dal DB
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("role, tenant_id")
      .eq("auth_user_id", data.user.id)
      .single();

    const role = adminRow?.role ?? null;
    const tenantId = adminRow?.tenant_id ?? null;
    const destination = resolveDestination({ from, next, role, tenantId });

    if (popup) {
      notifyParentAndClose({
        from: from ?? "clienti",
        parentOrigin,
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    } else {
      window.location.href = destination;
    }
  }

  // Link "password dimenticata" con from preservato
  const recoveryHref = from
    ? `/recupera-password?from=${encodeURIComponent(from)}${next ? `&next=${encodeURIComponent(next)}` : ""}`
    : "/recupera-password";

  // Link "registrati" solo per portale clienti
  const showRegister = from === "clienti" || from === null;
  const registerHref = from
    ? `/registrati?from=${encodeURIComponent(from)}`
    : "/registrati";

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="mb-6 text-center">
        {/* Logo / wordmark del tenant o di Menuary */}
        <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">
          {portalLabel}
        </p>
        <h1 className="mt-2 text-2xl font-bold leading-tight">Accedi</h1>
      </div>

      <label className="block text-sm font-semibold">
        Email
        <input
          type="email"
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--login-accent,#B8332E)] focus:ring-2 focus:ring-[var(--login-accent,#B8332E)]/20"
          required
        />
      </label>

      <div>
        <label className="block text-sm font-semibold">
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--login-accent,#B8332E)] focus:ring-2 focus:ring-[var(--login-accent,#B8332E)]/20"
            required
          />
        </label>
        <div className="mt-1.5 flex justify-end">
          <Link
            href={recoveryHref}
            className="text-xs opacity-50 hover:opacity-80 transition-opacity"
          >
            Password dimenticata?
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{ backgroundColor: "var(--login-accent, #B8332E)" }}
        className="w-full rounded-xl py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Accesso in corso…" : "Entra"}
      </button>

      {showRegister && (
        <p className="text-center text-sm opacity-60">
          Non hai un account?{" "}
          <Link href={registerHref} className="font-semibold underline-offset-2 hover:underline">
            Registrati
          </Link>
        </p>
      )}
    </form>
  );
}
