import { headers } from "next/headers";
import type { Metadata } from "next";
import { getPlatformModeFromHost } from "@/lib/platform";
import { StudioRecessoPanel } from "@/components/studio/studio-recesso-panel";
import { BizeryStudioRecessoPanel } from "@/components/bizery-studio/bizery-studio-recesso-panel";

export const metadata: Metadata = {
  title: "Recesso",
};

export default async function StudioRecessoPage() {
  const mode = getPlatformModeFromHost((await headers()).get("host"));

  if (mode === "studio-bizery") {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--bs-accent)]">Contratto</p>
        <h1
          className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.02em]"
          style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
        >
          Recesso dal servizio
        </h1>
        <p className="mt-3 max-w-2xl text-[var(--bs-muted)]">
          Gestione della disdetta e delle conseguenze su fatturazione e pubblicazione. Per supporto
          operativo (es. export contenuti) usa anche il pannello gestione o{" "}
          <a href="mailto:hello@bizery.it" className="font-semibold text-[var(--bs-accent)] hover:underline text-sm">
            hello@bizery.it
          </a>
          .
        </p>
        <div className="mt-10">
          <BizeryStudioRecessoPanel />
        </div>
      </div>
    );
  }

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
