import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Users,
  TrendingUp,
  Boxes,
  Building2,
  Check,
  Plus,
  PhoneCall,
  PhoneOutgoing,
  MessageCircle,
  Bot,
  Clock,
  Mic,
  Headphones,
  Send,
  CalendarClock,
  Bell,
} from "lucide-react";
import { BizeryShell } from "@/components/bizery/bizery-shell";
import { PRICING_PLANS, annualSaving } from "@/lib/platform-pricing";
import { getMarketingHomeData } from "@/lib/marketing-data";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80";

const FEATURES: { icon: typeof CalendarCheck; title: string; body: string; tone?: "dark" }[] = [
  {
    icon: PhoneCall,
    title: "Centralino IA H24",
    body: "Un assistente vocale risponde al telefono 24/7 con la voce del tuo brand: dà informazioni, fissa, sposta e cancella appuntamenti, gestisce le emergenze. Nessuna chiamata persa, mai più.",
    tone: "dark",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp & SMS automatici",
    body: "Conversazioni inbound e outbound automatiche su WhatsApp, SMS e webchat. Il cliente scrive, l'IA capisce, propone slot, conferma o riprogramma — direttamente sulla tua agenda.",
  },
  {
    icon: PhoneOutgoing,
    title: "Chiamate outbound IA",
    body: "Promemoria automatici, conferme di appuntamento, recall sui no-show. L'IA chiama, parla con il cliente e aggiorna l'agenda in tempo reale.",
  },
  {
    icon: CalendarCheck,
    title: "Agenda integrata",
    body: "Agenda operativa unica per tutti i canali: telefono umano, IA, sito, WhatsApp, walk-in. Conferme automatiche, blocchi orari, sovrapposizioni risolte.",
    tone: "dark",
  },
  {
    icon: BookOpen,
    title: "Sito su misura",
    body: "Identità, servizi, orari, contatti costruiti sul tuo brand. Niente template: ogni pagina rispecchia davvero la tua azienda — e converte.",
  },
  {
    icon: Users,
    title: "CRM clienti",
    body: "Storico, preferenze, ricorrenze, note operative. L'IA legge il CRM prima di rispondere: il cliente si sente riconosciuto al primo squillo.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & report",
    body: "Appuntamenti per fascia oraria, servizi più richiesti, scontrino medio, tasso di no-show. Cosa funziona, cosa no, dove intervenire.",
    tone: "dark",
  },
  {
    icon: Boxes,
    title: "Costi e margini",
    body: "Collega materiali e ore operative a ogni servizio. Vedi il margine reale prima di comunicare il listino.",
  },
  {
    icon: Building2,
    title: "Multi-sede",
    body: "Più sedi, un unico account. Listini differenziati, agenda separata, report comparativi, permessi staff per sede.",
  },
  {
    icon: ShieldCheck,
    title: "Staff e ruoli",
    body: "Permessi granulari per ogni membro: chi vede la cassa, chi gestisce l'agenda, chi modifica listino e servizi.",
  },
  {
    icon: Mic,
    title: "Voice cloning",
    body: "L'IA può rispondere con una voce coerente al tuo brand — clonata in modo etico e con consenso. Continuità di identità anche al telefono.",
  },
  {
    icon: BookOpen,
    title: "Listino servizi digitale",
    body: "Catalogo consultabile da sito e QR. Aggiornalo in due clic, sempre online, sempre allineato a ciò che l'IA propone al cliente.",
  },
];

