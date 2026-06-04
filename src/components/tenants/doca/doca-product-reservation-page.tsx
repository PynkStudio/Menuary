"use client";

import Link from "next/link";
import { CalendarDays, Check, ChevronLeft, ChevronRight, CreditCard, Minus, Plus, Store } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTenant } from "@/components/core/tenant-provider";
import { useDocaLanguage } from "@/lib/doca-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { useRestaurantServicesStore } from "@/store/restaurant-services-store";
import {
  defaultHoursWeekForTenant,
  openPickupDates,
  scheduleDayForDate,
  generateTimeSlots,
} from "@/lib/venue-hours";

type ProductCode = "bread" | "brigadeiro" | "carrot_cake" | "other";
type PaymentMethod = "on_site" | "stripe";

const products: Array<{
  code: ProductCode;
  amountCents: number | null;
  labels: Record<"it" | "pt" | "en", string>;
}> = [
  { code: "bread", amountCents: 650, labels: { it: "Pane del giorno", pt: "Pão do dia", en: "Bread of the day" } },
  { code: "brigadeiro", amountCents: 250, labels: { it: "Brigadeiro", pt: "Brigadeiro", en: "Brigadeiro" } },
  { code: "carrot_cake", amountCents: 450, labels: { it: "Torta di carote e brigadeiro", pt: "Bolo de cenoura com brigadeiro", en: "Carrot cake with brigadeiro" } },
  { code: "other", amountCents: null, labels: { it: "Altro", pt: "Outro", en: "Other" } },
];

const copy = {
  it: {
    back: "Torna a DOCA",
    eyebrow: "Prenotazione online",
    title: "Prenota il tuo ritiro.",
    body: "Scegli cosa vuoi trovare pronto in bottega. Puoi prenotare per oggi o per uno dei prossimi giorni di apertura.",
    what: "Cosa vuoi prenotare?",
    other: "Scrivi cosa desideri prenotare",
    details: "Quando passi a ritirare?",
    customer: "I tuoi dati",
    name: "Nome",
    phone: "Telefono",
    date: "Scegli il giorno",
    time: "Scegli l'orario",
    notes: "Note",
    notesPlaceholder: "Allergie, preferenze o indicazioni utili",
    payment: "Come vuoi pagare?",
    onsite: "Pagamento in sede",
    onsiteDetail: "Paghi direttamente al ritiro.",
    stripe: "Pagamento online",
    stripeDetail: "Completa il pagamento con Stripe dopo l'invio.",
    stripeOther: "Per una richiesta libera il pagamento avviene in sede.",
    submit: "Invia prenotazione",
    submitting: "Invio in corso…",
    missing: "Inserisci i dati richiesti, scegli giorno e orario e seleziona almeno un prodotto.",
    sent: "Prenotazione inviata. La richiesta è visibile allo staff DOCA.",
    sentStripe: "Prenotazione inviata. Ora ti portiamo al pagamento sicuro.",
    stripeFallback: "Prenotazione inviata. Il pagamento online non è disponibile in questo momento: pagherai al ritiro.",
    failed: "Invio non riuscito. Riprova tra poco.",
  },
  pt: {
    back: "Voltar para a DOCA",
    eyebrow: "Reserva online",
    title: "Reserve sua retirada.",
    body: "Escolha o que deseja encontrar pronto na loja. Você pode reservar para hoje ou para um dos próximos dias de abertura.",
    what: "O que você deseja reservar?",
    other: "Escreva o que deseja reservar",
    details: "Quando você vem retirar?",
    customer: "Seus dados",
    name: "Nome",
    phone: "Telefone",
    date: "Escolha o dia",
    time: "Escolha o horário",
    notes: "Observações",
    notesPlaceholder: "Alergias, preferências ou informações úteis",
    payment: "Como deseja pagar?",
    onsite: "Pagamento na loja",
    onsiteDetail: "Pague diretamente na retirada.",
    stripe: "Pagamento online",
    stripeDetail: "Finalize o pagamento com Stripe após o envio.",
    stripeOther: "Para um pedido livre, o pagamento é feito na loja.",
    submit: "Enviar reserva",
    submitting: "Enviando…",
    missing: "Preencha os dados, escolha dia e horário e selecione pelo menos um produto.",
    sent: "Reserva enviada. A equipe da DOCA já pode ver seu pedido.",
    sentStripe: "Reserva enviada. Agora vamos direcionar você ao pagamento seguro.",
    stripeFallback: "Reserva enviada. O pagamento online não está disponível no momento: você pagará na retirada.",
    failed: "Não foi possível enviar. Tente novamente em instantes.",
  },
  en: {
    back: "Back to DOCA",
    eyebrow: "Online booking",
    title: "Book your pickup.",
    body: "Choose what you would like us to have ready. You can book for today or one of the next open days.",
    what: "What would you like to book?",
    other: "Tell us what you would like to book",
    details: "When will you collect it?",
    customer: "Your details",
    name: "Name",
    phone: "Phone",
    date: "Choose a day",
    time: "Choose a time",
    notes: "Notes",
    notesPlaceholder: "Allergies, preferences or useful details",
    payment: "How would you like to pay?",
    onsite: "Pay in store",
    onsiteDetail: "Pay when you collect your order.",
    stripe: "Pay online",
    stripeDetail: "Complete your Stripe payment after submitting.",
    stripeOther: "Custom requests are paid for in store.",
    submit: "Send booking",
    submitting: "Sending…",
    missing: "Fill in your details, choose a day and time, and select at least one product.",
    sent: "Booking sent. The DOCA team can now see your request.",
    sentStripe: "Booking sent. Taking you to secure payment now.",
    stripeFallback: "Booking sent. Online payment is not available right now: please pay when you collect your order.",
    failed: "We could not send your booking. Please try again shortly.",
  },
} as const;

