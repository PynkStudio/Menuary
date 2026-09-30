"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CalendarDays, Clock, Send } from "lucide-react";
import { dateParts } from "@pynkstudio/agendaapp/core";
import { useAgendaBooking } from "@pynkstudio/agendaapp/react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { getAttribution, trackConversion } from "@/lib/tracking/client";

type Feedback = { kind: "error"; text: string } | null;

// Giorni e orari vengono dal server (fuso Europe/Rome dell'agenda), non dall'orologio del visitatore.
function PrenotaCallInner() {
  const copy = usePynkCopy();
  const c = copy.prenotaCallPage;
  const router = useRouter();

  const booking = useAgendaBooking({
    availabilityUrl: "/api/tenant/pynkstudio/bookings/availability",
    bookingUrl: "/api/tenant/pynkstudio/bookings",
  });
  const { days, selectedDate, slots, loadingSlots, selectedSlot } = booking;
  const sending = booking.submitting;

  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "" });
  const [feedback, setFeedback] = useState<Feedback>(null);

  const dayLabel = (iso: string) => {
    const p = dateParts(iso);
    return `${c.weekdays[p.weekday]} ${p.day} ${c.months[p.month]}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!selectedSlot) return;
    if (!form.name || !form.email || !form.phone || !form.topic) {
      setFeedback({ kind: "error", text: c.form.errorRequired });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFeedback({ kind: "error", text: c.form.errorEmail });
      return;
    }
    const result = await booking.submit({ ...form, attribution: getAttribution() });
    if (!result.ok) {
      setFeedback({ kind: "error", text: result.error === "slot_taken" ? c.slotTaken : c.form.errorGeneric });
      return;
    }
    trackConversion("booking", { label: "call-20min" });
    router.push(`/prenota-call/grazie?slot=${encodeURIComponent(selectedSlotLabel)}&mode=${result.location}`);
  };

  const selectedSlotLabel = selectedSlot && selectedDate ? `${dayLabel(selectedDate)}, ${selectedSlot.time}` : "";

  return (
    <div className="pynk-page">
      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-tl" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pynk-eyebrow">
            {c.eyebrow}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} className="pynk-hero-title">
            {c.titleLead} <span className="pynk-accent">{c.titleAccent}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }} className="pynk-hero-subtitle">
            {c.subtitle}
          </motion.p>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container pynk-narrow">
          <AnimatePresence mode="wait">
            <motion.div key="flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Step 1 — giorno */}
                <h2 className="pynk-cal-step-title">
                  <CalendarDays className="pynk-icon-sm pynk-accent" /> {c.stepDate}
                </h2>
                <div className="pynk-cal-days">
                  {booking.status === "loading" && <p className="pynk-note">{c.loadingSlots}</p>}
                  {days.map((iso) => {
                    const d = dateParts(iso);
                    const active = selectedDate === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => booking.selectDate(iso)}
                        className={`pynk-cal-day${active ? " is-active" : ""}`}
                      >
                        <span className="pynk-cal-day-wd">{c.weekdays[d.weekday]}</span>
                        <span className="pynk-cal-day-num">{d.day}</span>
                        <span className="pynk-cal-day-mo">{c.months[d.month].slice(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Step 2 — orario */}
                {selectedDate && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pynk-mt-24">
                    <h2 className="pynk-cal-step-title">
                      <Clock className="pynk-icon-sm pynk-accent" /> {c.stepTime}
                    </h2>
                    {loadingSlots ? (
                      <p className="pynk-note">{c.loadingSlots}</p>
                    ) : slots && slots.some((s) => s.available) ? (
                      <div className="pynk-cal-slots">
                        {slots.map((s) => (
                          <button
                            key={s.startUtc}
                            type="button"
                            disabled={!s.available}
                            onClick={() => booking.selectSlot(s)}
                            className={`pynk-cal-slot${selectedSlot?.startUtc === s.startUtc ? " is-active" : ""}`}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="pynk-note">{c.noSlots}</p>
                    )}
                  </motion.div>
                )}

                {/* Step 3 — dati */}
                {selectedSlot && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pynk-mt-24">
                    <h2 className="pynk-cal-step-title">
                      <Send className="pynk-icon-sm pynk-accent" /> {c.stepDetails}
                    </h2>
                    <p className="pynk-note pynk-cal-selected">
                      {c.selectedLabel} <strong className="pynk-strong">{selectedSlotLabel}</strong>
                    </p>
                    <form onSubmit={handleSubmit} autoComplete="on" className="pynk-form pynk-mt-12">
                      <div className="pynk-form-row">
                        <div className="pynk-field">
                          <label htmlFor="bk-name">{c.form.name}</label>
                          <input id="bk-name" name="name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={c.form.namePlaceholder} />
                        </div>
                        <div className="pynk-field">
                          <label htmlFor="bk-phone">{c.form.phone}</label>
                          <input id="bk-phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={c.form.phonePlaceholder} />
                        </div>
                      </div>
                      <div className="pynk-field">
                        <label htmlFor="bk-email">{c.form.email}</label>
                        <input id="bk-email" name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={c.form.emailPlaceholder} />
                      </div>
                      <div className="pynk-field">
                        <label htmlFor="bk-topic">{c.form.topic}</label>
                        <textarea id="bk-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder={c.form.topicPlaceholder} />
                      </div>
                      {feedback && <p className={`pynk-feedback pynk-feedback-${feedback.kind}`}>{feedback.text}</p>}
                      <button type="submit" disabled={sending} className="pynk-btn pynk-btn-primary pynk-btn-block pynk-group">
                        {sending ? c.form.sending : c.form.submit}
                        <ArrowRight className="pynk-icon-sm pynk-arrow" />
                      </button>
                    </form>
                  </motion.div>
                )}
              </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

export function PynkStudioPrenotaCallPage() {
  return (
    <PynkShell>
      <PrenotaCallInner />
    </PynkShell>
  );
}