const AI_CAPABILITIES: { icon: typeof PhoneCall; title: string; body: string; badge: string }[] = [
  {
    icon: PhoneCall,
    title: "Inbound vocale H24",
    body: "Risponde a qualsiasi ora, parla italiano naturale, capisce intento e contesto. Dà informazioni su orari, servizi, prezzi, indicazioni. Fissa, sposta o cancella un appuntamento mentre parla.",
    badge: "Telefono in",
  },
  {
    icon: PhoneOutgoing,
    title: "Outbound vocale",
    body: "Chiama il cliente per confermare l'appuntamento del giorno dopo, ricordare un controllo periodico, riproporre uno slot dopo un no-show. Aggiorna l'agenda in tempo reale in base alla risposta.",
    badge: "Telefono out",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp inbound",
    body: "Risponde 24/7 ai messaggi dei clienti: propone slot, conferma servizio e durata, gestisce richieste di modifica o cancellazione. Multilingua e con tono adatto al tuo brand.",
    badge: "WhatsApp in",
  },
  {
    icon: Send,
    title: "WhatsApp outbound",
    body: "Promemoria automatici, conferme, follow-up, recall periodici, offerte mirate ai segmenti del CRM. Il cliente può rispondere e cambiare appuntamento in chat — senza chiamarti.",
    badge: "WhatsApp out",
  },
  {
    icon: Bell,
    title: "Promemoria multicanale",
    body: "Sequenze automatiche su WhatsApp, SMS, email e chiamata vocale. Logica configurabile per servizio: 24h prima, 2h prima, conferma con un tap.",
    badge: "Reminder",
  },
  {
    icon: CalendarClock,
    title: "Riprogrammazione automatica",
    body: "Se il cliente dice di non poter venire, l'IA propone subito un nuovo slot coerente con la durata del servizio e le disponibilità reali della sede. Tu vedi solo il risultato in agenda.",
    badge: "Reschedule",
  },
];

const AI_FLOW = [
  {
    n: "01",
    title: "Il cliente contatta",
    body: "Telefono, WhatsApp, SMS o webchat: qualsiasi canale, qualsiasi orario. Niente più chiamate perse fuori orario.",
  },
  {
    n: "02",
    title: "L'IA capisce e risponde",
    body: "Riconosce il cliente dal CRM, comprende la richiesta, dà informazioni precise sui tuoi servizi, orari, prezzi e disponibilità reali.",
  },
  {
    n: "03",
    title: "Fissa, sposta o cancella",
    body: "Propone gli slot giusti tenendo conto della durata del servizio, dello staff disponibile, della sede. Conferma immediata sull'agenda.",
  },
  {
    n: "04",
    title: "Promemoria e conferma",
    body: "Sequenza automatica di reminder. Se il cliente non risponde, l'IA chiama. Se chiede di spostare, riprogramma. Se non viene, riparte il recall.",
  },
];

const FAQ = [
  {
    q: "Come funziona esattamente la risposta IA al telefono?",
    a: "Quando un cliente chiama, l'IA risponde subito con una voce naturale (anche clonata dal tuo brand, se vuoi). Capisce italiano colloquiale, accede in tempo reale ad agenda, CRM e listino, e può dare informazioni, fissare un appuntamento, spostarlo o cancellarlo. Tu vedi tutto in agenda come se l'avesse scritto un operatore umano.",
  },
  {
    q: "E le chiamate in uscita per i promemoria?",
    a: "L'IA chiama automaticamente i clienti per conferme di appuntamento, promemoria di controlli ricorrenti, recall dopo no-show o per riempire slot liberi. Parla con il cliente, gestisce risposte, riprogramma e aggiorna l'agenda — senza che tu debba toccare il telefono.",
  },
  {
    q: "WhatsApp e SMS sono inclusi?",
    a: "Sì. La piattaforma gestisce conversazioni inbound e outbound su WhatsApp Business, SMS, webchat ed email. Il cliente può fissare, spostare o cancellare un appuntamento in chat, anche di notte. Promemoria e conferme partono in automatico secondo le regole che imposti.",
  },
  {
    q: "L'IA può fare errori sull'agenda?",
    a: "L'IA opera dentro regole che imposti tu: durata servizi, staff abilitato, sede, buffer tra appuntamenti, vincoli orari. Tutte le operazioni sono tracciate e revocabili dal pannello in un clic. Per i casi delicati può chiedere conferma umana prima di confermare.",
  },
  {
    q: "Posso usare solo il sito, senza IA né appuntamenti?",
    a: "Sì. Bizery è modulare: parti dal piano Vetrina con sito + listino digitale, e quando vuoi accendi appuntamenti, CRM, analytics, multi-sede o centralino IA senza dover rifare nulla.",
  },
  {
    q: "Quanto tempo serve per andare online?",
    a: "Per il piano Vetrina, 3–5 settimane dalla prima chiamata al go-live. Per Operatività 4–6 settimane. Il modulo IA (Autopilota) richiede 2–3 settimane in più per training su servizi, FAQ e voce.",
  },
  {
    q: "Il contratto è annuale?",
    a: "Sì, durata minima 12 mesi senza recesso anticipato. Puoi cambiare piano in qualsiasi momento — la variazione è attiva dal mese successivo.",
  },
  {
    q: "Cosa è incluso nel canone?",
    a: "Hosting, dominio (se gestito da noi), SSL, backup, aggiornamenti tecnici, tutte le nuove funzioni del prodotto e il supporto del nostro team. Per il modulo IA è incluso un pacchetto di minuti voce e messaggi mensili; oltre soglia si paga a consumo.",
  },
  {
    q: "Ci sono commissioni su prenotazioni o vendite?",
    a: "Zero. Bizery non trattiene nulla sulle tue prenotazioni o transazioni. Quello che incassi è tuo, integrale.",
  },
];

