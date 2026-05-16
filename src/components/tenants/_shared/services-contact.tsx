"use client";

import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { getModuleCopy } from "@/lib/vertical";
import {
  VenueMapFrame,
  useVenueAddressText,
  useVenueMap,
} from "@/components/modules/reservations/venue-display";

const v = {
  bg:           "rgb(var(--tenant-cream))",
  surface:      "rgb(var(--tenant-brick))",
  text:         "rgb(var(--tenant-ink))",
  textMuted:    "rgb(var(--tenant-ink) / 0.55)",
  textFaint:    "rgb(var(--tenant-ink) / 0.28)",
  accent:       "rgb(var(--tenant-red))",
  accentSoft:   "rgb(var(--tenant-red) / 0.12)",
  accentRing:   "rgb(var(--tenant-red) / 0.25)",
  border:       "rgb(var(--tenant-ink) / 0.08)",
  divider:      "rgb(var(--tenant-ink) / 0.06)",
} as const;

export function ServicesContact() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const reservationLabel = getModuleCopy("reservations", tenant.vertical).label;
  const address = useVenueAddressText();
  const map = useVenueMap();

  const contactItems = [
    {
      Icon: Phone,
      label: "Telefono",
      value: content.contact.phone,
      href: `tel:${content.contact.phone}`,
    },
    {
      Icon: MessageCircle,
      label: "WhatsApp",
      value: content.contact.phone,
      href: `https://wa.me/${content.contact.whatsappDigits}?text=${encodeURIComponent(content.contact.whatsappMessage)}`,
      external: true,
    },
    {
      Icon: Mail,
      label: "Email",
      value: `info@${content.url.replace(/https?:\/\/(www\.)?/, "")}`,
      href: `mailto:info@${content.url.replace(/https?:\/\/(www\.)?/, "")}`,
    },
    {
      Icon: MapPin,
      label: "Indirizzo",
      value: address,
      href: map.searchUrl,
      external: true,
    },
    {
      Icon: Clock,
      label: "Orari",
      value: "Lun–Ven 8:30–18:00 · Sab 9:00–13:00",
      href: null,
    },
  ];

  return (
    <section
      id="contatti"
      style={{ backgroundColor: v.surface, color: v.text }}
      className="scroll-mt-20 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Intro */}
        <div className="mb-14 text-center">
          <span
            className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]"
            style={{ backgroundColor: v.accentSoft, color: v.accent, boxShadow: `inset 0 0 0 1px ${v.accentRing}` }}
          >
            Contatti &amp; {reservationLabel}
          </span>
          <h2
            className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
            style={{ color: v.text }}
          >
            {content.findUs.titleLead}{" "}
            <span style={{ color: v.accent }}>{content.findUs.titleAccent}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed" style={{ color: v.textMuted }}>
            {content.findUs.body}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[2fr_3fr]">

          {/* Lista contatti */}
          <div className="flex flex-col gap-2.5">
            {contactItems.map(({ Icon, label, value, href, external }, i) => {
              const Tag = href ? "a" : "div";
              return (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                >
                  <Tag
                    {...(href
                      ? {
                          href,
                          ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
                        }
                      : {})}
                    className="group flex items-start gap-4 rounded-xl p-4 transition-all duration-250"
                    style={{
                      backgroundColor: v.bg,
                      boxShadow: `inset 0 0 0 1px ${v.border}`,
                      display: "flex",
                      textDecoration: "none",
                    }}
                    onMouseEnter={href ? (e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${v.accentRing}`;
                    } : undefined}
                    onMouseLeave={href ? (e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 0 0 1px ${v.border}`;
                    } : undefined}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
                      style={{ backgroundColor: v.accentSoft }}
                    >
                      <Icon size={17} style={{ color: v.accent }} />
                    </div>
                    <div>
                      <div
                        className="text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: v.textFaint }}
                      >
                        {label}
                      </div>
                      <div
                        className="mt-0.5 text-sm font-medium"
                        style={{ color: v.text }}
                      >
                        {value}
                      </div>
                    </div>
                  </Tag>
                </motion.div>
              );
            })}
          </div>

          {/* Mappa */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="overflow-hidden rounded-2xl"
            style={{ boxShadow: `inset 0 0 0 1px ${v.border}`, minHeight: "360px" }}
          >
            <VenueMapFrame
              title={content.findUs.mapTitle}
              dark
              style={{
                minHeight: "360px",
              }}
            />
          </motion.div>
        </div>

        {/* CTA prenotazione */}
        <div className="mt-16 flex flex-col items-center gap-5">
          <p className="text-sm" style={{ color: v.textFaint }}>
            Lavoriamo solo su appuntamento — garantiamo il tuo slot senza attese.
          </p>
          <a
            href={`https://wa.me/${content.contact.whatsappDigits}?text=${encodeURIComponent(content.contact.whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-xl px-7 py-3.5 text-sm font-bold transition-opacity hover:opacity-85"
            style={{ backgroundColor: v.accent, color: "rgb(var(--tenant-cream))" }}
          >
            <MessageCircle size={18} />
            {content.hero.ctaLabel}
          </a>
        </div>

        {/* Footer tenant */}
        <footer
          className="mt-20 border-t pt-8 text-center"
          style={{ borderColor: v.divider }}
        >
          <p className="text-xs" style={{ color: v.textFaint }}>
            {tenant.name} · {content.footer.tagline}
          </p>
          <p className="mt-1.5 text-xs" style={{ color: v.textFaint }}>
            Powered by{" "}
            <a
              href="https://bizery.it"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:underline"
              style={{ color: v.accent }}
            >
              Bizery
            </a>
          </p>
        </footer>
      </div>
    </section>
  );
}
