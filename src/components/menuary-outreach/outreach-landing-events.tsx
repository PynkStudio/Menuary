"use client";

import { useEffect } from "react";

export function OutreachLandingEvents({ token }: { token: string }) {
  useEffect(() => {
    void fetch(`/api/menuary/outreach/${token}/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "landing_viewed" }),
      keepalive: true,
    });
  }, [token]);
  return null;
}

export function OutreachVideoLink({ token, href }: { token: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mol-video-button"
      onClick={() => void fetch(`/api/menuary/outreach/${token}/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "video_clicked" }),
        keepalive: true,
      })}
    >
      <span aria-hidden>▶</span> Guarda il video di 60 secondi
    </a>
  );
}
