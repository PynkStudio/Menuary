"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { notifyParentAndClose } from "@/lib/login-popup";

/**
 * Pagina intermedia post-login.
 *
 * Popup mode:  invia postMessage al parent e chiude la finestra.
 * Redirect mode: segue il parametro `destination` direttamente.
 */
export default function AuthSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const destination = searchParams.get("destination");
    const from = searchParams.get("from") ?? "clienti";
    const isPopup = !!window.opener && !window.opener.closed;

    if (isPopup) {
      notifyParentAndClose(from);
    } else if (destination) {
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
