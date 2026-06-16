"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Send } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";

type Slot = { time: string; startUtc: string; available: boolean };
type Feedback = { kind: "error"; text: string } | null;

const WORKING_DAYS_AHEAD = 14;

// Prossimi giorni lavorativi (lun-ven) calcolati lato client in orario locale.
function upcomingWorkingDays(count: number): Date[] {
  const out: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; out.length < count && i < count * 3; i++) {
    const wd = cursor.getDay();
    if (wd >= 1 && wd <= 5) out.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function PrenotaCallInner() {
  const copy = usePynkCopy();
  const c = copy.prenotaCallPage;

  const [days] = useState<Date[]>(() => upcomingWorkingDays(WORKING_DAYS_AHEAD));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "" });
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlots(null);
    fetch(`/api/tenant/pynkstudio/bookings/availability?date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const dayLabel = (d: Date) => `${c.weekdays[d.getDay()]} ${d.getDate()} ${c.months[d.getMonth()]}`;

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
    setSending(true);
    try {
      const res = await fetch("/api/tenant/pynkstudio/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, startUtc: selectedSlot.startUtc }),
      });
      if (res.status === 409) {
        setFeedback({ kind: "error", text: c.slotTaken });
        setSelectedSlot(null);
        // Ricarica gli slot del giorno per riflettere l'occupazione.
        if (selectedDate) {
          const d = selectedDate;
          setSelectedDate(null);
          setTimeout(() => setSelectedDate(d), 0);
        }
        return;
      }
      if (!res.ok) throw new Error("failed");
      setDone(true);
    } catch {
      setFeedback({ kind: "error", text: c.form.errorGeneric });
    } finally {
      setSending(false);
    }
  };

  const resetAll = () => {
    setDone(false);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSlots(null);
    setForm({ name: "", email: "", phone: "", topic: "" });
    setFeedback(null);
  };

  const selectedSlotLabel = (() => {
    if (!selectedSlot || !selectedDate) return "";
    const d = days.find((x) => toISODate(x) === selectedDate);
    return d ? `${dayLabel(d)}, ${selectedSlot.time}` : selectedSlot.time;
  })();

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
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pynk-cal-success"
              >
                <CheckCircle2 className="pynk-icon-lg pynk-check" />
                <h2 className="pynk-section-title">{c.successTitle}</h2>
                <p className="pynk-note pynk-center">{selectedSlotLabel}</p>
                <p className="pynk-hero-subtitle">{c.successBody}</p>
                <button type="button" onClick={resetAll} className="pynk-btn pynk-btn-outline pynk-mt-24">
                  {c.successAgain}
                </button>
              </motion.div>
            ) : (
              <motion.div key="flow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Step 1 — giorno */}
                <h2 className="pynk-cal-step-title">
                  <CalendarDays className="pynk-icon-sm pynk-accent" /> {c.stepDate}
                </h2>
                <div className="pynk-cal-days">
                  {days.map((d) => {
                    const iso = toISODate(d);
                    const active = selectedDate === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => {
                          setSelectedDate(iso);
                          setSelectedSlot(null);
                        }}
                        className={`pynk-cal-day${active ? " is-active" : ""}`}
                      >
                        <span className="pynk-cal-day-wd">{c.weekdays[d.getDay()]}</span>
                        <span className="pynk-cal-day-num">{d.getDate()}</span>
                        <span className="pynk-cal-day-mo">{c.months[d.getMonth()].slice(0, 3)}</span>
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
                    ) : slots && slots.length > 0 ? (
                      <div className="pynk-cal-slots">
                        {slots.map((s) => (
                          <button
                            key={s.startUtc}
                            type="button"
                            disabled={!s.available}
                            onClick={() => setSelectedSlot(s)}
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
            )}
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
