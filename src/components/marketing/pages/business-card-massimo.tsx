"use client";

import { QRCodeSVG } from "qrcode.react";
import { Mail, Phone, Globe } from "lucide-react";

const CARD_URL = "https://menuary.it/team/massimo";
const PHONE_DISPLAY = "+39 351 376 8607";
const PHONE_E164 = "+393513768607";
const EMAIL = "massimo@menuary.it";

export function MassimoCard() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: "var(--menuary-porcelain)" }}
    >
      <div className="w-full max-w-[360px]">
        {/* Wordmark */}
        <p
          className="text-center mb-8 text-xs tracking-[0.35em] uppercase"
          style={{ color: "var(--menuary-muted)" }}
        >
          Menuary
        </p>

        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden shadow-[0_2px_24px_rgba(24,35,31,0.10)]"
          style={{ background: "#fff", border: "1px solid var(--menuary-line)" }}
        >
          {/* Copper stripe */}
          <div
            className="h-[3px]"
            style={{
              background:
                "linear-gradient(90deg, var(--menuary-copper) 0%, var(--menuary-gold) 100%)",
            }}
          />

          <div className="px-8 pt-8 pb-8">
            {/* Name & title */}
            <div className="mb-7">
              <h1
                className="text-[1.6rem] leading-tight"
                style={{
                  fontFamily: "var(--font-menuary-display), Georgia, serif",
                  color: "var(--menuary-ink)",
                }}
              >
                Massimo Pernozzoli
              </h1>
              <p
                className="mt-1 text-[13px] tracking-wide"
                style={{ color: "var(--menuary-copper)" }}
              >
                Direttore Tecnico
              </p>
            </div>

            {/* Contacts */}
            <div className="space-y-3 mb-7">
              <a
                href={`mailto:${EMAIL}`}
                className="flex items-center gap-3 text-[14px] transition-colors"
                style={{ color: "var(--menuary-ink)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--menuary-copper)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--menuary-ink)")
                }
              >
                <Mail
                  size={15}
                  strokeWidth={1.6}
                  style={{ color: "var(--menuary-copper)" }}
                  className="shrink-0"
                />
                {EMAIL}
              </a>

              <a
                href={`tel:${PHONE_E164}`}
                className="flex items-center gap-3 text-[14px] transition-colors"
                style={{ color: "var(--menuary-ink)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--menuary-copper)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--menuary-ink)")
                }
              >
                <Phone
                  size={15}
                  strokeWidth={1.6}
                  style={{ color: "var(--menuary-copper)" }}
                  className="shrink-0"
                />
                {PHONE_DISPLAY}
              </a>

              <a
                href="https://menuary.it"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-[14px] transition-colors"
                style={{ color: "var(--menuary-ink)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--menuary-copper)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--menuary-ink)")
                }
              >
                <Globe
                  size={15}
                  strokeWidth={1.6}
                  style={{ color: "var(--menuary-copper)" }}
                  className="shrink-0"
                />
                menuary.it
              </a>
            </div>

            {/* Divider */}
            <div
              className="h-px mb-6"
              style={{ background: "var(--menuary-line)" }}
            />

            {/* QR code */}
            <div className="flex flex-col items-center gap-2">
              <QRCodeSVG
                value={CARD_URL}
                size={128}
                fgColor="#18231f"
                bgColor="transparent"
                level="M"
              />
              <p
                className="text-[11px] tracking-wide"
                style={{ color: "var(--menuary-muted)" }}
              >
                Scansiona per condividere
              </p>
            </div>
          </div>
        </div>

        {/* Save contact */}
        <div className="mt-5 text-center">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/team/massimo/vcard"
            className="text-[12px] underline underline-offset-2 transition-colors"
            style={{ color: "var(--menuary-muted)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--menuary-copper)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--menuary-muted)")
            }
          >
            Salva contatto
          </a>
        </div>
      </div>
    </div>
  );
}
