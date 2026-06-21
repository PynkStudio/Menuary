"use client";

import { useEffect, useMemo, useState } from "react";
import { AlarmClock } from "lucide-react";

type Props = {
  expiresAt: string;
  timeoutTemplate: string;
};

function secondsUntil(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

export function OrderExpiryCountdown({ expiresAt, timeoutTemplate }: Props) {
  const initialSeconds = useMemo(() => secondsUntil(expiresAt), [expiresAt]);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(secondsUntil(expiresAt));
    const id = window.setInterval(() => {
      setSecondsLeft(secondsUntil(expiresAt));
    }, 1_000);
    return () => window.clearInterval(id);
  }, [expiresAt]);

  return (
    <span style={{ color: "var(--ga-warn, #B8332E)", fontWeight: 600 }} aria-live="polite">
      <AlarmClock size={12} strokeWidth={2.2} /> {timeoutTemplate.replace("{seconds}", String(secondsLeft))}
    </span>
  );
}
