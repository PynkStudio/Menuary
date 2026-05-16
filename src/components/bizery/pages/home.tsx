import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  CalendarCheck,
  CalendarClock,
  Check,
  Clock,
  Globe,
  Megaphone,
  MessageCircle,
  Phone,
  PhoneCall,
  Plus,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";
import { BizeryShell } from "@/components/bizery/bizery-shell";
import { BIZERY_PRICING_PLANS, AI_ADDON, annualSaving } from "@/lib/platform-pricing";
import { getMarketingHomeData } from "@/lib/marketing-data";

// ─── Dati statici ─────────────────────────────────────────────────────────────

const GOOGLE_SYNC_CARDS: {
  icon: typeof Star;
  title: string;
  body: string;
  note?: string;
}[] = [
  {
    icon: Star,
    title: "Recensioni sincronizzate",
    body: "Le recensioni Google vengono aggiornate automaticamente sul sito.",
    note: "Aggiornamento periodico automatico.",
  },
  {
    icon: Clock,
    title: "Orari sempre corretti",
    body: "Aggiorna orari di apertura, chiusure e festività da un solo posto.",
  },
  {
    icon: Megaphone,
    title: "Novità e promozioni",
    body: "Pubblica aggiornamenti e offerte direttamente sulla tua scheda Google.",
  },
  {
    icon: ShieldCheck,
    title: "Meno errori, meno chiamate",
    body: "Evita clienti che trovano informazioni sbagliate online.",
  },
];

const BENEFIT_CARDS: { n: string; title: string; body: string }[] = [
  {
    n: "01",
    title: "Sito professionale",
    body: "Responsive, veloce e progettato per valorizzare il tuo studio.",
  },
  {
    n: "02",
    title: "Appuntamenti semplici",
    body: "Gestisci richieste e prenotazioni senza caos, via web o WhatsApp.",
  },
  {
    n: "03",
    title: "Google Maps integrato",
    body: "Orari, recensioni e informazioni aggiornati da un unico pannello.",
  },
  {
    n: "04",
    title: "Strumenti operativi",
    body: "CRM, analytics e gestione staff. Tutto integrato, niente plugin.",
  },
];

const AI_CAPABILITIES: {
  icon: typeof PhoneCall;
  title: string;
  body: string;
  badge: string;
}[] = [
  {
    icon: PhoneCall,
    title: "Inbound vocale H24",
    body: "Risponde a qualsiasi ora con italiano naturale. Fissa, sposta o cancella un appuntamento mentre parla, senza mettere il cliente in attesa.",
    badge: "Telefono in",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp inbound",
    body: "Risponde 24/7 ai messaggi: propone slot, conferma servizio e durata, gestisce richieste di modifica o cancellazione.",
    badge: "WhatsApp in",
  },
  {
    icon: Send,
    title: "Promemoria & recall",
    body: "Sequenze automatiche su WhatsApp, SMS ed email. Il cliente può rispondere e spostare l'appuntamento in chat — senza chiamarti.",
    badge: "Outbound",
  },
  {
    icon: Bell,
    title: "Conferme automatiche",
    body: "Logica configurabile per servizio: 24h prima, 2h prima, conferma con un tap. Tasso di no-show ridotto in media del 60–70%.",
    badge: "Reminder",
  },
  {
    icon: CalendarClock,
    title: "Riprogrammazione",
    body: "Se il cliente non può venire, l'IA propone subito un nuovo slot. Tu vedi solo il risultato aggiornato in agenda.",
    badge: "Reschedule",
  },
  {
    icon: Phone,
    title: "Cloning vocale",
    body: "L'IA risponde con una voce coerente al tuo brand — clonata in modo etico. Continuità di identità anche al telefono.",
    badge: "Voice ID",
  },
];

