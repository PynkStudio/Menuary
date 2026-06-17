"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarCheck, ArrowRight, Phone } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

export function PynkStudioGraziePage({ slot }: { slot?: string }) {
  const copy = usePynkCopy();
  const href = useTenantLocalizedHref();
  const phoneHref = copy.contattiPage.phoneHref;
  const phoneLabel = copy.contattiPage.phoneLabel;

  return (
    <PynkShell>
      <div className="pynk-page">
        <section className="pynk-hero pynk-hero-sub">
          <div className="pynk-glow pynk-glow-tl" aria-hidden />
          <div className="pynk-container pynk-hero-content">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="pynk-cal-success-icon"
            >
              <CalendarCheck className="pynk-icon-xl pynk-check" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="pynk-hero-title"
            >
              Call <span className="pynk-accent">confermata!</span>
            </motion.h1>

            {slot && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="pynk-cal-grazie-slot"
              >
                {slot}
              </motion.p>
            )}

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pynk-hero-subtitle"
            >
              Abbiamo registrato la tua prenotazione e ti abbiamo inviato una conferma via email.
              Ti chiameremo noi all&apos;orario indicato.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="pynk-hero-ctas"
            >
              <a href={phoneHref} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
                <Phone className="pynk-icon-sm" />
                {phoneLabel}
              </a>
              <Link href={href("/")} className="pynk-btn pynk-btn-outline pynk-btn-lg pynk-group">
                Torna alla home
                <ArrowRight className="pynk-icon-sm pynk-arrow" />
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </PynkShell>
  );
}
