"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, CreditCard, Landmark } from "lucide-react";

type Method = "bunq" | "carta" | "bonifico";

type BonificoDetails = {
  iban: string;
  intestatario: string;
  causale: string;
};

type Props = {
  method: Method;
  amount: number;
  actionUrl: string | null;
  bonificoDetails: BonificoDetails | null;
};

const PYNK = {
  primary: "hsl(330 80% 60%)",
  fg:      "hsl(0 0% 98%)",
  muted:   "hsl(330 10% 65%)",
  border:  "hsl(330 20% 22%)",
  input:   "hsl(240 8% 14%)",
};

function formatEUR(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: PYNK.muted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 6px" }}>
        {label}
      </p>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: PYNK.input,
        border: `1px solid ${PYNK.border}`,
        borderRadius: 10,
        padding: "10px 14px",
      }}>
        <span style={{ flex: 1, fontSize: 13, color: PYNK.fg, wordBreak: "break-all" }}>{value}</span>
        <button
          onClick={copy}
          style={{
            flexShrink: 0,
            background: "none",
            border: "none",
            padding: 4,
            cursor: "pointer",
            color: copied ? "hsl(145 60% 50%)" : PYNK.muted,
            display: "flex",
            alignItems: "center",
          }}
          title="Copia"
        >
          {copied ? <Check size={15} strokeWidth={2} /> : <Copy size={15} strokeWidth={1.7} />}
        </button>
      </div>
    </div>
  );
}

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        marginTop: 14,
        background: "none",
        border: `1px solid ${PYNK.border}`,
        borderRadius: 8,
        padding: "8px 14px",
        cursor: "pointer",
        color: PYNK.muted,
        fontSize: 12,
        fontFamily: "inherit",
      }}
    >
      {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={1.7} />}
      {copied ? "Link copiato" : "Copia link pagamento"}
    </button>
  );
}

export function PynkPaymentRight({ method, amount, actionUrl, bonificoDetails }: Props) {
  if (method === "bonifico" && bonificoDetails) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "hsl(240 8% 18%)",
            border: `1px solid ${PYNK.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Landmark size={20} strokeWidth={1.5} style={{ color: PYNK.muted }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: PYNK.fg }}>Bonifico bancario</p>
            <p style={{ margin: 0, fontSize: 12, color: PYNK.muted }}>Importo: {formatEUR(amount)}</p>
          </div>
        </div>

        <CopyField label="IBAN" value={bonificoDetails.iban} />
        <CopyField label="Intestatario" value={bonificoDetails.intestatario} />
        <CopyField label="Causale" value={bonificoDetails.causale} />

        <p style={{ marginTop: 20, fontSize: 12, color: PYNK.muted, lineHeight: 1.6 }}>
          Effettua il bonifico con i dati sopra. Riceverai una conferma di attivazione entro 1–2 giorni lavorativi dalla ricezione del pagamento.
        </p>
      </div>
    );
  }

  if (method === "bunq" && actionUrl) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#00896822",
            border: "1px solid #00896844",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 14, color: "#008968",
          }}>
            b
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: PYNK.fg }}>bunq</p>
            <p style={{ margin: 0, fontSize: 12, color: PYNK.muted }}>Pagamento sicuro</p>
          </div>
        </div>

        <p style={{ fontSize: 36, fontWeight: 800, color: PYNK.fg, margin: "0 0 28px", letterSpacing: "-0.02em" }}>
          {formatEUR(amount)}
        </p>

        <a
          href={actionUrl}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "16px 24px",
            background: "#008968",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 16,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <CreditCard size={18} strokeWidth={1.7} />
          Paga ora con bunq
          <ExternalLink size={14} strokeWidth={1.7} />
        </a>

        <CopyLink url={actionUrl} />
      </div>
    );
  }

  if (method === "carta" && actionUrl) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#6366f122",
            border: "1px solid #6366f144",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CreditCard size={20} strokeWidth={1.5} style={{ color: "#818cf8" }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: PYNK.fg }}>Pagamento con carta</p>
            <p style={{ margin: 0, fontSize: 12, color: PYNK.muted }}>Powered by Stripe</p>
          </div>
        </div>

        <p style={{ fontSize: 36, fontWeight: 800, color: PYNK.fg, margin: "0 0 28px", letterSpacing: "-0.02em" }}>
          {formatEUR(amount)}
        </p>

        <a
          href={actionUrl}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "16px 24px",
            background: "#6366f1",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 16,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <CreditCard size={18} strokeWidth={1.7} />
          Paga con carta
          <ExternalLink size={14} strokeWidth={1.7} />
        </a>
      </div>
    );
  }

  return (
    <p style={{ color: PYNK.muted, fontSize: 14 }}>
      Nessuna azione di pagamento disponibile. Contatta lo studio per assistenza.
    </p>
  );
}
