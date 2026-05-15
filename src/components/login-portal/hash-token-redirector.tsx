"use client";

import { useEffect } from "react";

/**
 * Rileva access_token nel hash fragment e rimanda a /confirm.
 * Supabase usa il site URL come redirect_to di fallback quando il nostro
 * custom redirect_to non è nella whitelist — il token arriva alla root
 * di login.menuary.it invece che a /confirm.
 */
export function HashTokenRedirector() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("access_token")) {
      window.location.replace("/confirm" + window.location.hash);
    }
  }, []);

  return null;
}
