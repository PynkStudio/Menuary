import type { Metadata } from "next";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Mail } from "lucide-react";
import { lookupPaymentByContractRef } from "@/lib/payments/payment-lookup";
import { FORNITORE } from "@/lib/contracts/menuary-contract";
import { PynkPaymentRight } from "./pynk-payment-right";

export const metadata: Metadata = {
  robots: "noindex",
  title: "Pagamento — Pynk Studio",
};

type Status = "success" | "failed" | "cancelled" | "processing";

const PYNK = {
  bg:       "hsl(240 8% 6%)",
  panel:    "hsl(240 8% 9%)",
  card:     "hsl(240 8% 12%)",
  fg:       "hsl(0 0% 98%)",
  muted:    "hsl(330 10% 60%)",
  primary:  "hsl(330 80% 60%)",
  border:   "hsl(330 20% 20%)",
  divider:  "hsl(330 20% 16%)",
};

const BRAND_COLOR: Record<string, string> = {
  menuary: "#B8332E",
  bizery:  "#2563EB",
  orpheo:  "#7C3AED",
};

const BRAND_LABEL: Record<string, string> = {
  menuary: "Menuary",
  bizery:  "Bizery",
  orpheo:  "Orpheo",
};

const BILLING_LABEL: Record<string, string> = {
  monthly: "al mese",
  yearly:  "all'anno",
};