const DAY_SHORT: Record<"it" | "pt" | "en", string[]> = {
  it: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
  pt: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const MONTH_SHORT: Record<"it" | "pt" | "en", string[]> = {
  it: ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"],
  pt: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function PickerCarousel({ children, itemCount }: { children: React.ReactNode; itemCount: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  function sync() {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 0);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 1);
  }

  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemCount]);

  function scroll(dir: "left" | "right") {
    ref.current?.scrollBy({ left: dir === "right" ? 260 : -260, behavior: "smooth" });
    setTimeout(sync, 320);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => scroll("left")}
        disabled={atStart}
        className="shrink-0 inline-flex size-8 items-center justify-center rounded-full border-2 border-pork-ink/10 bg-white text-pork-ink transition-opacity disabled:pointer-events-none disabled:opacity-20"
        aria-label="Precedente"
      >
        <ChevronLeft size={15} />
      </button>
      <div
        ref={ref}
        onScroll={sync}
        className="flex flex-1 gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => scroll("right")}
        disabled={atEnd}
        className="shrink-0 inline-flex size-8 items-center justify-center rounded-full border-2 border-pork-ink/10 bg-white text-pork-ink transition-opacity disabled:pointer-events-none disabled:opacity-20"
        aria-label="Successivo"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// Minimum minutes between now and the earliest selectable pickup slot.
