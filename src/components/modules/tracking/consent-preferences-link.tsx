"use client";

import { useEffect, useState } from "react";
import { openConsentPreferences } from "@/lib/tracking/client";
import { getConsentPreferencesLabel } from "./consent-copy";

/** Link "Preferenze cookie" da mettere nei footer: riapre il banner di consenso. */
export function ConsentPreferencesLink({ className, label }: { className?: string; label?: string }) {
  const [resolved, setResolved] = useState(label ?? getConsentPreferencesLabel("it"));

  useEffect(() => {
    if (!label) setResolved(getConsentPreferencesLabel(document.documentElement.lang));
  }, [label]);

  return (
    <button type="button" onClick={openConsentPreferences} className={className}>
      {resolved}
    </button>
  );
}