const FAQ = [
  {
    q: "A cosa serve un sito per uno studio professionale nel 2026?",
    a: "Serve a controllare come vieni trovato e percepito, prima ancora che il cliente chiami. Google Maps, recensioni, orari aggiornati, appuntamenti online: chi non gestisce questi punti lascia spazio ai concorrenti. Un sito professionale è la prima sala d'attesa del tuo studio.",
  },
  {
    q: "Non basta un profilo LinkedIn o Instagram?",
    a: "No. LinkedIn e Instagram non gestiscono appuntamenti, non appaiono nelle ricerche Google Maps e non sono tuoi — l'algoritmo può cambiare, il profilo può essere sospeso. Il sito è un asset che possiedi, che si accumula nel tempo e che Google indicizza.",
  },
  {
    q: "Come funziona l'IA al telefono?",
    a: "L'assistente risponde 24/7 con la voce e il tono dello studio. Fissa, sposta e cancella appuntamenti direttamente in agenda, gestisce richieste fuori orario, manda promemoria automatici su WhatsApp e SMS. Supporta cloning vocale e parla in 5 lingue. Disponibile dal piano Appuntamenti.",
  },
  {
    q: "Quanto tempo serve per andare online?",
    a: "Entro 7 giorni dalla firma del contratto. La configurazione iniziale — onboarding, design, personalizzazione — avviene prima, in media 2–4 settimane.",
  },
  {
    q: "Il contratto è annuale?",
    a: "Sì, con pagamento anticipato di 12 mesi. Il rinnovo automatico si può disdire con 30 giorni di preavviso; il contratto scade al termine del periodo pagato. Upgrade attivo immediatamente; downgrade dal rinnovo successivo.",
  },
  {
    q: "Ci sono commissioni su prenotazioni?",
    a: "Zero. Bizery non trattiene nulla sulle tue prenotazioni o transazioni. Quello che incassi è tuo, integrale.",
  },
  {
    q: "Posso aggiornare il sito da solo?",
    a: "Sì. Listino, orari, foto, eventi: tutto si aggiorna dal pannello senza toccare il codice, anche dallo smartphone tra un appuntamento e l'altro.",
  },
  {
    q: "Il sito è disponibile in più lingue?",
    a: "Sì. Ogni sito viene realizzato in versione multilingua di default, coprendo le principali lingue europee: italiano, inglese, francese, tedesco e spagnolo. Su richiesta è possibile aggiungere altre lingue in base all'utenza tipica dello studio — ad esempio russo, arabo, cinese o giapponese. Il costo delle lingue aggiuntive viene concordato in fase di preventivo.",
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export async function BizeryHomePage() {
  const { testimonials, activeTenants, activeCount } =
    await getMarketingHomeData("services");

  return (
    <BizeryShell>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, var(--menuary-porcelain) 0%, var(--menuary-paper) 60%)",
          }}
          aria-hidden
        />
        <div className="menuary-container relative pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid items-end gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Per studi e aziende di servizi</p>
              <h1
                className="mt-7 text-[clamp(2.6rem,6.4vw,5.6rem)] font-medium leading-[1.05] tracking-[-0.02em] text-balance"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                La tua attività online,
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  senza complicazioni.
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                Sito professionale, appuntamenti online e gestione semplificata
                di Google Maps e presenza digitale.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link href="/contatti" className="menuary-button menuary-button-accent">
                  Richiedi una demo
                </Link>
                <Link href="#google" className="menuary-link">
                  Come funziona
                  <ArrowUpRight size={16} strokeWidth={1.6} />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={14} strokeWidth={1.7} className="text-[var(--menuary-sage)]" />
                  Prima chiamata gratuita
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock size={14} strokeWidth={1.7} className="text-[var(--menuary-copper)]" />
                  Online in 2–4 settimane
                </span>
                <span className="inline-flex items-center gap-2">
                  <Globe size={14} strokeWidth={1.7} className="text-[var(--menuary-muted)]" />
                  Multilingua · IT EN FR DE ES +
                </span>
              </div>
            </div>

            {/* Mockup composito */}
            <figure className="menuary-fade-up menuary-fade-up-d2 relative" aria-hidden>
              <div className="menuary-product-frame p-4">
                <div className="menuary-browser-bar">
                  <span /><span /><span />
                  <p>app.bizery.it</p>
                </div>
                <div className="menuary-admin-preview">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="menuary-module-tile">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">Oggi</p>
                      <p
                        className="mt-1 text-2xl font-medium"
                        style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                      >
                        8
                        <span className="ml-1 text-xs font-medium text-[var(--menuary-muted)]">appuntamenti</span>
                      </p>
                    </div>
                    <div className="menuary-module-tile">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">Google</p>
                      <p
                        className="mt-1 text-2xl font-medium"
                        style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                      >
                        4,8
                        <span className="ml-1 text-xs font-medium text-[var(--menuary-muted)]">★ media</span>
                      </p>
                    </div>
                    <div className="menuary-module-tile">
                      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">Orari</p>
                      <p
                        className="mt-1 text-base font-medium leading-tight"
                        style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                      >
                        Aggiornati
                        <br />
                        <span className="text-xs font-medium text-[var(--menuary-muted)]">oggi</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Business card */}
              <div className="absolute -top-6 -right-2 hidden w-[15rem] rounded-2xl border border-[var(--menuary-line)] bg-white p-4 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.22)] sm:block">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center">
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC04" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                    </svg>
                  </span>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    Google · scheda
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  <div className="flex gap-0.5 text-[var(--menuary-copper)]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-[var(--menuary-ink)]">4,8</span>
                </div>
                <p className="mt-2 text-xs text-[var(--menuary-muted)]">Aperto · chiude alle 19:00</p>
              </div>

              {/* Mobile preview */}
              <div className="absolute -bottom-8 -left-4 hidden w-[11rem] rounded-3xl border border-[var(--menuary-line)] bg-[var(--menuary-ink)] p-3 shadow-[0_30px_70px_-24px_rgba(15,23,42,0.4)] sm:block">
                <div className="menuary-phone-top" />
                <div className="rounded-2xl bg-[var(--menuary-paper)] p-3 text-[var(--menuary-ink)]">
                  <p
                    className="text-base font-medium leading-tight"
                    style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                  >
                    Studio
                    <br />
                    Legale Rossi
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--menuary-muted)] font-bold">
                    Milano · diritto civile
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[var(--menuary-ink)]">
                    <CalendarCheck size={12} strokeWidth={1.8} className="text-[var(--menuary-copper)]" />
                    Prenota un appuntamento
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-[var(--menuary-muted)]">
                    <Check size={11} strokeWidth={2} className="text-[var(--menuary-sage)]" />
                    Aperto oggi
                  </div>
                </div>
              </div>
            </figure>
          </div>

          {/* Stats */}
          {activeCount > 0 && (
            <div className="mt-20 grid gap-8 sm:grid-cols-3 lg:mt-24 lg:gap-14">
              {([
                [`+${activeCount}`, "studi attivi"],
                ["7gg", "attivazione"],
                ["0", "commissioni"],
              ] as [string, string][]).map(([n, l]) => (
                <div key={l} className="menuary-stat">
                  <p className="text-4xl font-medium" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>{n}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">{l}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SOCIAL PROOF — studi clienti ── */}
      {activeTenants.length > 0 && (
        <section className="border-t border-[var(--menuary-line)]">
          <div className="menuary-container py-10">
            <p className="mb-8 text-center text-xs uppercase tracking-[0.22em] text-[var(--menuary-muted)] font-bold">
              Studi e aziende che usano Bizery
            </p>
            <div className="flex flex-wrap items-center justify-center gap-10">
              {activeTenants.slice(0, 6).map((t) => (
                <p key={t.id} className="text-sm font-semibold text-[var(--menuary-ink)] opacity-50">
                  {t.name}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GOOGLE SYNC ── */}
      <section id="google" className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="menuary-section-label">Integrazione Google</p>
            <h2
              className="mt-6 text-[clamp(2.2rem,4.8vw,4rem)] font-medium leading-[1.05] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Google sempre aggiornato.
            </h2>
            <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-[var(--menuary-muted)]">
              Gestisci sito, orari e presenza locale da un unico pannello.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {GOOGLE_SYNC_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group flex flex-col rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--menuary-ink)]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--menuary-ink)]/5 text-[var(--menuary-ink)]">
                    <Icon size={20} strokeWidth={1.6} />
                  </span>
                  <h3
                    className="mt-6 text-[1.35rem] font-medium leading-tight"
                    style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-[1.6] text-[var(--menuary-muted)]">{card.body}</p>
                  {card.note && (
                    <p className="mt-5 border-t border-[var(--menuary-line)] pt-4 text-[11px] uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                      {card.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRESENZA LOCALE ── */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div>
              <p className="menuary-section-label">Presenza locale</p>
              <h2
                className="mt-6 text-[clamp(2.2rem,4.8vw,4rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                La tua presenza online,
                <br />
                <span className="italic text-[var(--menuary-copper)]">tutta insieme.</span>
              </h2>
              <p className="mt-7 max-w-lg text-[17px] leading-[1.7] text-[var(--menuary-muted)]">
                Bizery collega sito, Google Maps e strumenti operativi per
                mantenere il tuo studio aggiornato e professionale.
              </p>
              <Link href="/contatti" className="menuary-link mt-8 inline-flex">
                Parla con noi
                <ArrowUpRight size={14} strokeWidth={1.6} />
              </Link>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              {/* Google card */}
              <div className="relative z-20 rounded-2xl border border-[var(--menuary-line)] bg-white p-5 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.22)]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_var(--menuary-line)]">
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC04" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">Google</p>
                    <p className="text-sm font-semibold truncate text-[var(--menuary-ink)]">La tua scheda · Aperto</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex gap-0.5 text-[var(--menuary-copper)]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-[var(--menuary-ink)]">4,8</span>
                  <span className="text-xs text-[var(--menuary-muted)]">· aggiornato oggi</span>
                </div>
              </div>

              {/* TripAdvisor */}
              <div className="relative z-10 -mt-3 ml-12 rounded-2xl border border-[var(--menuary-line)] bg-white p-4 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
                    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden>
                      <circle cx="20" cy="20" r="20" fill="#00AF87" />
                      <circle cx="13" cy="21" r="6" fill="white" />
                      <circle cx="13" cy="21" r="3.5" fill="#00AF87" />
                      <circle cx="13" cy="21" r="2" fill="#1A1A1A" />
                      <circle cx="12" cy="20" r="0.7" fill="white" />
                      <circle cx="27" cy="21" r="6" fill="white" />
                      <circle cx="27" cy="21" r="3.5" fill="#00AF87" />
                      <circle cx="27" cy="21" r="2" fill="#1A1A1A" />
                      <circle cx="26" cy="20" r="0.7" fill="white" />
                      <ellipse cx="20" cy="27" rx="2.5" ry="1.5" fill="white" opacity="0.9" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">Tripadvisor</p>
                    <p className="text-sm font-semibold truncate text-[var(--menuary-ink)]">Eccellenza · 2026</p>
                  </div>
                </div>
              </div>

              {/* Yelp */}
              <div className="relative z-0 -mt-3 ml-4 mr-12 rounded-2xl border border-[var(--menuary-line)] bg-white p-4 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.18)]">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#D32323]">
                    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="white">
                      <path d="M12.27 12.56l-3.93 1.06a.5.5 0 0 1-.6-.64l1.58-3.67a.5.5 0 0 1 .88-.06l2.35 2.61a.5.5 0 0 1-.28.7zm1.37-.96l2.08-3.43a.5.5 0 0 1 .85.06l1.24 3.8a.5.5 0 0 1-.57.65l-3.32-.43a.5.5 0 0 1-.28-.65zm-4.83 4.28l-3.59-1.6a.5.5 0 0 1-.1-.86l3.08-2.25a.5.5 0 0 1 .76.28l.51 3.83a.5.5 0 0 1-.66.6zm9.04 1.14l-3.6 1.53a.5.5 0 0 1-.67-.57l.46-3.85a.5.5 0 0 1 .75-.37l3.13 2.2a.5.5 0 0 1-.07.86zm-4.43 3.83l.04 3.9a.5.5 0 0 1-.78.42l-3.22-2.12a.5.5 0 0 1 .07-.86l3.18-1.77a.5.5 0 0 1 .71.43z" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">Yelp</p>
                    <p className="text-sm font-semibold truncate text-[var(--menuary-ink)]">94 recensioni · 4,6</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFICI ── */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="menuary-section-label">Cosa trovi dentro</p>
            <h2
              className="mt-6 text-[clamp(2.2rem,4.8vw,4rem)] font-medium leading-[1.05] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Tutto quello che serve.
              <br />
              <span className="italic text-[var(--menuary-copper)]">Niente di più.</span>
            </h2>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFIT_CARDS.map((card) => (
              <div
                key={card.n}
                className="flex flex-col rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--menuary-ink)]"
              >
                <p className="text-base font-medium text-[var(--menuary-copper)]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }} aria-hidden>
                  {card.n}
                </p>
                <h3 className="mt-6 text-[1.45rem] font-medium leading-tight" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                  {card.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[var(--menuary-muted)]">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      {testimonials.length > 0 && (
        <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
          <div className="menuary-container py-24 lg:py-28">
            <p className="menuary-section-label">Voci dei clienti · Google</p>
            <h2
              className="mt-6 text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Lo dicono meglio loro.
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <figure
                  key={t.id}
                  className="flex flex-col gap-5 border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-7 rounded-2xl"
                >
                  <div className="flex gap-0.5 text-[var(--menuary-copper)]">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <blockquote className="text-[15px] leading-7 text-[var(--menuary-ink)]/85">
                    &laquo;{t.text}&raquo;
                  </blockquote>
                  <figcaption className="mt-auto border-t border-[var(--menuary-line)] pt-4">
                    <p className="text-sm font-semibold">{t.author}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                      {t.tenantName}{t.tenantCity ? ` · ${t.tenantCity}` : ""}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRICING ── */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <p className="menuary-section-label">Piani</p>
              <h2
                className="mt-6 text-[clamp(2.2rem,4.8vw,4rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Tre piani.
                <br />
                <span className="italic text-[var(--menuary-copper)]">Nessuna sorpresa.</span>
              </h2>
            </div>
            <p className="max-w-sm text-[15px] leading-[1.6] text-[var(--menuary-muted)]">
              Setup una tantum, canone mensile fisso. IVA esclusa. Contratto annuale.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {BIZERY_PRICING_PLANS.map((plan) => {
              const highlighted = plan.is_featured === true;
              const saving = annualSaving(plan);
              return (
                <article
                  key={plan.slug}
                  className={
                    "relative flex flex-col rounded-3xl border bg-[var(--menuary-paper)] p-8 transition-all duration-200 " +
                    (highlighted
                      ? "border-[var(--menuary-copper)] shadow-[0_30px_70px_-30px_rgba(15,23,42,0.22)] lg:scale-[1.02]"
                      : "border-[var(--menuary-line)] hover:border-[var(--menuary-ink)]")
                  }
                >
                  {highlighted && (
                    <span className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-[var(--menuary-copper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                      Più scelto
                    </span>
                  )}
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">Piano</p>
                  <h3
                    className="mt-2 text-[1.9rem] font-medium leading-tight"
                    style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                  >
                    {plan.marketing_name}
                  </h3>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span
                      className="text-[3.4rem] font-medium leading-none tabular-nums"
                      style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                    >
                      {plan.price_annual}
                    </span>
                    <span className="text-sm text-[var(--menuary-muted)]">€/mese</span>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--menuary-muted)]">
                    Pagamento annuale anticipato
                    {saving > 0 && (
                      <span className="ml-1 font-semibold text-[var(--menuary-sage)]">· risparmi €{saving}/anno</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[var(--menuary-muted)]">
                    Mensile: €{plan.price_monthly}/mese · Setup {plan.setup_from}
                  </p>
                  <div className="my-7 h-px bg-[var(--menuary-line)]" />
                  <ul className="space-y-3">
                    {plan.marketing_items.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[15px] leading-[1.5]">
                        <Check size={16} strokeWidth={2} className="mt-1 shrink-0 text-[var(--menuary-sage)]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-8">
                    <Link
                      href="/contatti"
                      className={
                        "menuary-button " +
                        (highlighted ? "menuary-button-accent" : "menuary-button-light")
                      }
                    >
                      {plan.cta_label ?? "Richiedi proposta"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-8 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
            IVA esclusa · Nessuna penale di disdetta · Attivazione entro 7 giorni
          </p>

          {/* AI callout */}
          <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-4 shrink-0">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
                <Phone size={18} strokeWidth={1.7} />
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">Dal piano Appuntamenti in su</p>
                <p
                  className="text-lg font-medium"
                  style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                >
                  IA al telefono{" "}
                  <span className="text-[var(--menuary-copper)]">+€{AI_ADDON.monthly}/mese</span>
                </p>
              </div>
            </div>
            <p className="flex-1 text-[14px] leading-[1.65] text-[var(--menuary-muted)]">
              Assistente vocale 24/7 che risponde con la voce dello studio, fissa e
              sposta appuntamenti, manda promemoria. Quota minuti mensile inclusa;
              oltre la soglia, addebiti a prezzo di costo senza markup.
            </p>
            <Link href="/pricing" className="menuary-button menuary-button-light shrink-0 text-sm">
              Scopri
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI SHOWCASE ── */}
      <section
        id="ia"
        className="border-t border-[var(--menuary-line)]"
        style={{ background: "var(--menuary-ink)" }}
      >
        <div className="menuary-container py-24 lg:py-32 text-[var(--menuary-paper)]">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20 lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--menuary-copper)] font-bold">
                Integrazione AI · add-on
              </p>
              <h2
                className="mt-6 text-[clamp(2.4rem,5.4vw,4.8rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Un assistente che
                <br />
                <span className="italic text-[var(--menuary-copper)]">non stacca mai.</span>
              </h2>
            </div>
            <p className="max-w-md text-[16px] leading-[1.8] text-[var(--menuary-paper)]/70 lg:justify-self-end lg:text-right">
              Risponde al telefono, scrive su WhatsApp, manda promemoria e
              riprogramma gli appuntamenti. Lavora dentro la tua agenda,
              parla il linguaggio dello studio, 24 ore su 24.
            </p>
          </div>

          <div className="mt-16 grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-[var(--menuary-paper)]/10">
            {AI_CAPABILITIES.map((c) => {
              const Icon = c.icon;
              return (
                <article
                  key={c.title}
                  className="p-8 lg:p-10 bg-[var(--menuary-ink)] hover:bg-[var(--menuary-ink)]/85 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--menuary-copper)]/15 text-[var(--menuary-copper)]">
                      <Icon size={18} strokeWidth={1.7} />
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--menuary-paper)]/40 font-bold">
                      {c.badge}
                    </span>
                  </div>
                  <h3 className="mt-6 text-[1.2rem] font-semibold leading-snug text-[var(--menuary-paper)]">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-[var(--menuary-paper)]/65">{c.body}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-16 flex flex-wrap items-center gap-4">
            <Link href="/contatti" className="menuary-button menuary-button-accent">
              Aggiungi l&apos;IA al tuo piano
            </Link>
            <Link href="/pricing" className="menuary-link menuary-link-light">
              Vedi i piani
              <ArrowUpRight size={16} strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="mx-auto max-w-3xl">
            <p className="menuary-section-label">FAQ</p>
            <h2
              className="mt-6 mb-12 text-[clamp(2.2rem,4vw,3.6rem)] font-medium leading-[1.05] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Domande frequenti.
            </h2>
            <div>
              {FAQ.map((item) => (
                <details key={item.q} className="menuary-faq-item group">
                  <summary>
                    <span>{item.q}</span>
                    <span className="menuary-faq-toggle" aria-hidden>
                      <Plus size={16} strokeWidth={1.8} />
                    </span>
                  </summary>
                  <p className="menuary-faq-answer">{item.a}</p>
                </details>
              ))}
            </div>
            <p className="mt-10 text-[14px] text-[var(--menuary-muted)]">
              Non hai trovato quello che cercavi?{" "}
              <Link href="/contatti" className="menuary-link">
                Scrivici
                <ArrowUpRight size={13} strokeWidth={1.8} />
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="border-t border-[var(--menuary-line)]" style={{ background: "var(--menuary-ink)" }}>
        <div className="menuary-container py-24 text-center lg:py-28">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--menuary-paper)]/40 font-bold">
            Inizia oggi
          </p>
          <h2
            className="mt-6 text-[clamp(2.6rem,6vw,5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--menuary-paper)]"
            style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
          >
            La tua attività merita
            <br />
            <span className="italic text-[var(--menuary-copper)]">
              un partner digitale concreto.
            </span>
          </h2>
          <p className="mt-8 text-[16px] leading-7 text-[var(--menuary-paper)]/60 max-w-md mx-auto">
            Prima chiamata gratuita. Proposta su misura in 48 ore. Nessun vincolo prima di firmare.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contatti" className="menuary-button menuary-button-accent">
              Richiedi una demo
            </Link>
            <Link href="/pricing" className="menuary-link menuary-link-light">
              Vedi i piani
              <ArrowUpRight size={16} strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </section>
    </BizeryShell>
  );
}
