"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  GraduationCap,
  Loader2,
  Lock,
  MessageCircle,
  Phone,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { getAttribution, trackConversion } from "@/lib/tracking/client";

const FORM_ID = "preventivo";
const whyIcons = [Code2, Lock, Scale, GraduationCap] as const;

type Copy = ReturnType<typeof usePynkCopy>["iaAziendaPage"];

function scrollToForm() {
  const el = document.getElementById(FORM_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function trackContact(label: string) {
  trackConversion("contact", { label });
}

// ─── Header ──────────────────────────────────────────────────────────────────

function IaHeader({ c, phoneHref, phoneLabel }: { c: Copy; phoneHref: string; phoneLabel: string }) {
  return (
    <header className="pynk-lp-header">
      <div className="pynk-container pynk-lp-header-inner">
        <span className="pynk-logo">
          <Image
            src="/pynkstudio/pynk-logo-transparent.png"
            alt="Pynk Studio"
            width={48}
            height={48}
            className="pynk-logo-img"
            priority
          />
          <span className="pynk-logo-text">PYNK STUDIO</span>
        </span>
        <div className="pynk-ia-header-actions">
          <a
            href={phoneHref}
            onClick={() => trackContact("phone")}
            className="pynk-pill pynk-pill-contact pynk-lp-header-phone"
            aria-label={phoneLabel}
          >
            <Phone className="pynk-icon-xs pynk-accent" />
            <span>{phoneLabel}</span>
          </a>
          <button type="button" onClick={scrollToForm} className="pynk-btn pynk-btn-primary pynk-ia-header-cta">
            {c.headerCta}
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Form preventivo a passi ─────────────────────────────────────────────────

type FormState = {
  goals: string[];
  size: string;
  timing: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  goals: [],
  size: "",
  timing: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
};

function IaQuoteForm({ c, formRef }: { c: Copy; formRef: React.RefObject<HTMLDivElement | null> }) {
  const f = c.form;
  const href = useTenantLocalizedHref();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const totalSteps = 3;

  const toggleGoal = (goal: string) => {
    setError(null);
    setData((d) => ({
      ...d,
      goals: d.goals.includes(goal) ? d.goals.filter((g) => g !== goal) : [...d.goals, goal],
    }));
  };

  const next = () => {
    if (step === 0 && data.goals.length === 0) {
      setError(f.errorGoals);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps - 1) {
      next();
      return;
    }
    if (!data.name.trim() || !data.email.trim()) {
      setError(f.errorRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      setError(f.errorEmail);
      return;
    }

    setError(null);
    setSending(true);
    const attribution = getAttribution();
    const source = attribution
      ? [
          attribution.utm_source && `utm_source: ${attribution.utm_source}`,
          attribution.utm_medium && `utm_medium: ${attribution.utm_medium}`,
          attribution.utm_campaign && `utm_campaign: ${attribution.utm_campaign}`,
          attribution.utm_term && `utm_term: ${attribution.utm_term}`,
          attribution.utm_content && `utm_content: ${attribution.utm_content}`,
          attribution.gclid && "gclid: presente",
          attribution.fbclid && "fbclid: presente",
        ].filter(Boolean)
      : [];

    const message = [
      "Richiesta dalla landing IA in azienda",
      "",
      `Obiettivi: ${data.goals.join(" · ")}`,
      data.size ? `Dimensione: ${data.size} persone` : null,
      data.timing ? `Tempistica: ${data.timing}` : null,
      data.company.trim() ? `Azienda: ${data.company.trim()}` : null,
      data.phone.trim() ? `Telefono: ${data.phone.trim()}` : null,
      data.notes.trim() ? `\nNote:\n${data.notes.trim()}` : null,
      source.length > 0 ? `\nFonte:\n${source.join("\n")}` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");

    try {
      const res = await fetch("/api/tenant/pynkstudio/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          subject: `Preventivo IA${data.company ? ` — ${data.company.trim()}` : ""}`,
          message,
          phone: data.phone.trim(),
          company: data.company.trim(),
          source: "landing-ia",
        }),
      });
      if (!res.ok) throw new Error("send_failed");
      trackConversion("lead", { label: "ia-in-azienda" });
      setDone(true);
    } catch {
      setError(f.errorGeneric);
    } finally {
      setSending(false);
    }
  };

  return (
    <div ref={formRef} id={FORM_ID} className="pynk-ia-form-shell">
      <div className="pynk-ia-form">
        <AnimatePresence mode="wait" initial={false}>
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
              className="pynk-ia-form-done"
              role="status"
            >
              <span className="pynk-ia-done-icon">
                <Check className="pynk-icon" />
              </span>
              <h2 className="pynk-ia-form-title">{f.successTitle}</h2>
              <IaCallPicker c={c} lead={data} />
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={submit}
              noValidate
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <div className="pynk-ia-form-head">
                <div>
                  <h2 className="pynk-ia-form-title">{f.title}</h2>
                  <p className="pynk-ia-form-sub">{f.subtitle}</p>
                </div>
                <span className="pynk-ia-form-count">
                  {f.stepLabel} {step + 1} {f.of} {totalSteps}
                </span>
              </div>
              <div
                className="pynk-ia-progress"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-valuenow={step + 1}
              >
                <motion.span
                  className="pynk-ia-progress-bar"
                  animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                />
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="pynk-ia-step"
                >
                  {step === 0 && (
                    <fieldset className="pynk-ia-fieldset">
                      <legend className="pynk-ia-legend">{f.step1Title}</legend>
                      <p className="pynk-ia-hint">{f.step1Hint}</p>
                      <div className="pynk-ia-choices">
                        {f.goals.map((goal) => {
                          const selected = data.goals.includes(goal);
                          return (
                            <button
                              key={goal}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => toggleGoal(goal)}
                              className={`pynk-ia-choice${selected ? " is-selected" : ""}`}
                            >
                              <span className="pynk-ia-choice-box" aria-hidden>
                                {selected && <Check className="pynk-icon-xs" />}
                              </span>
                              {goal}
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  {step === 1 && (
                    <div className="pynk-ia-fieldset">
                      <p className="pynk-ia-legend">{f.step2Title}</p>
                      <fieldset className="pynk-ia-subfield">
                        <legend className="pynk-ia-label">{f.sizeLabel}</legend>
                        <div className="pynk-ia-chips">
                          {f.sizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              aria-pressed={data.size === size}
                              onClick={() => setData((d) => ({ ...d, size }))}
                              className={`pynk-ia-chip${data.size === size ? " is-selected" : ""}`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                      <fieldset className="pynk-ia-subfield">
                        <legend className="pynk-ia-label">{f.timingLabel}</legend>
                        <div className="pynk-ia-chips">
                          {f.timings.map((timing) => (
                            <button
                              key={timing}
                              type="button"
                              aria-pressed={data.timing === timing}
                              onClick={() => setData((d) => ({ ...d, timing }))}
                              className={`pynk-ia-chip${data.timing === timing ? " is-selected" : ""}`}
                            >
                              {timing}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="pynk-ia-fieldset">
                      <p className="pynk-ia-legend">{f.step3Title}</p>
                      <div className="pynk-ia-fields">
                        <div className="pynk-field">
                          <label htmlFor="ia-name">{f.name}</label>
                          <input
                            id="ia-name"
                            autoComplete="name"
                            value={data.name}
                            placeholder={f.namePlaceholder}
                            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                          />
                        </div>
                        <div className="pynk-field">
                          <label htmlFor="ia-email">{f.email}</label>
                          <input
                            id="ia-email"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            value={data.email}
                            placeholder={f.emailPlaceholder}
                            onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
                          />
                        </div>
                        <div className="pynk-field">
                          <label htmlFor="ia-phone">{f.phone}</label>
                          <input
                            id="ia-phone"
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            value={data.phone}
                            placeholder={f.phonePlaceholder}
                            onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                          />
                        </div>
                        <div className="pynk-field">
                          <label htmlFor="ia-company">{f.company}</label>
                          <input
                            id="ia-company"
                            autoComplete="organization"
                            value={data.company}
                            placeholder={f.companyPlaceholder}
                            onChange={(e) => setData((d) => ({ ...d, company: e.target.value }))}
                          />
                        </div>
                        <div className="pynk-field pynk-ia-field-wide">
                          <label htmlFor="ia-notes">{f.notes}</label>
                          <textarea
                            id="ia-notes"
                            rows={3}
                            value={data.notes}
                            placeholder={f.notesPlaceholder}
                            onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && (
                <p className="pynk-feedback pynk-feedback-error" role="alert">
                  {error}
                </p>
              )}

              <div className="pynk-ia-form-actions">
                {step > 0 && (
                  <button type="button" onClick={back} className="pynk-ia-back">
                    <ArrowLeft className="pynk-icon-xs" />
                    {f.back}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={sending}
                  className="pynk-btn pynk-btn-primary pynk-group pynk-ia-submit"
                >
                  {sending ? (
                    <>
                      <Loader2 className="pynk-icon-sm pynk-spin" />
                      {f.sending}
                    </>
                  ) : (
                    <>
                      {step < totalSteps - 1 ? f.next : f.submit}
                      <ArrowRight className="pynk-icon-sm pynk-arrow" />
                    </>
                  )}
                </button>
              </div>

              {step === totalSteps - 1 && (
                <p className="pynk-ia-privacy">
                  <Lock className="pynk-icon-xs" />
                  <span>
                    {f.privacyLead}{" "}
                    <Link href={href("/privacy")} target="_blank">
                      {f.privacyLink}
                    </Link>
                  </span>
                </p>
              )}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Scelta della call dopo l'invio ──────────────────────────────────────────
// Stesse API di /prenota-call: la call finisce in consultation_bookings, quindi in
// admin → Agenda e nel CRM, con conferme email/WhatsApp e promemoria.

type Slot = { time: string; startUtc: string; available: boolean };

const CALL_DAYS = 10;

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

function IaCallPicker({ c, lead }: { c: Copy; lead: FormState }) {
  const f = c.form;
  const cal = usePynkCopy().prenotaCallPage;
  const [days] = useState(() => upcomingWorkingDays(CALL_DAYS));
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [phone, setPhone] = useState(lead.phone.trim());
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [bookedLabel, setBookedLabel] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setSlots(null);
    fetch(`/api/tenant/pynkstudio/bookings/availability?date=${date}`)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setSlots(json.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [date, reloadKey]);

  const dayLabel = (d: Date) => `${cal.weekdays[d.getDay()]} ${d.getDate()} ${cal.months[d.getMonth()]}`;
  const selectedDay = days.find((d) => toISODate(d) === date);
  const slotLabel = slot && selectedDay ? `${dayLabel(selectedDay)}, ${slot.time}` : "";

  const confirm = async () => {
    if (!slot) return;
    if (!phone.trim()) {
      setError(f.errorCallPhone);
      return;
    }
    setError(null);
    setSending(true);
    try {
      const topic = [
        `${f.callTopicLead}: ${lead.goals.join(" · ")}`,
        lead.company.trim() && `Azienda: ${lead.company.trim()}`,
        lead.size && `Persone: ${lead.size}`,
      ]
        .filter(Boolean)
        .join(" — ");
      const res = await fetch("/api/tenant/pynkstudio/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name.trim(),
          email: lead.email.trim(),
          phone: phone.trim(),
          topic,
          startUtc: slot.startUtc,
        }),
      });
      if (res.status === 409) {
        setError(cal.slotTaken);
        setSlot(null);
        setReloadKey((k) => k + 1);
        return;
      }
      if (!res.ok) throw new Error("booking_failed");
      trackConversion("booking", { label: "ia-in-azienda" });
      setBookedLabel(slotLabel);
    } catch {
      setError(f.errorCall);
    } finally {
      setSending(false);
    }
  };

  if (bookedLabel) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pynk-ia-call-done">
        <p className="pynk-ia-call-done-title">
          <CalendarCheck className="pynk-icon-sm" />
          {f.callDoneTitle}
        </p>
        <p className="pynk-ia-form-sub">
          {f.callDoneLead} <strong className="pynk-strong">{bookedLabel}</strong>. {f.callDoneText}
        </p>
      </motion.div>
    );
  }

  if (skipped) return <p className="pynk-ia-form-sub">{f.skippedText}</p>;

  return (
    <div className="pynk-ia-call">
      <p className="pynk-ia-form-sub">{f.successText}</p>

      <p className="pynk-ia-call-label">
        <CalendarDays className="pynk-icon-xs" />
        {f.pickDay}
      </p>
      <div className="pynk-ia-call-days">
        {days.map((d) => {
          const iso = toISODate(d);
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={date === iso}
              onClick={() => {
                setDate(iso);
                setSlot(null);
                setError(null);
              }}
              className={`pynk-cal-day${date === iso ? " is-active" : ""}`}
            >
              <span className="pynk-cal-day-wd">{cal.weekdays[d.getDay()]}</span>
              <span className="pynk-cal-day-num">{d.getDate()}</span>
              <span className="pynk-cal-day-mo">{cal.months[d.getMonth()].slice(0, 3)}</span>
            </button>
          );
        })}
      </div>

      {date && (
        <>
          <p className="pynk-ia-call-label">
            <Clock className="pynk-icon-xs" />
            {f.pickTime}
          </p>
          {slots === null ? (
            <p className="pynk-ia-hint">{cal.loadingSlots}</p>
          ) : slots.some((s) => s.available) ? (
            <div className="pynk-ia-call-slots">
              {slots.map((s) => (
                <button
                  key={s.startUtc}
                  type="button"
                  disabled={!s.available}
                  aria-pressed={slot?.startUtc === s.startUtc}
                  onClick={() => {
                    setSlot(s);
                    setError(null);
                  }}
                  className={`pynk-cal-slot${slot?.startUtc === s.startUtc ? " is-active" : ""}`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          ) : (
            <p className="pynk-ia-hint">{cal.noSlots}</p>
          )}
        </>
      )}

      {slot && (
        <div className="pynk-ia-call-confirm">
          {!lead.phone.trim() && (
            <div className="pynk-field">
              <label htmlFor="ia-call-phone">{f.callPhone}</label>
              <input
                id="ia-call-phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={phone}
                placeholder={f.callPhonePlaceholder}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}
          <button type="button" onClick={confirm} disabled={sending} className="pynk-btn pynk-btn-primary pynk-group pynk-ia-call-submit">
            {sending ? (
              <>
                <Loader2 className="pynk-icon-sm pynk-spin" />
                {f.confirmingCall}
              </>
            ) : (
              <>
                {f.confirmCall} · {slotLabel}
                <ArrowRight className="pynk-icon-sm pynk-arrow" />
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="pynk-feedback pynk-feedback-error" role="alert">
          {error}
        </p>
      )}

      <button type="button" onClick={() => setSkipped(true)} className="pynk-ia-back pynk-ia-call-skip">
        {f.skipCall}
      </button>
    </div>
  );
}

// ─── Console agente animata ──────────────────────────────────────────────────

function AgentConsole({ c }: { c: Copy }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const total = c.demoSteps.length;
  const [active, setActive] = useState(0);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    if (reduceMotion || !inView) return;
    // Ultimo passo: pausa lunga con "approvato", poi il ciclo riparte.
    const atEnd = active >= total - 1;
    const timer = window.setTimeout(
      () => {
        if (!atEnd) {
          setActive((a) => a + 1);
          return;
        }
        if (!approved) {
          setApproved(true);
          return;
        }
        setApproved(false);
        setActive(0);
      },
      atEnd ? (approved ? 2600 : 1500) : 1500,
    );
    return () => window.clearTimeout(timer);
  }, [active, approved, inView, reduceMotion, total]);

  const shown = reduceMotion ? total - 1 : active;

  return (
    <div ref={ref} className="pynk-ia-console" aria-hidden>
      <div className="pynk-ia-console-bar">
        <span className="pynk-ia-dot" />
        <span className="pynk-ia-dot" />
        <span className="pynk-ia-dot" />
        <span className="pynk-ia-console-title">
          <Bot className="pynk-icon-xs" />
          {c.demoConsoleTitle}
        </span>
      </div>
      <ol className="pynk-ia-console-steps">
        {c.demoSteps.map((s, i) => {
          const state = i < shown || (i === shown && (approved || reduceMotion)) ? "done" : i === shown ? "run" : "wait";
          return (
            <li key={s.label} className={`pynk-ia-console-step is-${state}`}>
              <span className="pynk-ia-console-icon">
                {state === "done" ? (
                  <Check className="pynk-icon-xs" />
                ) : state === "run" ? (
                  <Loader2 className="pynk-icon-xs pynk-spin" />
                ) : (
                  <span className="pynk-ia-console-pip" />
                )}
              </span>
              <div className="pynk-ia-console-text">
                <strong>{s.label}</strong>
                <AnimatePresence initial={false}>
                  {state !== "wait" && (
                    <motion.span
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35 }}
                      className="pynk-ia-console-detail"
                    >
                      {s.detail}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {i === total - 1 && state !== "wait" && (
                <span className={`pynk-ia-approve${approved || reduceMotion ? " is-approved" : ""}`}>
                  {approved || reduceMotion ? <Check className="pynk-icon-xs" /> : null}
                  {c.demoApprove}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Casi d'uso per reparto ──────────────────────────────────────────────────

function UseCaseTabs({ c }: { c: Copy }) {
  const [activeId, setActiveId] = useState<string>(c.useCases[0]?.id ?? "");
  const current = c.useCases.find((u) => u.id === activeId) ?? c.useCases[0];

  return (
    <div className="pynk-ia-usecases">
      <div className="pynk-ia-tabs" role="tablist">
        {c.useCases.map((u) => (
          <button
            key={u.id}
            type="button"
            role="tab"
            id={`ia-tab-${u.id}`}
            aria-selected={u.id === activeId}
            aria-controls="ia-usecase-panel"
            onClick={() => setActiveId(u.id)}
            className={`pynk-ia-tab${u.id === activeId ? " is-active" : ""}`}
          >
            {u.id === activeId && (
              <motion.span layoutId="pynk-ia-tab-pill" className="pynk-ia-tab-pill" transition={{ type: "spring", bounce: 0.18, duration: 0.5 }} />
            )}
            <span className="pynk-ia-tab-label">{u.tab}</span>
          </button>
        ))}
      </div>

      <div id="ia-usecase-panel" role="tabpanel" aria-labelledby={`ia-tab-${current.id}`} className="pynk-ia-usecase-panel">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="pynk-ia-compare"
          >
            <div className="pynk-ia-compare-card is-before">
              <span className="pynk-ia-compare-label">{c.useCaseBefore}</span>
              <p>{current.before}</p>
            </div>
            <div className="pynk-ia-compare-arrow" aria-hidden>
              <ArrowRight className="pynk-icon" />
            </div>
            <div className="pynk-ia-compare-card is-after">
              <span className="pynk-ia-compare-label">
                <Sparkles className="pynk-icon-xs" />
                {c.useCaseAfter}
              </span>
              <p>{current.after}</p>
              <ul className="pynk-ia-tasks">
                {current.tasks.map((t) => (
                  <li key={t}>
                    <Check className="pynk-icon-xs" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] as const },
};

function IaInAziendaInner() {
  const copy = usePynkCopy();
  const c = copy.iaAziendaPage;
  const { phoneHref, phoneLabel } = copy.contattiPage;
  const href = useTenantLocalizedHref();
  const formRef = useRef<HTMLDivElement>(null);
  const formInView = useInView(formRef, { amount: 0.2 });
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const marquee = [...c.marquee, ...c.marquee];

  return (
    <div className="pynk-page pynk-ia">
      <IaHeader c={c} phoneHref={phoneHref} phoneLabel={phoneLabel} />

      {/* ── Hero + form ─────────────────────────────────────── */}
      <section className="pynk-ia-hero">
        <div className="pynk-ia-hero-bg" aria-hidden>
          <span className="pynk-blob pynk-blob-a" />
          <span className="pynk-blob pynk-blob-b" />
          <span className="pynk-blob pynk-blob-c" />
          <span className="pynk-ia-grid" />
        </div>
        <div className="pynk-container pynk-ia-hero-inner">
          <div className="pynk-ia-hero-copy">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="pynk-pill pynk-lp-badge pynk-ia-badge"
            >
              <span className="pynk-ia-live" aria-hidden />
              {c.badge}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="pynk-ia-title"
            >
              {c.heroTitleLead} <span className="pynk-ia-gradient-text">{c.heroTitleAccent}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="pynk-ia-lead"
            >
              {c.heroSubtitle}
            </motion.p>
            <ul className="pynk-ia-points">
              {c.heroPoints.map((point, i) => (
                <motion.li
                  key={point}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.08 }}
                >
                  <CheckCircle2 className="pynk-icon-sm pynk-accent" />
                  <span>{point}</span>
                </motion.li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="pynk-ia-hero-mobile-cta"
            >
              <button type="button" onClick={scrollToForm} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
                {c.heroCtaMobile}
                <ArrowRight className="pynk-icon-sm pynk-arrow" />
              </button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.75 }}
              className="pynk-ia-reassurance"
            >
              <ShieldCheck className="pynk-icon-xs pynk-accent" />
              {c.reassurance}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="pynk-ia-hero-form"
          >
            <IaQuoteForm c={c} formRef={formRef} />
          </motion.div>
        </div>
      </section>

      {/* ── Marquee capacità ───────────────────────────────── */}
      <div className="pynk-ia-marquee" aria-label={c.marquee.join(", ")}>
        <div className="pynk-ia-marquee-track" aria-hidden>
          {marquee.map((item, i) => (
            <span key={`${item}-${i}`} className="pynk-ia-marquee-item">
              <Sparkles className="pynk-icon-xs" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Demo agente ────────────────────────────────────── */}
      <section className="pynk-section">
        <div className="pynk-container pynk-ia-demo">
          <motion.div {...reveal} className="pynk-ia-demo-copy">
            <span className="pynk-eyebrow-chip">{c.demoEyebrow}</span>
            <h2 className="pynk-ia-h2">
              {c.demoTitleLead} <span className="pynk-accent">{c.demoTitleAccent}</span>
            </h2>
            <p className="pynk-ia-body">{c.demoText}</p>
            <ul className="pynk-ia-points pynk-ia-points-tight">
              {c.demoPoints.map((point) => (
                <li key={point}>
                  <CheckCircle2 className="pynk-icon-sm pynk-accent" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }}>
            <AgentConsole c={c} />
          </motion.div>
        </div>
      </section>

      {/* ── Casi d'uso ─────────────────────────────────────── */}
      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container">
          <motion.div {...reveal} className="pynk-ia-section-head">
            <span className="pynk-eyebrow-chip">{c.useCasesEyebrow}</span>
            <h2 className="pynk-ia-h2 pynk-center">
              {c.useCasesTitleLead} <span className="pynk-accent">{c.useCasesTitleAccent}</span>
            </h2>
          </motion.div>
          <motion.div {...reveal}>
            <UseCaseTabs c={c} />
          </motion.div>
        </div>
      </section>

      {/* ── Percorso ───────────────────────────────────────── */}
      <section className="pynk-section">
        <div className="pynk-container">
          <motion.div {...reveal} className="pynk-ia-section-head">
            <span className="pynk-eyebrow-chip">{c.processEyebrow}</span>
            <h2 className="pynk-ia-h2 pynk-center">
              {c.processTitleLead} <span className="pynk-accent">{c.processTitleAccent}</span>
            </h2>
          </motion.div>
          <ol className="pynk-ia-process">
            {c.process.map((step, i) => (
              <motion.li
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
                className="pynk-ia-process-step"
              >
                <span className="pynk-ia-process-num">{step.number}</span>
                <h3 className="pynk-ia-h3">{step.title}</h3>
                <p className="pynk-ia-body-sm">{step.desc}</p>
              </motion.li>
            ))}
          </ol>
          <motion.div {...reveal} className="pynk-center pynk-ia-inline-cta">
            <button type="button" onClick={scrollToForm} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
              {c.finalCta}
              <ArrowRight className="pynk-icon-sm pynk-arrow" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Perché noi ─────────────────────────────────────── */}
      <section className="pynk-section pynk-section-alt">
        <div className="pynk-container">
          <motion.div {...reveal} className="pynk-ia-section-head">
            <span className="pynk-eyebrow-chip">{c.whyEyebrow}</span>
            <h2 className="pynk-ia-h2 pynk-center">
              {c.whyTitleLead} <span className="pynk-accent">{c.whyTitleAccent}</span>
            </h2>
          </motion.div>
          <div className="pynk-ia-why">
            {c.why.map((item, i) => {
              const Icon = whyIcons[i] ?? Code2;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
                  className="pynk-panel pynk-ia-why-card"
                >
                  <span className="pynk-panel-icon">
                    <Icon className="pynk-icon" />
                  </span>
                  <h3 className="pynk-ia-h3">{item.title}</h3>
                  <p className="pynk-ia-body-sm">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>

          <motion.div {...reveal} className="pynk-ia-strip">
            <p className="pynk-ia-strip-label">{c.modelsLabel}</p>
            <div className="pynk-ia-strip-items">
              {c.models.map((m) => (
                <span key={m} className="pynk-ia-strip-item">
                  {m}
                </span>
              ))}
            </div>
          </motion.div>
          <motion.div {...reveal} className="pynk-ia-strip">
            <p className="pynk-ia-strip-label">{c.proofLabel}</p>
            <div className="pynk-ia-strip-items">
              {c.proof.map((p) => (
                <span key={p} className="pynk-ia-strip-item pynk-ia-strip-item-strong">
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="pynk-section">
        <div className="pynk-container pynk-narrow">
          <motion.h2 {...reveal} className="pynk-ia-h2 pynk-center">
            {c.faqTitleLead} <span className="pynk-accent">{c.faqTitleAccent}</span>
          </motion.h2>
          <div className="pynk-lp-faq pynk-mt-24">
            {c.faq.map((item, i) => (
              <motion.details
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="pynk-panel pynk-lp-faq-item"
              >
                <summary className="pynk-lp-faq-q">{item.q}</summary>
                <p className="pynk-lp-faq-a">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA finale ─────────────────────────────────────── */}
      <section className="pynk-section pynk-ia-final-wrap">
        <div className="pynk-container">
          <motion.div {...reveal} className="pynk-ia-final">
            <span className="pynk-ia-final-glow" aria-hidden />
            <h2 className="pynk-ia-h2 pynk-center">
              {c.finalTitleLead} <span className="pynk-ia-gradient-text">{c.finalTitleAccent}</span>
            </h2>
            <p className="pynk-ia-body pynk-center pynk-ia-final-sub">{c.finalSubtitle}</p>
            <div className="pynk-ia-final-ctas">
              <button type="button" onClick={scrollToForm} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
                {c.finalCta}
                <ArrowRight className="pynk-icon-sm pynk-arrow" />
              </button>
              <a href={phoneHref} onClick={() => trackContact("phone")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
                <Phone className="pynk-icon-sm" />
                {c.finalCall}
              </a>
              <a
                href={c.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackContact("whatsapp")}
                className="pynk-btn pynk-btn-outline pynk-btn-lg"
              >
                <MessageCircle className="pynk-icon-sm" />
                {c.finalWhatsapp}
              </a>
            </div>
            <p className="pynk-ia-reassurance pynk-ia-reassurance-center">
              <ShieldCheck className="pynk-icon-xs pynk-accent" />
              {c.reassurance}
            </p>
          </motion.div>
        </div>
      </section>

      <footer className="pynk-ia-footer">
        <div className="pynk-container pynk-ia-footer-inner">
          <span>© {new Date().getFullYear()} PYNK STUDIO · {copy.footer.address} · {copy.footer.piva}</span>
          <Link href={href("/privacy")}>{c.form.privacyLink}</Link>
        </div>
      </footer>

      {/* Barra CTA mobile: sticky e non fixed, perché la shell di pagina ha un transform. */}
      <div className="pynk-ia-sticky-anchor">
        <div className={`pynk-ia-sticky${pastHero && !formInView ? " is-visible" : ""}`}>
          <a
            href={phoneHref}
            onClick={() => trackContact("phone")}
            className="pynk-ia-sticky-call"
            aria-label={phoneLabel}
          >
            <Phone className="pynk-icon-sm" />
          </a>
          <button type="button" onClick={scrollToForm} className="pynk-btn pynk-btn-primary pynk-ia-sticky-cta">
            {c.stickyCta}
            <ArrowRight className="pynk-icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PynkStudioIaInAziendaPage() {
  return (
    <PynkShell chromeless>
      <IaInAziendaInner />
    </PynkShell>
  );
}