function formatEUR(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(s: string | null) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

function validStatus(s: string | undefined): Status | null {
  if (s === "success" || s === "failed" || s === "cancelled" || s === "processing") return s;
  return null;
}

type Props = {
  searchParams: Promise<{ ref?: string; status?: string }>;
};

export default async function PynkCheckoutPage({ searchParams }: Props) {
  const p = await searchParams;
  const status = validStatus(p.status);

  const lookup = p.ref ? await lookupPaymentByContractRef(p.ref) : null;
  const data = lookup?.found ? lookup : null;

  const brandColor = data ? (BRAND_COLOR[data.brand] ?? PYNK.primary) : PYNK.primary;
  const brandLabel = data ? (BRAND_LABEL[data.brand] ?? data.brand) : "Pynk Studio";

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: PYNK.bg,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      color: PYNK.fg,
    }}>
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "100dvh",
      }}
        className="pynk-checkout-grid"
      >
        {/* ── Left: contract summary ───────────────────────────────── */}
        <div style={{
          background: PYNK.bg,
          padding: "60px 56px",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${PYNK.divider}`,
        }}>
          {/* Studio wordmark */}
          <div style={{ marginBottom: 56 }}>
            <span style={{
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: `linear-gradient(135deg, ${PYNK.primary}, hsl(330 80% 78%))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Pynk Studio
            </span>
          </div>

          {!data ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <p style={{ color: PYNK.muted, fontSize: 15 }}>
                Link di pagamento non valido o scaduto.
              </p>
              <a
                href="mailto:amministrazione@pynkstudio.it"
                style={{ marginTop: 16, color: PYNK.primary, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
              >
                <Mail size={14} strokeWidth={1.7} />
                Contattaci per assistenza
              </a>
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: PYNK.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Riepilogo
              </p>
              <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 32px", lineHeight: 1.25, letterSpacing: "-0.02em" }}>
                {data.businessName || "Il tuo abbonamento"}
              </h1>

              {/* Brand badge */}
              <span style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: `${brandColor}18`,
                border: `1px solid ${brandColor}44`,
                color: brandColor,
                marginBottom: 28,
              }}>
                {brandLabel}
              </span>

              {/* Summary rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {data.planName && (
                  <SummaryRow label="Piano" value={data.planName} />
                )}
                <SummaryRow
                  label="Importo"
                  value={`${formatEUR(data.amount)} ${BILLING_LABEL[data.cicloFatturazione] ?? ""}`}
                  highlight
                />
                {data.contractNumber && (
                  <SummaryRow label="Contratto" value={data.contractNumber} mono />
                )}
                {data.dueDate && (
                  <SummaryRow label="Scadenza" value={formatDate(data.dueDate) ?? ""} />
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: `1px solid ${PYNK.divider}`,
          }}>
            <p style={{ margin: 0, fontSize: 11, color: PYNK.muted, lineHeight: 1.7 }}>
              Fatturato da <strong style={{ color: PYNK.fg }}>{FORNITORE.ragioneSociale}</strong>
              <br />
              {FORNITORE.piva && `P.IVA ${FORNITORE.piva} · `}
              <a
                href="mailto:amministrazione@pynkstudio.it"
                style={{ color: PYNK.muted, textDecoration: "none" }}
              >
                amministrazione@pynkstudio.it
              </a>
            </p>
          </div>
        </div>

        {/* ── Right: payment interface ──────────────────────────────── */}
        <div style={{
          background: PYNK.panel,
          padding: "60px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}>
          {!data ? (
            <NotFoundState />
          ) : status === "success" ? (
            <SuccessState brand={brandLabel} businessName={data.businessName} />
          ) : status === "cancelled" ? (
            <CancelledState />
          ) : (
            <>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: PYNK.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {status === "processing" ? "In elaborazione" : "Completa il pagamento"}
              </p>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 36px", letterSpacing: "-0.02em" }}>
                {data.method === "bonifico"
                  ? "Effettua il bonifico"
                  : data.method === "bunq"
                    ? "Paga con bunq"
                    : "Paga con carta"}
              </h2>

              {status === "processing" ? (
                <ProcessingState />
              ) : (
                <PynkPaymentRight
                  method={data.method}
                  amount={data.amount}
                  actionUrl={data.actionUrl}
                  bonificoDetails={data.bonificoDetails}
                />
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pynk-checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function SummaryRow({ label, value, highlight, mono }: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 16,
      padding: "14px 0",
      borderBottom: `1px solid ${PYNK.divider}`,
    }}>
      <span style={{ fontSize: 13, color: PYNK.muted, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize: highlight ? 17 : 14,
        fontWeight: highlight ? 700 : 500,
        color: highlight ? PYNK.fg : "hsl(0 0% 88%)",
        textAlign: "right",
        fontFamily: mono ? "monospace" : "inherit",
        letterSpacing: highlight ? "-0.01em" : "inherit",
      }}>
        {value}
      </span>
    </div>
  );
}

function SuccessState({ brand, businessName }: { brand: string; businessName: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "hsl(145 60% 42% / 0.12)",
        marginBottom: 24,
      }}>
        <CheckCircle2 size={36} strokeWidth={1.5} style={{ color: "hsl(145 60% 50%)" }} />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
        Pagamento ricevuto
      </h2>
      <p style={{ fontSize: 14, color: PYNK.muted, lineHeight: 1.7, margin: 0 }}>
        Grazie! Abbiamo ricevuto il tuo pagamento per {businessName || `l'abbonamento ${brand}`}.
        Il servizio sarà attivato a breve e riceverai una conferma via email.
      </p>
    </div>
  );
}

function CancelledState() {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "hsl(38 92% 50% / 0.12)",
        marginBottom: 24,
      }}>
        <AlertTriangle size={36} strokeWidth={1.5} style={{ color: "hsl(38 92% 60%)" }} />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
        Pagamento annullato
      </h2>
      <p style={{ fontSize: 14, color: PYNK.muted, lineHeight: 1.7, margin: 0 }}>
        Hai annullato l'operazione. Puoi chiudere questa finestra o contattarci per riprogrammare il pagamento.
      </p>
      <a
        href="mailto:amministrazione@pynkstudio.it"
        style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: PYNK.primary, textDecoration: "none" }}
      >
        Scrivi allo studio →
      </a>
    </div>
  );
}

function ProcessingState() {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: `${PYNK.primary}18`,
        marginBottom: 24,
      }}>
        <Clock size={36} strokeWidth={1.5} style={{ color: PYNK.primary }} />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
        In elaborazione
      </h2>
      <p style={{ fontSize: 14, color: PYNK.muted, lineHeight: 1.7, margin: 0 }}>
        Abbiamo ricevuto il tuo pagamento e lo stiamo verificando. Riceverai una conferma via email a breve.
      </p>
    </div>
  );
}

function NotFoundState() {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "hsl(0 72% 51% / 0.12)",
        marginBottom: 24,
      }}>
        <XCircle size={36} strokeWidth={1.5} style={{ color: "hsl(0 72% 60%)" }} />
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
        Link non valido
      </h2>
      <p style={{ fontSize: 14, color: PYNK.muted, lineHeight: 1.7, margin: 0 }}>
        Questo link di pagamento non è più valido. Contattaci e ti invieremo un nuovo link.
      </p>
      <a
        href="mailto:amministrazione@pynkstudio.it"
        style={{ display: "inline-block", marginTop: 20, fontSize: 13, color: PYNK.primary, textDecoration: "none" }}
      >
        amministrazione@pynkstudio.it
      </a>
    </div>
  );
}