export async function BizeryHomePage() {
  const { testimonials, activeCount } = await getMarketingHomeData("services");

  // Hero stats: aggiungiamo il counter clienti reali solo se ce ne sono;
  // altrimenti teniamo le quattro metriche di prodotto già esistenti.
  const baseStats: [string, string][] = [
    ["24/7", "centralino IA"],
    ["0", "chiamate perse"],
    ["−68%", "no-show medio"],
    ["0", "commissioni"],
  ];
  const heroStats: [string, string][] =
    activeCount > 0
      ? [
          [`+${activeCount}`, "aziende attive"],
          ["24/7", "centralino IA"],
          ["0", "chiamate perse"],
          ["0", "commissioni"],
        ]
      : baseStats;

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
          <div className="grid items-end gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
            <div className="menuary-fade-up">
              <p className="menuary-section-label">Piattaforma operativa con IA integrata</p>
              <h1
                className="mt-7 text-[clamp(2.8rem,7vw,6.2rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Il sistema operativo
                <br />
                della tua azienda.
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  Sito, agenda, IA al telefono.
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-[17px] leading-[1.75] text-[var(--menuary-muted)]">
                Bizery unisce sito su misura, agenda, CRM e un centralino IA
                che risponde 24/7 a telefono e WhatsApp: fissa, sposta e cancella
                appuntamenti, manda promemoria e conferme — al posto tuo.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Link href="/contatti" className="menuary-button menuary-button-accent">
                  Richiedi una proposta
                </Link>
                <Link href="#ia" className="menuary-link">
                  Scopri l&apos;IA
                  <ArrowUpRight size={16} strokeWidth={1.6} />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                <span className="inline-flex items-center gap-2">
                  <Clock size={14} strokeWidth={1.7} className="text-[var(--menuary-sage)]" />
                  Risposta 24/7
                </span>
                <span className="inline-flex items-center gap-2">
                  <PhoneCall size={14} strokeWidth={1.7} className="text-[var(--menuary-copper)]" />
                  Centralino IA
                </span>
                <span className="inline-flex items-center gap-2">
                  <MessageCircle size={14} strokeWidth={1.7} className="text-[var(--menuary-sage)]" />
                  WhatsApp in & out
                </span>
              </div>
            </div>

            {/* Hero image */}
            <figure className="menuary-fade-up menuary-fade-up-d2 relative">
              <div className="menuary-photo aspect-[4/5] w-full">
                <Image
                  src={HERO_IMAGE}
                  alt="Team in ufficio in una azienda di servizi"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 44vw"
                  className="object-cover"
                />
              </div>

              {/* Floating: chiamata IA in corso */}
              <div
                aria-hidden
                className="absolute -bottom-6 -left-6 hidden w-[18.5rem] rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)]/95 p-4 backdrop-blur-md shadow-[0_24px_60px_-20px_rgba(15,23,42,0.22)] sm:block"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
                    <PhoneCall size={16} strokeWidth={1.8} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--menuary-muted)] font-bold">
                      IA al telefono · live
                    </p>
                    <p className="text-sm font-semibold truncate">
                      Maria sposta a giovedì 14:30
                    </p>
                  </div>
                  <span className="relative inline-flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--menuary-sage)] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--menuary-sage)]" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--menuary-muted)]">
                  <Bot size={12} strokeWidth={1.8} className="text-[var(--menuary-copper)]" />
                  Agenda aggiornata in automatico
                </div>
              </div>

              {/* Floating: WhatsApp outbound */}
              <div
                aria-hidden
                className="absolute -top-5 right-3 hidden w-[15rem] rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)]/95 px-4 py-3 backdrop-blur-md shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] md:block"
              >
                <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--menuary-muted)] font-bold inline-flex items-center gap-1.5">
                  <MessageCircle size={11} strokeWidth={2} className="text-[var(--menuary-sage)]" />
                  Promemoria inviato
                </p>
                <p className="mt-1.5 text-[13px] leading-snug">
                  &laquo;Ciao Luca, ti aspettiamo domani alle 10:00. Confermi?&raquo;
                </p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--menuary-sage)] font-bold">
                  Risposta ricevuta · confermato
                </p>
              </div>

              <figcaption className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
                <span>— Studio Bizery</span>
                <span>Milano · Italia</span>
              </figcaption>
            </figure>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:gap-14">
            {heroStats.map(([n, l]) => (
              <div key={l} className="menuary-stat">
                <p
                  className="text-4xl font-medium"
                  style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                >
                  {n}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">{l}</p>
              </div>
            ))}
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
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--menuary-copper)] font-bold inline-flex items-center gap-2">
                <Sparkles size={12} strokeWidth={2} />
                Autopilota · Modulo IA
              </p>
              <h2
                className="mt-6 text-[clamp(2.4rem,5.4vw,4.8rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Un&apos;assistente che
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  non stacca mai.
                </span>
              </h2>
            </div>
            <p className="max-w-md text-[16px] leading-[1.8] text-[var(--menuary-paper)]/70 lg:justify-self-end lg:text-right">
              Risponde al telefono, scrive su WhatsApp, manda promemoria,
              chiama per confermare, riprogramma se serve. Lavora dentro la
              tua agenda, parla il linguaggio della tua azienda, opera 24 ore
              su 24 — anche quando tu non puoi.
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
                  <p className="mt-3 text-[14px] leading-[1.7] text-[var(--menuary-paper)]/65">
                    {c.body}
                  </p>
                </article>
              );
            })}
          </div>

          {/* Flow */}
          <div className="mt-20 lg:mt-24 grid gap-10 lg:grid-cols-4 lg:gap-6">
            {AI_FLOW.map((step) => (
              <div key={step.n} className="relative">
                <p
                  className="text-5xl font-medium text-[var(--menuary-copper)]"
                  style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                >
                  {step.n}
                </p>
                <h4 className="mt-4 text-[1.05rem] font-semibold text-[var(--menuary-paper)]">
                  {step.title}
                </h4>
                <p className="mt-2 text-[14px] leading-[1.7] text-[var(--menuary-paper)]/60">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center gap-4">
            <Link href="/contatti" className="menuary-button menuary-button-accent">
              Voglio l&apos;IA per la mia azienda
            </Link>
            <Link href="/pricing" className="menuary-link menuary-link-light">
              Vedi il piano Autopilota
              <ArrowUpRight size={16} strokeWidth={1.6} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="moduli"
        className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]"
      >
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:items-end">
            <div>
              <p className="menuary-section-label">Dodici moduli, un solo prodotto</p>
              <h2
                className="mt-6 text-[clamp(2.4rem,5vw,4.4rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Dal sito al
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  centralino IA.
                </span>
              </h2>
            </div>
            <p className="max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:justify-self-end lg:text-right">
              Bizery copre l&apos;intera catena operativa di un&apos;azienda di servizi:
              dalla vetrina online alla gestione agenda, dal CRM al controllo costi,
              fino all&apos;assistente IA che risponde a telefono e WhatsApp.
              Stesso linguaggio, stesso database, stesso supporto.
            </p>
          </div>

          <div className="mt-14 grid gap-px border-[var(--menuary-line)] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <article
                  key={f.title}
                  className="menuary-feature-card"
                  data-tone={f.tone ?? "light"}
                >
                  <div className="menuary-feature-icon">
                    <Icon size={18} strokeWidth={1.6} />
                  </div>
                  <h3 className="text-[1.15rem] font-semibold leading-snug">{f.title}</h3>
                  <p className="text-[14px] leading-6">{f.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ── */}
      <section className="border-t border-[var(--menuary-line)]">
        <div className="menuary-container py-24 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="menuary-section-label justify-center">Offerta</p>
            <h2
              className="mt-6 text-[clamp(2.4rem,5vw,4.2rem)] font-medium leading-[1.05] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Parti dal sito giusto.
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                Aggiungi solo ciò che serve.
              </span>
            </h2>
            <p className="mt-6 text-[15px] leading-7 text-[var(--menuary-muted)]">
              Tre piani per aziende di ogni dimensione. Prezzi chiari, zero commissioni
              su prenotazioni e transazioni. L&apos;IA è inclusa nel piano Autopilota.
            </p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {PRICING_PLANS.map((plan) => (
              <article
                key={plan.slug}
                className={
                  "relative flex flex-col gap-5 border p-8 transition-colors " +
                  (plan.is_featured
                    ? "border-[var(--menuary-copper)] bg-[var(--menuary-porcelain)] lg:-translate-y-2"
                    : "border-[var(--menuary-line)] bg-[var(--menuary-paper)] hover:border-[var(--menuary-ink)]/30")
                }
              >
                {plan.is_featured && (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-[var(--menuary-copper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                    <Sparkles size={11} strokeWidth={2} />
                    Consigliato
                  </span>
                )}
                <div>
                  <h3
                    className="text-3xl font-medium tracking-[-0.02em]"
                    style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
                  >
                    {plan.marketing_name}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
                    {plan.tagline}
                  </p>
                </div>
                <div>
                  <span className="menuary-price-tag">
                    <span className="amount">€{plan.price_annual}</span>
                    <span className="unit">/mese</span>
                  </span>
                  <p className="mt-1 text-xs text-[var(--menuary-muted)]">
                    <span className="font-semibold text-[var(--menuary-sage)]">
                      Risparmio €{annualSaving(plan)}/anno
                    </span>{" "}con pagamento annuale
                  </p>
                </div>
                <ul className="space-y-2.5 text-[14px]">
                  {plan.marketing_items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--menuary-copper)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/contatti"
                  className={
                    "mt-auto inline-flex items-center justify-center gap-2 " +
                    (plan.is_featured
                      ? "menuary-button menuary-button-accent"
                      : "menuary-button menuary-button-light")
                  }
                >
                  {plan.cta_label ?? "Richiedi proposta"}
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
            Tutti i prezzi sono IVA esclusa · contratto annuale ·{" "}
            <Link href="/pricing" className="underline hover:text-[var(--menuary-ink)]">
              vedi tutte le funzioni
            </Link>
          </p>
        </div>
      </section>

      {/* ── COMPARISON: Bizery vs sito tradizionale ── */}
      <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container py-24 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 lg:items-center">
            <div>
              <p className="menuary-section-label">Perché Bizery</p>
              <h2
                className="mt-6 text-[clamp(2.2rem,4.4vw,3.8rem)] font-medium leading-[1.05] tracking-[-0.02em]"
                style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
              >
                Non è un sito.
                <br />
                <span className="italic text-[var(--menuary-copper)]">
                  È il sistema operativo
                  <br />
                  della tua azienda.
                </span>
              </h2>
              <p className="mt-6 text-[15px] leading-7 text-[var(--menuary-muted)]">
                Un sito fermo vale poco. Bizery collega vetrina, agenda e
                clienti — e ci mette sopra un&apos;IA che parla e scrive
                al posto tuo, 24 ore su 24.
              </p>
              <Link href="/contatti" className="mt-8 menuary-button menuary-button-dark inline-flex">
                Inizia ora
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { label: "Centralino IA telefono H24", bizery: true, old: false },
                { label: "WhatsApp & SMS automatici in/out", bizery: true, old: false },
                { label: "Chiamate outbound di promemoria", bizery: true, old: false },
                { label: "Riprogrammazione automatica", bizery: true, old: false },
                { label: "Agenda prenotazioni integrata", bizery: true, old: false },
                { label: "CRM clienti nativo", bizery: true, old: false },
                { label: "Analytics e report", bizery: true, old: false },
                { label: "Costi e margini per servizio", bizery: true, old: false },
                { label: "Multi-sede con un account", bizery: true, old: false },
                { label: "Zero commissioni", bizery: true, old: false },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 border border-[var(--menuary-line)] bg-[var(--menuary-paper)] px-5 py-3.5"
                >
                  <span className="text-[15px]">{row.label}</span>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--menuary-muted)]">
                      <span className={row.bizery ? "text-[var(--menuary-sage)]" : "text-[var(--menuary-muted)]"}>
                        {row.bizery ? <Check size={14} /> : <Plus size={14} className="rotate-45" />}
                      </span>
                      Bizery
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--menuary-muted)]">
                      <span className="text-[var(--menuary-muted)]">
                        <Plus size={14} className="rotate-45" />
                      </span>
                      Tradizionale
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL / TRUST ── */}
      {testimonials.length > 0 && (
        <section className="border-t border-[var(--menuary-line)]">
          <div className="menuary-container py-24 lg:py-28">
            <p className="menuary-section-label">Voci dei clienti · Google</p>
            <h2
              className="mt-6 text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.02em]"
              style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
            >
              Lo dicono loro,
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                non lo diciamo noi.
              </span>
            </h2>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.slice(0, 3).map((t) => (
                <figure
                  key={t.id}
                  className="flex flex-col gap-5 border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-7"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--menuary-copper)]/15 text-[var(--menuary-copper)]">
                    <Headphones size={16} strokeWidth={1.7} />
                  </span>
                  <blockquote className="text-[15px] leading-7 text-[var(--menuary-ink)]/85">
                    &laquo;{t.text}&raquo;
                  </blockquote>
                  <figcaption className="mt-auto border-t border-[var(--menuary-line)] pt-4 text-sm">
                    <p className="font-semibold text-[var(--menuary-ink)]">
                      {t.author}
                    </p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)] mt-1">
                      {t.tenantName}
                      {t.tenantCity ? ` · ${t.tenantCity}` : ""}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

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
                <details key={item.q} className="menuary-faq-item">
                  <summary>
                    {item.q}
                    <span className="menuary-faq-toggle" aria-hidden>
                      <Plus size={16} strokeWidth={1.8} />
                    </span>
                  </summary>
                  <p className="menuary-faq-answer">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        className="border-t border-[var(--menuary-line)]"
        style={{ background: "var(--menuary-ink)" }}
      >
        <div className="menuary-container py-24 text-center lg:py-28">
          <p
            className="text-xs uppercase tracking-[0.24em] text-[var(--menuary-paper)]/40 font-bold"
          >
            Inizia oggi
          </p>
          <h2
            className="mt-6 text-[clamp(2.6rem,6vw,5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--menuary-paper)]"
            style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}
          >
            La tua azienda merita
            <br />
            <span className="italic text-[var(--menuary-copper)]">
              un&apos;assistente che non dorme.
            </span>
          </h2>
          <p className="mt-8 text-[16px] leading-7 text-[var(--menuary-paper)]/60 max-w-md mx-auto">
            Prima chiamata gratuita. Proposta su misura in 48 ore.
            Nessun vincolo prima di firmare.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contatti" className="menuary-button menuary-button-accent">
              Richiedi una proposta
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
