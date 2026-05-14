"use client";

import Link from "next/link";
import { useHydrated } from "@/components/core/providers";

export default function StaffPortalPage() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return (
    <div className="container-wide py-16">
      <h1 className="headline text-4xl">Area personale staff</h1>
      <p className="mt-3 max-w-xl text-pork-ink/70">
        Turni e richieste ferie sono gestiti in Supabase con il tuo account Menuary. Accedi dal
        banner &quot;Accedi con Menuary&quot; per vedere i turni assegnati e inviare richieste.
      </p>
      <ul className="mt-8 list-disc space-y-2 pl-6 text-sm text-pork-ink/80">
        <li>
          Iscrizione notifiche push: endpoint{" "}
          <code className="rounded bg-pork-ink/10 px-1">/api/push/subscribe</code> (VAPID pubblica
          in <code className="rounded bg-pork-ink/10 px-1">/api/push/vapid-public-key</code>).
        </li>
        <li>
          Tabelle: <code className="rounded bg-pork-ink/10 px-1">staff_shifts</code>,{" "}
          <code className="rounded bg-pork-ink/10 px-1">time_off_requests</code> (RLS self-service).
        </li>
      </ul>
      <Link href="/menu" className="btn-primary mt-8 inline-flex">
        Torna al menu
      </Link>
    </div>
  );
}
