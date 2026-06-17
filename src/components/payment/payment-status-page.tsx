import { CheckCircle2, XCircle, Clock, AlertTriangle, CreditCard, ExternalLink } from "lucide-react";

type PaymentBrand = "menuary" | "bizery" | "orpheo";
type PaymentStatus = "success" | "failed" | "cancelled" | "processing";

export type PaymentAction = {
  method: "bunq" | "carta" | "bonifico";
  amount: number;
  actionUrl: string | null;
  bonificoDetails: {
    iban: string;
    intestatario: string;
    causale: string;
  } | null;
};

const BRAND_STYLES: Record<PaymentBrand, {
  name: string;
  primary: string;
  bg: string;
  text: string;
  muted: string;
  border: string;
}> = {
  menuary: {
    name: "Menuary",
    primary: "#B8332E",
    bg: "#FFF4E6",
    text: "#141010",
    muted: "#7A6060",
    border: "#E8D5B5",
  },
  bizery: {
    name: "Bizery",
    primary: "#2563EB",
    bg: "#F0F5FF",
    text: "#0F172A",
    muted: "#64748B",
    border: "#BFDBFE",
  },
  orpheo: {
    name: "Orpheo",
    primary: "#7C3AED",
    bg: "#FBFAF7",
    text: "#17111F",
    muted: "#6B5E75",
    border: "#DDD6FE",
  },
};

const STATUS_MESSAGES: Record<PaymentStatus, {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
}> = {
  success: {
    icon: CheckCircle2,
    title: "Pagamento completato",
    description: "Grazie, il pagamento è stato ricevuto con successo. Il servizio verrà attivato a breve. Riceverai una conferma via email.",
  },
  failed: {
    icon: XCircle,
    title: "Pagamento non riuscito",
    description: "Il pagamento non è stato completato. Puoi riprovare o contattare il supporto per assistenza.",
  },
  cancelled: {
    icon: AlertTriangle,
    title: "Pagamento annullato",
    description: "Hai annullato il pagamento. Se desideri procedere, ti invieremo un nuovo link per completare l'operazione.",
  },
  processing: {
    icon: Clock,
    title: "Pagamento in elaborazione",
    description: "Il pagamento è stato avviato. Una volta completato, riceverai una conferma via email. Se hai già effettuato il pagamento, non ti preoccupare: ci arriverà la notifica in automatico.",
  },
};

function formatEUR(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function PaymentStatusPage({
  status,
  brand,
  contractRef: reference,
  paymentAction,
}: {
  status: PaymentStatus;
  brand: PaymentBrand;
  contractRef?: string;
  paymentAction?: PaymentAction | null;
}) {
  const s = BRAND_STYLES[brand];
  const m = STATUS_MESSAGES[status];
  const Icon = m.icon;

  const isPendingWithAction = paymentAction && status !== "success" && status !== "failed";

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: s.bg,
      fontFamily: "-apple-system, system-ui, sans-serif",
      padding: "24px 16px",
    }}>
      <div style={{
        maxWidth: 420,
        width: "100%",
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${s.border}`,
        padding: "40px 32px",
        textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: status === "success" ? "#ECFDF5" : status === "failed" ? "#FEF2F2" : status === "cancelled" ? "#FFFBEB" : "#EFF6FF",
          marginBottom: 24,
        }}>
          <Icon
            size={32}
            style={{
              color: status === "success" ? "#059669" : status === "failed" ? "#DC2626" : status === "cancelled" ? "#D97706" : s.primary,
            }}
            strokeWidth={1.5}
          />
        </div>

        <span style={{
          display: "inline-block",
          padding: "3px 10px",
          background: s.primary,
          color: "#fff",
          borderRadius: 999,
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 16,
        }}>
          {s.name}
        </span>

        <h1 style={{
          fontSize: 22,
          fontWeight: 700,
          color: s.text,
          margin: 0,
          lineHeight: 1.3,
        }}>
          {m.title}
        </h1>

        <p style={{
          fontSize: 14,
          color: s.muted,
          lineHeight: 1.6,
          marginTop: 12,
          marginBottom: 0,
        }}>
          {m.description}
          {reference && (
            <>
              <br />
              <span style={{ fontSize: 12 }}>Riferimento: {reference}</span>
            </>
          )}
        </p>

        {isPendingWithAction && (
          <div style={{
            marginTop: 24,
            padding: 16,
            background: s.bg,
            borderRadius: 12,
            border: `1px solid ${s.border}`,
          }}>
            <p style={{
              fontSize: 13,
              color: s.muted,
              margin: "0 0 8px",
              fontWeight: 600,
            }}>
              Importo da pagare: {formatEUR(paymentAction.amount)}
            </p>

            {paymentAction.method === "bonifico" && paymentAction.bonificoDetails ? (
              <div style={{ textAlign: "left", fontSize: 13, lineHeight: 1.7, color: s.text }}>
                <p style={{ margin: "4px 0" }}>
                  <strong>IBAN:</strong> {paymentAction.bonificoDetails.iban}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>Intestatario:</strong> {paymentAction.bonificoDetails.intestatario}
                </p>
                <p style={{ margin: "4px 0" }}>
                  <strong>Causale:</strong> {paymentAction.bonificoDetails.causale}
                </p>
              </div>
            ) : paymentAction.actionUrl ? (
              <a
                href={paymentAction.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                  padding: "12px 28px",
                  background: s.primary,
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                <CreditCard size={16} strokeWidth={1.7} />
                {paymentAction.method === "bunq" ? "Paga con Bunq" : "Paga con carta"}
                <ExternalLink size={14} strokeWidth={1.7} />
              </a>
            ) : null}
          </div>
        )}

        <div style={{ marginTop: isPendingWithAction ? 20 : 32, display: "flex", flexDirection: "column", gap: 10 }}>
          {status === "failed" && (
            <a
              href={`mailto:support@${brand === "orpheo" ? "weuseorpheo" : brand}.it`}
              style={{
                display: "block",
                padding: "12px 24px",
                background: s.primary,
                color: "#fff",
                textDecoration: "none",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Contatta il supporto
            </a>
          )}
          <a
            href={`https://${brand === "orpheo" ? "weuseorpheo" : brand}.it`}
            style={{
              display: "block",
              padding: "12px 24px",
              border: `1px solid ${s.border}`,
              color: s.text,
              textDecoration: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Torna alla home
          </a>
        </div>
      </div>
    </div>
  );
}
