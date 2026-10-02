"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { dateParts } from "@pynkstudio/agendaapp/core";
import { useAgendaBooking } from "@pynkstudio/agendaapp/react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Cog,
  FileText,
  GraduationCap,
  Handshake,
  Lightbulb,
  Loader2,
  Lock,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { getAttribution, trackConversion } from "@/lib/tracking/client";
import { CRM_SIZE_OPTIONS, CRM_TIMING_OPTIONS } from "@/lib/pynkstudio/crm-shared";
import { PynkJsonLd } from "../pynk-json-ld";
import { PYNK_ORIGIN } from "../ai-governance-data";
import { breadcrumbSchema, faqSchema, organizationSchema } from "../pynk-seo";

const FORM_ID = "preventivo";
const whyIcons = [Code2, Terminal, Lightbulb, GraduationCap] as const;
const gainIcons = [BookOpen, ShieldCheck, FileText, Award, Cog, Handshake] as const;

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

// Il CRM riceve l'etichetta italiana canonica (per posizione), non il testo tradotto nella lingua del visitatore.
function crmOption(canonical: readonly string[], localized: readonly string[], value: string): string {
  const i = localized.indexOf(value);
  return i >= 0 ? (canonical[i] ?? value) : value;
}

function IaQuoteForm({
  c,
  formRef,
  plan,
  onClearPlan,
}: {
  c: Copy;
  formRef: React.RefObject<HTMLDivElement | null>;
  plan: string | null;
  onClearPlan: () => void;
}) {
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
      plan ? `Percorso di interesse: ${plan}` : null,
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
          employees: crmOption(CRM_SIZE_OPTIONS, f.sizes, data.size),
          timing: crmOption(CRM_TIMING_OPTIONS, f.timings, data.timing),
          interests: data.goals,
          plan: plan ?? "",
          attribution,
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
              {plan && (
                <p className="pynk-ia-plan-chip">
                  <span>
                    {f.planLabel}: <strong>{plan}</strong>
                  </span>
                  <button type="button" onClick={onClearPlan} aria-label={f.planRemove}>
                    ×
                  </button>
                </p>
              )}
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
// Stesso flusso di /prenota-call via @pynkstudio/agendaapp: la call finisce in
// admin → Agenda e nel CRM, con conferme email/WhatsApp e promemoria.

const CALL_DAYS = 10;

function IaCallPicker({ c, lead }: { c: Copy; lead: FormState }) {
  const f = c.form;
  const cal = usePynkCopy().prenotaCallPage;
  const booking = useAgendaBooking({
    availabilityUrl: "/api/tenant/pynkstudio/bookings/availability",
    bookingUrl: "/api/tenant/pynkstudio/bookings",
  });
  const days = booking.days.slice(0, CALL_DAYS);
  const date = booking.selectedDate;
  const slots = booking.loadingSlots ? null : booking.slots;
  const slot = booking.selectedSlot;
  const sending = booking.submitting;
  const [phone, setPhone] = useState(lead.phone.trim());
  const [error, setError] = useState<string | null>(null);
  const [bookedLabel, setBookedLabel] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);

  const dayLabel = (iso: string) => {
    const d = dateParts(iso);
    return `${cal.weekdays[d.weekday]} ${d.day} ${cal.months[d.month]}`;
  };
  const slotLabel = slot && date ? `${dayLabel(date)}, ${slot.time}` : "";

  const confirm = async () => {
    if (!slot) return;
    if (!phone.trim()) {
      setError(f.errorCallPhone);
      return;
    }
    setError(null);
    const topic = [
      `${f.callTopicLead}: ${lead.goals.join(" · ")}`,
      lead.company.trim() && `Azienda: ${lead.company.trim()}`,
      lead.size && `Persone: ${lead.size}`,
    ]
      .filter(Boolean)
      .join(" — ");
    const result = await booking.submit({
      name: lead.name.trim(),
      email: lead.email.trim(),
      phone: phone.trim(),
      topic,
      source: "landing-ia",
      company: lead.company.trim(),
      // Salvata sulla prenotazione: in videocall il cliente compare come "Nome · Azienda".
      answers: lead.company.trim() ? { company: lead.company.trim() } : undefined,
      employees: crmOption(CRM_SIZE_OPTIONS, f.sizes, lead.size),
      timing: crmOption(CRM_TIMING_OPTIONS, f.timings, lead.timing),
      interests: lead.goals,
      attribution: getAttribution(),
    });
    if (!result.ok) {
      setError(result.error === "slot_taken" ? cal.slotTaken : f.errorCall);
      return;
    }
    trackConversion("booking", { label: "ia-in-azienda" });
    setBookedLabel(slotLabel);
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
        {days.map((iso) => {
          const d = dateParts(iso);
          return (
            <button
              key={iso}
              type="button"
              aria-pressed={date === iso}
              onClick={() => {
                booking.selectDate(iso);
                setError(null);
              }}
              className={`pynk-cal-day${date === iso ? " is-active" : ""}`}
            >
              <span className="pynk-cal-day-wd">{cal.weekdays[d.weekday]}</span>
              <span className="pynk-cal-day-num">{d.day}</span>
              <span className="pynk-cal-day-mo">{cal.months[d.month].slice(0, 3)}</span>
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
                    booking.selectSlot(s);
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
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const choosePlan = (name: string) => {
    setPlan(name);
    scrollToForm();
  };

  const marquee = [...c.marquee, ...c.marquee];

  const jsonLd = [
    organizationSchema(),
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Formazione sull'Intelligenza Artificiale per aziende",
      description:
        "Percorso di adozione dell'IA in azienda: analisi dell'utilizzo attuale, linee guida interne, formazione del personale, documentazione, attestati e supporto successivo.",
      url: `${PYNK_ORIGIN}/it/ia-in-azienda`,
      provider: { "@type": "Organization", name: "PYNK STUDIO", url: PYNK_ORIGIN },
      areaServed: "Italia",
      serviceType: ["Formazione AI Literacy", "Consulenza adozione IA", "AI governance"],
      audience: { "@type": "BusinessAudience", audienceType: "Aziende e team che usano strumenti di IA generativa" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Percorsi di formazione IA in azienda",
        itemListElement: c.plans.map((p) => ({
          "@type": "Offer",
          name: `Percorso ${p.name}`,
          description: p.features.join(", "),
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "PriceSpecification",
            price: p.price.replace(/[^\d]/g, ""),
            priceCurrency: "EUR",
            valueAddedTaxIncluded: false,
          },
        })),
      },
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "IA in azienda", path: "/ia-in-azienda" },
    ]),
    faqSchema([...c.faq]),
  ];

  return (
    <div className="pynk-page pynk-ia">
      <PynkJsonLd data={jsonLd} />
      <IaHeader c={c} phoneHref={phoneHref} phoneLabel={phoneLabel} />

      <main>
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
                className="pynk-ia-hero-ctas"
              >
                <button type="button" onClick={scrollToForm} className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-group">
                  {c.heroCtaPrimary}
                  <ArrowRight className="pynk-icon-sm pynk-arrow" />
                </button>
                <Link
                  href={href("/prenota-call")}
                  onClick={() => trackContact("call")}
                  className="pynk-btn pynk-btn-outline pynk-btn-lg"
                >
                  <CalendarDays className="pynk-icon-sm" />
                  {c.heroCtaSecondary}
                </Link>
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
              <IaQuoteForm c={c} formRef={formRef} plan={plan} onClearPlan={() => setPlan(null)} />
            </motion.div>
          </div>
        </section>

        {/* ── Marquee strumenti ──────────────────────────────── */}
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

        {/* ── Non vendiamo un corso ──────────────────────────── */}
        <section className="pynk-section" aria-labelledby="ia-path-title">
          <div className="pynk-container pynk-ia-demo">
            <motion.div {...reveal} className="pynk-ia-demo-copy">
              <span className="pynk-eyebrow-chip">{c.pathEyebrow}</span>
              <h2 id="ia-path-title" className="pynk-ia-h2">
                {c.pathTitleLead} <span className="pynk-accent">{c.pathTitleAccent}</span>
              </h2>
              <p className="pynk-ia-body">{c.pathText}</p>
            </motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.1 }} className="pynk-panel pynk-ia-path">
              <h3 className="pynk-ia-path-title">{c.pathListTitle}</h3>
              <ul className="pynk-ia-path-list">
                {c.pathItems.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: 14 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: 0.15 + i * 0.07, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <span className="pynk-ia-path-check">
                      <Check className="pynk-icon-xs" />
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* ── Cosa ottieni ───────────────────────────────────── */}
        <section className="pynk-section pynk-section-alt" aria-labelledby="ia-gain-title">
          <div className="pynk-container">
            <motion.div {...reveal} className="pynk-ia-section-head">
              <span className="pynk-eyebrow-chip">{c.gainEyebrow}</span>
              <h2 id="ia-gain-title" className="pynk-ia-h2 pynk-center">
                {c.gainTitleLead} <span className="pynk-accent">{c.gainTitleAccent}</span>
              </h2>
            </motion.div>
            <div className="pynk-ia-gain">
              {c.gain.map((item, i) => {
                const Icon = gainIcons[i] ?? BookOpen;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.55, delay: (i % 3) * 0.08, ease: [0.32, 0.72, 0, 1] }}
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
          </div>
        </section>

        {/* ── Percorsi e prezzi ──────────────────────────────── */}
        <section className="pynk-section" aria-labelledby="ia-plans-title">
          <div className="pynk-container">
            <motion.div {...reveal} className="pynk-ia-section-head">
              <span className="pynk-eyebrow-chip">{c.plansEyebrow}</span>
              <h2 id="ia-plans-title" className="pynk-ia-h2 pynk-center">
                {c.plansTitleLead} <span className="pynk-accent">{c.plansTitleAccent}</span>
              </h2>
            </motion.div>
            <div className="pynk-ia-plans">
              {c.plans.map((p, i) => (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
                  className={`pynk-ia-plan${p.badge ? " is-featured" : ""}`}
                >
                  {p.badge && <span className="pynk-ia-plan-badge">{p.badge}</span>}
                  <h3 className="pynk-ia-plan-name">{p.name}</h3>
                  <p className="pynk-ia-plan-price">
                    <span>{p.price}</span>
                    <small>{p.vat}</small>
                  </p>
                  <ul className="pynk-ia-plan-features">
                    {p.features.map((feature) => (
                      <li key={feature}>
                        <Check className="pynk-icon-xs" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => choosePlan(p.name)}
                    className={`pynk-btn pynk-group pynk-ia-plan-cta ${p.badge ? "pynk-btn-primary" : "pynk-btn-outline"}`}
                  >
                    {c.plansCta}
                    <ArrowRight className="pynk-icon-sm pynk-arrow" />
                  </button>
                </motion.article>
              ))}
            </div>
            <motion.p {...reveal} className="pynk-ia-plans-note">
              {c.plansNote}
            </motion.p>
          </div>
        </section>

        {/* ── Perché noi ─────────────────────────────────────── */}
        <section className="pynk-section pynk-section-alt" aria-labelledby="ia-why-title">
          <div className="pynk-container">
            <motion.div {...reveal} className="pynk-ia-section-head">
              <span className="pynk-eyebrow-chip">{c.whyEyebrow}</span>
              <h2 id="ia-why-title" className="pynk-ia-h2 pynk-center">
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
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────── */}
        <section className="pynk-section" aria-labelledby="ia-faq-title">
          <div className="pynk-container pynk-narrow">
            <motion.h2 {...reveal} id="ia-faq-title" className="pynk-ia-h2 pynk-center">
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
      </main>

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
