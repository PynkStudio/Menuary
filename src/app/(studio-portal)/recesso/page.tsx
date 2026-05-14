import type { Metadata } from "next";
import { StudioRecessoPanel } from "@/components/studio/studio-recesso-panel";

export const metadata: Metadata = {
  title: "Recesso",
};

export default function StudioRecessoPage() {
  return (
    <div>
      <p className="menuary-section-label">Contratto</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">Recesso dal servizio</h1>
      <p className="mt-3 max-w-2xl text-[var(--menuary-muted)]">
        Gestione della disdetta e delle conseguenze su fatturazione e pubblicazione. Per supporto
        operativo (es. export contenuti) usa anche il back-office o{" "}
        <a href="mailto:hello@menuary.it" className="menuary-link text-sm">
          hello@menuary.it
        </a>
        .
      </p>
      <div className="mt-10">
        <StudioRecessoPanel />
      </div>
    </div>
  );
}