// TODO: replace with tenant order-settings field when one is introduced.
const MIN_LEAD_MINUTES = 30;

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DocaProductReservationPage() {
  const tenant = useTenant();
  const language = useDocaLanguage();
  const t = copy[language];
  const tenantHref = useTenantLocalizedHref();
  const addReservation = useRestaurantServicesStore((state) => state.addReservation);
  const setTenantSeed = useRestaurantServicesStore((state) => state.setTenantSeed);
  const currentTenantId = useRestaurantServicesStore((state) => state.currentTenantId);
  const [quantities, setQuantities] = useState<Record<ProductCode, number>>({
    bread: 0,
    brigadeiro: 0,
    carrot_cake: 0,
    other: 0,
  });
  const [draft, setDraft] = useState({ name: "", phone: "", date: "", time: "", other: "", notes: "" });
  const [stripeAvailable, setStripeAvailable] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("on_site");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const hoursWeek = useMemo(() => defaultHoursWeekForTenant(tenant.id), [tenant.id]);
  const today = useMemo(() => new Date(), []);
  const availableDates = useMemo(() => openPickupDates(hoursWeek, today, 14), [hoursWeek, today]);

  const selectedDateObj = useMemo(() => {
    if (!draft.date) return null;
    const [y, m, d] = draft.date.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [draft.date]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDateObj) return [];
    const day = scheduleDayForDate(hoursWeek, selectedDateObj);
    if (day.closed) return [];
    const slots = generateTimeSlots(day.slots, 30);

    const isToday = formatDate(selectedDateObj) === formatDate(today);
    if (!isToday) return slots;

    const now = new Date();
    const cutoffMinutes = now.getHours() * 60 + now.getMinutes() + MIN_LEAD_MINUTES;
    return slots.filter((slot) => {
      const [h, m] = slot.split(":").map(Number);
      return h * 60 + m >= cutoffMinutes;
    });
  }, [hoursWeek, selectedDateObj, today]);

  const selectedProducts = products.filter((product) => quantities[product.code] > 0);
  const hasOther = quantities.other > 0;
  const canPayOnline = stripeAvailable && !hasOther;

  useEffect(() => {
    void fetch(`/api/tenant/${encodeURIComponent(tenant.id)}/payment-options`)
      .then((response) => response.json())
      .then((options: { stripe?: boolean }) => setStripeAvailable(options.stripe === true))
      .catch(() => setStripeAvailable(false));
  }, [tenant.id]);

  useEffect(() => {
    if (!canPayOnline && payment === "stripe") setPayment("on_site");
  }, [canPayOnline, payment]);

  function changeQuantity(code: ProductCode, delta: number) {
    setQuantities((current) => ({ ...current, [code]: Math.max(0, Math.min(99, current[code] + delta)) }));
  }

  function buildSummary() {
    const itemLines = selectedProducts.map((product) => {
      const label = product.code === "other" ? `${product.labels[language]}: ${draft.other.trim()}` : product.labels[language];
      return `- ${label} x${quantities[product.code]}`;
    });
    return [
      "Ritiro prodotti DOCA",
      ...itemLines,
      `Pagamento: ${payment === "stripe" ? "online Stripe" : "in sede"}`,
      draft.notes.trim() ? `Note cliente: ${draft.notes.trim()}` : "",
    ].filter(Boolean).join("\n");
  }

  function recordLocalReservation(notes: string, id?: string) {
    if (currentTenantId !== tenant.id) setTenantSeed(tenant.id);
    addReservation({
      id: id ?? `res-${Date.now().toString(36)}`,
      customer: draft.name.trim(),
      phone: draft.phone.trim(),
      covers: 1,
      date: draft.date,
      time: draft.time,
      notes,
      status: "nuova",
    });
  }

  async function startStripeCheckout(reservationId: string) {
    const pageUrl = `${window.location.origin}${tenantHref("/prenota")}`;
    const response = await fetch("/api/payments/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: tenant.id,
        source: "online",
        items: selectedProducts.map((product) => ({
          name: product.labels[language],
          amountCents: product.amountCents,
          quantity: quantities[product.code],
        })),
        successUrl: `${pageUrl}?payment=success`,
        cancelUrl: `${pageUrl}?payment=cancelled`,
        metadata: {
          reservation_id: reservationId,
          reservation_kind: "product_pickup",
          pickup_date: draft.date,
          pickup_time: draft.time,
        },
      }),
    });
    const payload = await response.json() as { session?: { url?: string }; error?: string };
    if (!response.ok || !payload.session?.url) throw new Error(payload.error ?? "checkout_failed");
    window.location.assign(payload.session.url);
  }

  async function submit() {
    if (
      tenant.id !== "doca" ||
      !draft.name.trim() ||
      !draft.phone.trim() ||
      !draft.date ||
      !draft.time ||
      selectedProducts.length === 0 ||
      (hasOther && !draft.other.trim())
    ) {
      setMessage({ kind: "error", text: t.missing });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const notes = buildSummary();
    try {
      const response = await fetch(`/api/tenant/${encodeURIComponent(tenant.id)}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: draft.name.trim(),
          customerPhone: draft.phone.trim(),
          covers: 1,
          reservationDate: draft.date,
          reservationTime: draft.time,
          notes,
          specialRequestTags: ["ritiro_prodotti"],
        }),
      });
      if (!response.ok && response.status !== 503) throw new Error("reservation_failed");
      const result = response.ok ? await response.json() as { id?: string } : {};
      const id = result.id ?? `res-${Date.now().toString(36)}`;
      recordLocalReservation(notes, id);
      if (payment === "stripe" && response.ok) {
        setMessage({ kind: "ok", text: t.sentStripe });
        try {
          await startStripeCheckout(id);
        } catch {
          setPayment("on_site");
          setMessage({ kind: "ok", text: t.stripeFallback });
        }
        return;
      }
      setMessage({ kind: "ok", text: t.sent });
      setQuantities({ bread: 0, brigadeiro: 0, carrot_cake: 0, other: 0 });
      setDraft({ name: "", phone: "", date: "", time: "", other: "", notes: "" });
    } catch {
      setMessage({ kind: "error", text: t.failed });
    } finally {
      setSubmitting(false);
    }
  }

  if (tenant.id !== "doca") return null;

  return (
    <section
      className="min-h-screen bg-pork-cream px-5 py-12 text-pork-ink sm:py-16"
      data-tenant-surface="doca"
    >
      <div className="mx-auto max-w-5xl">
        <Link href={tenantHref("/")} className="inline-flex items-center gap-2 text-sm font-black text-pork-red hover:underline">
          <ChevronLeft size={18} />
          {t.back}
        </Link>
        <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.5fr]">
          <div>
            <p className="impact-title text-sm text-pork-red">{t.eyebrow}</p>
            <h1 className="headline mt-3 text-5xl sm:text-6xl">{t.title}</h1>
            <p className="mt-4 max-w-md text-base leading-7 text-pork-ink/70">{t.body}</p>
          </div>

          <div className="max-h-[calc(100svh_-_8rem)] overflow-y-auto rounded-3xl bg-white p-5 shadow-xl ring-1 ring-pork-ink/10 sm:p-8">
            {/* Prodotti */}
            <h2 className="headline text-3xl">{t.what}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {products.map((product) => (
                <div key={product.code} className="rounded-2xl border-2 border-pork-ink/10 p-4">
                  <p className="font-black">{product.labels[language]}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button type="button" onClick={() => changeQuantity(product.code, -1)} className="inline-flex size-8 items-center justify-center rounded-full bg-pork-ink/5" aria-label="-">
                      <Minus size={15} />
                    </button>
                    <span className="min-w-5 text-center font-black">{quantities[product.code]}</span>
                    <button type="button" onClick={() => changeQuantity(product.code, 1)} className="inline-flex size-8 items-center justify-center rounded-full bg-pork-red text-white" aria-label="+">
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {hasOther && (
              <input value={draft.other} onChange={(event) => setDraft((current) => ({ ...current, other: event.target.value }))} placeholder={t.other} className="mt-3 w-full rounded-xl border-2 border-pork-ink/10 px-3 py-2.5 outline-none focus:border-pork-red" />
            )}

            {/* Ritiro */}
            <h2 className="headline mt-8 text-3xl">{t.details}</h2>

            {/* Date card picker — carosello */}
            <p className="mt-4 text-sm font-bold">{t.date}</p>
            <div className="mt-2">
              <PickerCarousel itemCount={availableDates.length}>
                {availableDates.map((date) => {
                  const value = formatDate(date);
                  const selected = draft.date === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDraft((current) => ({ ...current, date: value, time: "" }))}
                      className={`shrink-0 rounded-xl border-2 px-3 py-2 text-center text-sm leading-tight transition-colors ${
                        selected
                          ? "border-pork-red bg-pork-red text-white"
                          : "border-pork-ink/10 bg-pork-ink/[0.03] hover:border-pork-red/50"
                      }`}
                    >
                      <span className="block font-bold">{DAY_SHORT[language][date.getDay()]}</span>
                      <span className="block text-lg font-black leading-none">{date.getDate()}</span>
                      <span className={`block text-xs ${selected ? "opacity-80" : "opacity-50"}`}>
                        {MONTH_SHORT[language][date.getMonth()]}
                      </span>
                    </button>
                  );
                })}
              </PickerCarousel>
            </div>

            {/* Time slot grid — carosello, appare solo dopo aver scelto il giorno */}
            {draft.date && availableTimeSlots.length > 0 && (
              <>
                <p className="mt-5 text-sm font-bold">{t.time}</p>
                <div className="mt-2">
                  <PickerCarousel itemCount={availableTimeSlots.length}>
                    {availableTimeSlots.map((slot) => {
                      const selected = draft.time === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setDraft((current) => ({ ...current, time: slot }))}
                          className={`shrink-0 rounded-xl border-2 px-3 py-2 text-sm font-bold tabular-nums transition-colors ${
                            selected
                              ? "border-pork-red bg-pork-red text-white"
                              : "border-pork-ink/10 bg-pork-ink/[0.03] hover:border-pork-red/50"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </PickerCarousel>
                </div>
              </>
            )}

            {/* Dati cliente */}
            <h2 className="headline mt-8 text-3xl">{t.customer}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder={t.name} className="rounded-xl border-2 border-pork-ink/10 px-3 py-2.5 outline-none focus:border-pork-red" />
              <input type="tel" value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} placeholder={t.phone} className="rounded-xl border-2 border-pork-ink/10 px-3 py-2.5 outline-none focus:border-pork-red" />
              <textarea rows={3} value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder={t.notesPlaceholder} aria-label={t.notes} className="rounded-xl border-2 border-pork-ink/10 px-3 py-2.5 outline-none focus:border-pork-red sm:col-span-2" />
            </div>

            {/* Pagamento */}
            <h2 className="headline mt-8 text-3xl">{t.payment}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <PaymentButton active={payment === "on_site"} icon={<Store size={18} />} title={t.onsite} detail={t.onsiteDetail} onClick={() => setPayment("on_site")} />
              {canPayOnline && <PaymentButton active={payment === "stripe"} icon={<CreditCard size={18} />} title={t.stripe} detail={t.stripeDetail} onClick={() => setPayment("stripe")} />}
            </div>
            {hasOther && stripeAvailable && <p className="mt-3 text-sm font-semibold text-pork-red">{t.stripeOther}</p>}
            {message && <p className={`mt-5 rounded-xl px-4 py-3 text-sm font-bold ${message.kind === "ok" ? "bg-pork-green/10 text-pork-green" : "bg-pork-red/10 text-pork-red"}`}>{message.text}</p>}
            <button type="button" disabled={submitting} onClick={() => void submit()} className="mt-5 inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-3 text-sm font-black text-white hover:bg-pork-red-dark disabled:opacity-60">
              {submitting ? <CalendarDays size={17} /> : <Check size={17} />}
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PaymentButton({
  active,
  detail,
  icon,
  onClick,
  title,
}: {
  active: boolean;
  detail: string;
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border-2 p-4 text-left ${active ? "border-pork-red bg-pork-red/5" : "border-pork-ink/10"}`}>
      <span className="flex items-center gap-2 font-black">{icon}{title}</span>
      <span className="mt-1 block text-xs leading-5 text-pork-ink/60">{detail}</span>
    </button>
  );
}
