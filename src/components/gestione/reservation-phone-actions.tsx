"use client";

import { useState } from "react";
import { Copy, PhoneCall } from "lucide-react";

type Props = {
  phone: string;
};

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function ReservationPhoneActions({ phone }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className="ga-phone-actions">
      <a className="ga-phone-link" href={telHref(phone)} aria-label={`Chiama ${phone}`}>
        <PhoneCall size={12} strokeWidth={2.2} />
        {phone}
      </a>
      <button type="button" className="ga-phone-copy" onClick={copyPhone} aria-label={`Copia ${phone}`}>
        <Copy size={12} strokeWidth={2.2} />
        <span>{copied ? "Copiato" : "Copia"}</span>
      </button>
    </span>
  );
}
