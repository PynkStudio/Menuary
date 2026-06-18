"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { notifyParentAndClose } from "@/lib/login-popup";
import { isSafeDestination } from "@/lib/login-url";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Pagina intermedia post-login.
 *
 * Popup mode:   recupera la session corrente da Supabase e la passa al parent
 *               via postMessage (per token exchange su domini custom), poi chiude.
 * Redirect mode: segue il parametro `destination` direttamente.
 */
export default function AuthSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const destination = searchParams.get("destination");
    const from = searchParams.get("from") ?? "clienti";
    const parentOrigin = searchParams.get("origin") ?? "";
    const isPopup = !!window.opener && !window.opener.closed;

    if (isPopup) {
      const supabase = createSupabaseBrowserClient();
      // Timeout di sicurezza: chiude il popup se getSession non risponde
      const safetyTimer = setTimeout(() => window.close(), 15_000);
      supabase.auth.getSession()
        .then(({ data }) => {
          clearTimeout(safetyTimer);
          if (data.session) {
            notifyParentAndClose({
              from,
              parentOrigin,
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
            });
          } else {
            window.close();
          }
        })
        .catch(() => {
          clearTimeout(safetyTimer);
          window.close();
        });
    } else if (isSafeDestination(destination)) {
      window.location.href = destination;
    } else {
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F0EA]">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-black/10 border-t-black/40" />
        <p className="mt-4 text-sm text-black/50">Accesso completato…</p>
      </div>
    </div>
  );
}
