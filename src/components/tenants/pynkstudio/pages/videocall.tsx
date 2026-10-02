"use client";

import "@pynkstudio/agendaapp/video/styles.css";

import Link from "next/link";
import { CalendarDays, MessageSquare } from "lucide-react";
import { AgendaVideoCall } from "@pynkstudio/agendaapp/video/react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { pynkVideoLabels } from "@/lib/pynkstudio/video-labels";

export type PynkVideocallState =
  | { kind: "ready"; bookingId: string; token: string; name: string; slotLabel: string; topic: string | null }
  | { kind: "invalid" | "not_video" | "cancelled" };

function VideocallInner({ state }: { state: PynkVideocallState }) {
  const c = usePynkCopy().videocallPage;
  const href = useTenantLocalizedHref();

  const labels = pynkVideoLabels(c.labels);

  return (
    <div className="pynk-page">
      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-tl" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <p className="pynk-eyebrow">{c.eyebrow}</p>
          {state.kind === "ready" ? (
            <>
              <h1 className="pynk-hero-title">
                {c.titleLead} <span className="pynk-accent">{c.titleAccent}</span>
              </h1>
              <p className="pynk-hero-subtitle">{c.subtitle}</p>
            </>
          ) : (
            <>
              <h1 className="pynk-hero-title">{c.invalidTitle}</h1>
              <p className="pynk-hero-subtitle">
                {state.kind === "not_video" ? c.notVideoBody : state.kind === "cancelled" ? c.cancelledBody : c.invalidBody}
              </p>
              <Link href={href("/prenota-call")} className="pynk-btn pynk-btn-primary pynk-mt-24">
                {c.bookAgain}
              </Link>
            </>
          )}
        </div>
      </section>

      {state.kind === "ready" && (
        <section className="pynk-section">
          <div className="pynk-container">
            <div className="pynk-videocall-meta">
              <span className="pynk-cal-grazie-slot">
                <CalendarDays className="pynk-icon-sm" aria-label={c.whenLabel} /> {state.slotLabel}
              </span>
              {state.topic && (
                <span className="pynk-note">
                  <MessageSquare className="pynk-icon-sm pynk-accent" aria-label={c.topicLabel} /> {state.topic}
                </span>
              )}
            </div>
            <div className="pynk-videocall-lobby">
              <AgendaVideoCall
                displayName={state.name}
                title={c.callTitle}
                labels={labels}
                className="pynk-agv"
                getAccess={async () => {
                  const res = await fetch("/api/tenant/pynkstudio/bookings/video-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ bookingId: state.bookingId, token: state.token }),
                  });
                  return res.json();
                }}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export function PynkStudioVideocallPage({ state }: { state: PynkVideocallState }) {
  return (
    <PynkShell>
      <VideocallInner state={state} />
    </PynkShell>
  );
}
