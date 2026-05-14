import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  CalendarCheck,
  ChefHat,
  Calculator,
  Phone,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Users,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ============================================================
   FEATURES
   ============================================================ */

const FEATURES: {
  icon: LucideIcon;
  title: string;
  body: string;
  tone?: "light" | "dark";
  soon?: boolean;
}[] = [
  {
    icon: Wand2,
    title: "Sito su misura",
    body:
      "Tipografia, fotografia, colori e voce costruiti sul tuo locale. Niente template, niente scenografia di sistema.",
  },
  {
    icon: BookOpen,
    title: "Menu digitale",
    body:
      "Piatti, prezzi, allergeni, varianti, disponibilità in un editor pensato per la sala. Aggiorni in due tocchi, online in un secondo.",
  },
  {
    icon: CalendarCheck,
    title: "Prenotazioni",
    body:
      "Richieste raccolte per data e turno, conferme automatiche, calendario di sala, reminder WhatsApp. Una tela sola per tutta la settimana.",
    tone: "dark",
  },
  {
    icon: ShoppingBag,
    title: "Ordini sala & asporto",
    body:
      "QR sul tavolo, comande in cucina, ricevuta al cliente. Niente carta straccia, niente errori in copertura piena.",
  },
  {
    icon: Truck,
    title: "Delivery integrato",
    body:
      "Zone di consegna, slot orari, gestione rider, integrazione con i corrieri principali. Asporto e delivery dalla stessa coda.",
  },
  {
    icon: Boxes,
    title: "Magazzino",
    body:
      "Ingredienti, scorte, fornitori, alert sotto soglia. Il magazzino scende quando un piatto esce in cucina — automaticamente.",
    tone: "dark",
  },
  {
    icon: Calculator,
    title: "Food cost",
    body:
      "Ricette, costo per piatto, margine in tempo reale. Vedi quanto guadagni davvero — prima di mettere il prezzo in carta.",
  },
  {
    icon: Users,
    title: "CRM clienti",
    body:
      "Storico ordini, preferenze, allergeni, ricorrenze. Il cliente entra e tu sai già cosa beve e dove ama sedersi.",
  },
  {
    icon: Phone,
    title: "IA al telefono",
    body:
      "Risponde 24/7 con la voce del locale: prende prenotazioni, accetta ordini, suggerisce piatti. Lo staff resta in sala.",
    soon: true,
    tone: "dark",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="prodotto"
      className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]"
    >
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 lg:items-end">
          <div>
            <p className="menuary-section-label">Nove moduli, un solo prodotto</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.4rem,5vw,4.4rem)]">
              Dal sito al
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                food cost in cucina.
              </span>
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:justify-self-end lg:text-right">
            Menuary copre l&apos;intera catena operativa del ristorante: dalla
            vetrina online al magazzino, dal CRM clienti all&apos;assistente IA
            che risponde al telefono. Stesso linguaggio, stesso database, stesso
            supporto.
          </p>
        </div>

        <div className="mt-14 grid gap-px border-[var(--menuary-line)] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                data-tone={f.tone === "dark" ? "dark" : undefined}
                className="menuary-feature-card relative"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {f.soon && (
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-[var(--menuary-gold)]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--menuary-gold)]">
                    <Sparkles size={10} strokeWidth={2} />
                    Presto
                  </span>
                )}
                <span className="menuary-feature-icon">
                  <Icon size={20} strokeWidth={1.7} />
                </span>
                <h3 className="menuary-display text-2xl">{f.title}</h3>
                <p className="text-[15px] leading-7 text-[var(--menuary-muted)]">
                  {f.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PRODUCT LEVELS — "come vuoi usare Menuary?"
   ============================================================ */

const PRODUCT_LEVELS: {
  index: string;
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
}[] = [
  {
    index: "01",
    kicker: "Vetrina",
    title: "Solo il sito",
    body:
      "Un sito personalizzato con menu digitale aggiornabile. La forma minima: identità online, leggibile, sempre fresca.",
    bullets: ["Sito su misura", "Menu digitale", "Contatti, foto, recensioni"],
  },
  {
    index: "02",
    kicker: "Operatività",
    title: "Sito + gestionale",
    body:
      "Tutto quello che ti serve per far girare la sala: prenotazioni, ordini, delivery, magazzino, food cost, CRM e analytics.",
    bullets: [
      "Tutto della Vetrina",
      "Prenotazioni · ordini · delivery",
      "Magazzino, food cost, CRM",
    ],
  },
  {
    index: "03",
    kicker: "Autopilota",
    title: "Gestionale + IA",
    body:
      "L'assistente IA risponde al telefono con la voce del locale: prende prenotazioni, accetta ordini, suggerisce piatti. Lo staff resta dove serve.",
    bullets: [
      "Tutto dell'Operatività",
      "Risponde alle chiamate 24/7",
      "Prenotazioni e ordini in autonomia",
    ],
    // soon flag handled in section
  },
];

export function ProductLevelsSection() {
  return (
    <section
      id="livelli"
      className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]"
    >
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="menuary-section-label">Tre modi di usarlo</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.4rem,5vw,4.4rem)]">
              Quanto vuoi che
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                Menuary lavori per te?
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
            Una piattaforma, tre livelli di profondità. Cominci dalla vetrina e
            spegni o accendi i moduli quando ti servono — senza rifare il sito.
          </p>
        </div>

        <div className="mt-14 grid gap-px sm:gap-6 lg:grid-cols-3">
          {PRODUCT_LEVELS.map((lvl, i) => {
            const isAI = i === 2;
            return (
              <article
                key={lvl.index}
                className={
                  "relative flex flex-col gap-6 border bg-[var(--menuary-porcelain)] p-8 sm:p-10 transition-colors " +
                  (isAI
                    ? "border-[var(--menuary-gold)] bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                    : "border-[var(--menuary-line)] hover:border-[var(--menuary-ink)]/40")
                }
              >
                {isAI && (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-[var(--menuary-gold)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--menuary-ink)]">
                    <Sparkles size={11} strokeWidth={2} />
                    Presto disponibile
                  </span>
                )}

                <div className="flex items-baseline justify-between">
                  <p
                    className={
                      "menuary-index-lg " +
                      (isAI ? "!text-[var(--menuary-gold)]" : "")
                    }
                  >
                    {lvl.index}
                  </p>
                  <span
                    className={
                      "text-xs uppercase tracking-[0.22em] " +
                      (isAI ? "text-[var(--menuary-gold)]" : "text-[var(--menuary-copper)]")
                    }
                  >
                    {lvl.kicker}
                  </span>
                </div>

                <div>
                  <h3 className="menuary-display text-3xl">{lvl.title}</h3>
                  <p
                    className={
                      "mt-4 text-[15px] leading-7 " +
                      (isAI ? "text-white/70" : "text-[var(--menuary-muted)]")
                    }
                  >
                    {lvl.body}
                  </p>
                </div>

                <ul className="mt-auto space-y-2.5 text-[15px]">
                  {lvl.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span
                        className={
                          "mt-[0.55rem] inline-block h-px w-3 shrink-0 " +
                          (isAI
                            ? "bg-[var(--menuary-gold)]"
                            : "bg-[var(--menuary-copper)]")
                        }
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   AI PHONE RECEPTIONIST — coming soon showcase
   ============================================================ */

export function AIPhoneSection() {
  return (
    <section
      id="ia"
      className="relative overflow-hidden border-t border-[var(--menuary-line)] bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
    >
      {/* decorative grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,250,242,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,250,242,1) 1px, transparent 1px)",
          backgroundSize: "4rem 4rem",
          maskImage: "radial-gradient(circle at center, black 0%, transparent 70%)",
        }}
      />

      <div className="menuary-container relative py-24 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-20 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--menuary-gold)]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--menuary-gold)]">
              <Sparkles size={11} strokeWidth={2} />
              In arrivo · 2026
            </span>
            <h2 className="menuary-display mt-6 text-[clamp(2.4rem,5.2vw,4.8rem)]">
              Un&apos;assistente che risponde
              <br />
              <span className="italic text-[var(--menuary-gold)]">
                quando tu sei in sala.
              </span>
            </h2>
            <p className="mt-7 max-w-md text-[16px] leading-[1.75] text-white/70">
              L&apos;IA vocale di Menuary risponde al telefono con la voce e il
              tono del locale. Prende prenotazioni, accetta ordini d&apos;asporto,
              suggerisce piatti del giorno, gestisce le richieste fuori orario —
              e ti lascia il riepilogo nel pannello quando entri il mattino dopo.
            </p>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                { t: "Voce e tono del locale", b: "Cloning vocale opzionale" },
                { t: "Prenotazioni & ordini", b: "Scrive direttamente in agenda" },
                { t: "24 / 7 senza pause", b: "Notti, weekend, copertura piena" },
                { t: "Multilingua nativa", b: "IT, EN, FR, ES, DE" },
              ].map((it) => (
                <li
                  key={it.t}
                  className="border-t border-white/15 pt-4 text-[15px] leading-6"
                >
                  <p className="font-semibold text-[var(--menuary-paper)]">
                    {it.t}
                  </p>
                  <p className="mt-1 text-white/55">{it.b}</p>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link
                href="/contatti"
                className="menuary-button menuary-button-accent"
              >
                Entra nella lista d&apos;attesa
              </Link>
              <Link href="/pricing" className="menuary-link menuary-link-light">
                Vedi i piani
                <ArrowUpRight size={16} strokeWidth={1.6} />
              </Link>
            </div>
          </div>

          {/* Call transcript mockup */}
          <div className="relative">
            <div className="rounded-[1.5rem] border border-white/12 bg-white/[0.04] p-5 sm:p-7 backdrop-blur-sm shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--menuary-gold)]/15 text-[var(--menuary-gold)]">
                    <Phone size={18} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                      Chiamata in corso
                    </p>
                    <p className="font-semibold mt-0.5">+39 080 ··· 4127</p>
                  </div>
                </div>
                <span className="text-xs text-white/55 tabular-nums">02:14</span>
              </div>

              <div className="mt-5 space-y-4 text-[14px] leading-6">
                <div className="flex gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--menuary-gold)]/20 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--menuary-gold)]">
                    IA
                  </span>
                  <p className="text-white/85">
                    Ristorante Be Pork, buonasera. Come posso aiutarla?
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                    Cli
                  </span>
                  <p className="text-white/65">
                    Vorrei prenotare per due persone, sabato alle 21.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--menuary-gold)]/20 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--menuary-gold)]">
                    IA
                  </span>
                  <p className="text-white/85">
                    Sabato alle 21, tavolo per due. Confermo a nome di…?
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                    Cli
                  </span>
                  <p className="text-white/65">Bianchi. C&apos;è qualcosa di vegano?</p>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--menuary-gold)]/20 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--menuary-gold)]">
                    IA
                  </span>
                  <p className="text-white/85">
                    Sì: orecchiette ai broccoli, tagliata vegetale e cheesecake al
                    cocco. Le segno anche la nota allergeni?
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-[var(--menuary-gold)]/40 bg-[var(--menuary-gold)]/10 px-4 py-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--menuary-gold)]">
                    Prenotazione creata
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Bianchi · sab 22, 21:00 · 2 cop. · note vegano
                  </p>
                </div>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--menuary-gold)] text-[var(--menuary-ink)]">
                  <CalendarCheck size={16} strokeWidth={2} />
                </span>
              </div>
            </div>

            {/* floating status pill */}
            <div className="absolute -top-4 -right-4 hidden items-center gap-2 rounded-full border border-white/15 bg-[var(--menuary-ink)] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/80 sm:inline-flex">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--menuary-gold)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--menuary-gold)]" />
              </span>
              live
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PRODUCT PREVIEW (visual mockup)
   ============================================================ */

export function ProductPreviewSection() {
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:items-center">
          <div>
            <p className="menuary-section-label">Il prodotto</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
              Un menu che cambia
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                quando cambia la sala.
              </span>
            </h2>
            <p className="mt-7 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)]">
              L&apos;editor di Menuary è pensato per chi lavora in cucina, non
              per agenzie. Aggiungi un piatto, fissi un prezzo, segni un
              allergene: pubblicato sul sito senza passare per nessuno.
            </p>

            <ul className="mt-10 space-y-4">
              {[
                "Modifiche live, senza repubblicazione",
                "Allergeni, varianti e disponibilità per piatto",
                "Versione QR e stampabile sempre coerenti",
                "Più sale, più menu, una sola console",
              ].map((item, i) => (
                <li key={item} className="flex items-start gap-4">
                  <span className="menuary-index pt-1 shrink-0">
                    — {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[15px] leading-7">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="menuary-mockup-window rounded-[1.4rem]">
              <div className="menuary-mockup-bar">
                <i />
                <i />
                <i />
                <span>menuary · carta</span>
              </div>
              <div className="px-2 py-2 sm:px-3">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--menuary-muted)]">
                      Primi
                    </p>
                    <p className="menuary-display text-2xl mt-1">
                      Pasta fresca del giorno
                    </p>
                  </div>
                  <span className="menuary-mockup-tag">in carta</span>
                </div>

                {[
                  {
                    name: "Orecchiette con cime di rapa",
                    desc: "Acciuga di Cetara · pane fritto",
                    price: "€ 14",
                  },
                  {
                    name: "Tagliatelle al ragù di brasato",
                    desc: "Cottura 7 ore · ricotta dura grattugiata",
                    price: "€ 16",
                  },
                  {
                    name: "Spaghettone al pomodoro",
                    desc: "Datterino giallo · basilico · burrata",
                    price: "€ 13",
                  },
                ].map((row) => (
                  <div key={row.name} className="menuary-mockup-row">
                    <div>
                      <p className="name">{row.name}</p>
                      <p className="desc">{row.desc}</p>
                    </div>
                    <p className="price">{row.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* small floating phone */}
            <div className="absolute -bottom-8 -right-2 hidden w-[14rem] rounded-[1.6rem] border border-[var(--menuary-line)] bg-[var(--menuary-ink)] p-3 text-[var(--menuary-paper)] shadow-[0_30px_60px_-20px_rgba(24,35,31,0.45)] sm:block">
              <div className="mx-auto mt-1 h-1 w-12 rounded-full bg-white/20" />
              <div className="mt-3 rounded-[1.1rem] bg-white/[0.06] p-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                  Tavolo 6
                </p>
                <p className="mt-1 text-sm font-semibold">
                  2 × Orecchiette · 1 × Spaghettone
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] text-white/60">
                  <span>in cucina</span>
                  <span className="text-[var(--menuary-gold)] font-bold">
                    24&apos;
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {["Cucina", "Sala", "Asporto"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/[0.06] py-1 text-center text-[10px] uppercase tracking-[0.16em] text-white/65"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   LOGOS MARQUEE
   ============================================================ */

const LOGOS = [
  "Be Pork",
  "Faak",
  "La Trattoria",
  "Don Carlo",
  "Bistrot 7",
  "Cucina Vera",
  "Sale & Pepe",
  "L'Osteria",
];

export function LogosStripSection() {
  return (
    <section className="border-y border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-10 lg:py-14">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-12">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--menuary-muted)] sm:max-w-[12rem] sm:text-right">
            Ristoranti che hanno scelto Menuary
          </p>
          <div className="menuary-marquee flex-1">
            <div className="menuary-marquee-track">
              {[...LOGOS, ...LOGOS].map((label, i) => (
                <span
                  key={`${label}-${i}`}
                  className="font-[var(--font-menuary-display)] text-[clamp(1.4rem,2.4vw,2rem)] italic text-[var(--menuary-ink)]/70"
                  style={{ fontFamily: "var(--font-menuary-display), serif" }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TESTIMONIALS
   ============================================================ */

const TESTIMONIALS: {
  quote: string;
  name: string;
  role: string;
  rating?: number;
}[] = [
  {
    quote:
      "Avevamo un sito statico aggiornato due volte l’anno. Con Menuary il menu vive ogni settimana — e i clienti se ne accorgono.",
    name: "Andrea Lippolis",
    role: "Be Pork · Bari",
    rating: 5,
  },
  {
    quote:
      "La cosa che ci ha convinti è il tono. Sembra un sito fatto da chi conosce la sala, non un template per ristoranti.",
    name: "Viviana Varese",
    role: "Faak · Milano",
    rating: 5,
  },
  {
    quote:
      "Prenotazioni e ordini in un unico posto. Lo staff è entrato in confidenza in tre giorni, senza formazione.",
    name: "Marco De Santis",
    role: "Bistrot 7 · Lecce",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="menuary-section-label">Voci dei locali</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
              Lo dicono meglio loro.
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--menuary-muted)]">
            <div className="flex gap-0.5 text-[var(--menuary-copper)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <span>
              <strong className="text-[var(--menuary-ink)]">4.9 / 5</strong>{" "}
              soddisfazione media
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-px sm:gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="menuary-testimonial">
              <div className="flex gap-0.5 text-[var(--menuary-copper)]">
                {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="menuary-testimonial-quote">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-[var(--menuary-line)] pt-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--menuary-ink)] text-[var(--menuary-paper)] font-bold text-sm">
                  {t.name
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                    {t.role}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FAQ
   ============================================================ */

type FAQItem = { q: string; a: string };

export function FAQSection({
  items,
  title,
  kicker = "Domande frequenti",
}: {
  items: FAQItem[];
  title?: string;
  kicker?: string;
}) {
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="menuary-section-label">{kicker}</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.4vw,3.6rem)]">
              {title ?? "Le risposte alle cose che ci chiedete sempre."}
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
              Non hai trovato quello che cercavi?{" "}
              <Link href="/contatti" className="menuary-link">
                Scrivici
                <ArrowUpRight size={14} strokeWidth={1.6} />
              </Link>
            </p>
          </div>
          <div>
            {items.map((f) => (
              <details key={f.q} className="menuary-faq-item group">
                <summary>
                  <span>{f.q}</span>
                  <span className="menuary-faq-toggle" aria-hidden>
                    <Plus size={16} strokeWidth={1.8} />
                  </span>
                </summary>
                <div className="menuary-faq-answer">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PRICING TEASER
   ============================================================ */

const PRICING_TEASER: {
  name: string;
  tagline: string;
  price: string;
  setup: string;
  items: string[];
  featured?: boolean;
}[] = [
  {
    name: "Vetrina",
    tagline: "Solo il sito",
    price: "39",
    setup: "setup da € 690",
    items: [
      "Sito su misura",
      "Menu digitale aggiornabile",
      "Recensioni, foto, contatti",
    ],
  },
  {
    name: "Operatività",
    tagline: "Sito + gestionale",
    price: "129",
    setup: "setup da € 1.490",
    featured: true,
    items: [
      "Tutto di Vetrina",
      "Prenotazioni · ordini · delivery",
      "Magazzino, food cost, CRM",
      "Pannello staff & analytics",
    ],
  },
  {
    name: "Autopilota",
    tagline: "Gestionale + IA · 2026",
    price: "—",
    setup: "lista d'attesa",
    items: [
      "Tutto di Operatività",
      "IA al telefono 24/7",
      "Prenotazioni e ordini autonomi",
      "Multilingua nativa",
    ],
  },
];

export function PricingTeaserSection() {
  return (
    <section
      id="prezzi"
      className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]"
    >
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="menuary-section-label">Offerta</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
              Parti dal piano giusto.
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                Cresci quando ti serve.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
            Nessun vincolo annuale, nessuna fee nascosta. Cambi piano o disdici
            con un mese di preavviso.
          </p>
        </div>

        <div className="mt-14 grid gap-px sm:gap-6 md:grid-cols-3">
          {PRICING_TEASER.map((p) => (
            <article
              key={p.name}
              className={
                "relative flex flex-col gap-5 border bg-[var(--menuary-porcelain)] p-8 transition-colors " +
                (p.featured
                  ? "border-[var(--menuary-copper)] bg-[var(--menuary-paper)]"
                  : "border-[var(--menuary-line)] hover:border-[var(--menuary-ink)]/40")
              }
            >
              {p.featured && (
                <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-[var(--menuary-copper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white">
                  <Sparkles size={11} strokeWidth={2} />
                  Consigliato
                </span>
              )}

              <div>
                <h3 className="menuary-display text-3xl">{p.name}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
                  {p.tagline}
                </p>
              </div>

              <div>
                <span className="menuary-price-tag">
                  {p.price === "—" ? (
                    <span className="amount">Custom</span>
                  ) : (
                    <>
                      <span className="amount">€{p.price}</span>
                      <span className="unit">/mese</span>
                    </>
                  )}
                </span>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                  {p.setup}
                </p>
              </div>

              <ul className="space-y-2.5 text-[15px]">
                {p.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-[0.55rem] inline-block h-px w-3 shrink-0 bg-[var(--menuary-copper)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/pricing"
                className={
                  "mt-2 " +
                  (p.featured
                    ? "menuary-button menuary-button-dark"
                    : "menuary-link")
                }
              >
                Scopri il piano
                {!p.featured && <ArrowUpRight size={16} strokeWidth={1.6} />}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PROCESS / HOW IT WORKS
   ============================================================ */

const PROCESS_STEPS: {
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    title: "Ascolto",
    body: "Cucina, sala, clientela, tono di voce. Partiamo dal locale, mai dal sito.",
    icon: ChefHat,
  },
  {
    title: "Disegno",
    body: "Identità visiva, struttura, contenuti. Una proposta concreta, non un mood board.",
    icon: Wand2,
  },
  {
    title: "Costruzione",
    body: "Sito, menu, prenotazioni, ordini. Tutto allineato al tuo modo di lavorare.",
    icon: BookOpen,
  },
  {
    title: "Vita",
    body: "Online, aggiornamenti continui, miglioramenti e supporto nel tempo.",
    icon: Sparkles,
  },
];

export function ProcessSection() {
  return (
    <section
      id="gestione"
      className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]"
    >
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="menuary-section-label">Come lavoriamo</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
              Quattro passi,
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                lenti dove devono esserlo.
              </span>
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
              Niente fretta. Niente discovery di tre mesi. Un processo
              dimensionato al tuo locale, dall&apos;ascolto al go-live.
            </p>
          </div>

          <ol className="grid gap-px border-t border-[var(--menuary-line)] sm:grid-cols-2">
            {PROCESS_STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li
                  key={s.title}
                  className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-8 sm:border-l sm:first:border-l-0 sm:[&:nth-child(2)]:border-l"
                >
                  <div className="flex items-center justify-between">
                    <p className="menuary-index-lg">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <span className="menuary-feature-icon">
                      <Icon size={18} strokeWidth={1.7} />
                    </span>
                  </div>
                  <h3 className="menuary-display mt-6 text-2xl">{s.title}</h3>
                  <p className="mt-3 max-w-xs text-[15px] leading-7 text-[var(--menuary-muted)]">
                    {s.body}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   FINAL CTA
   ============================================================ */

export function FinalCTASection() {
  return (
    <section className="bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
      <div className="menuary-container py-24 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-20">
          <div>
            <p
              className="menuary-section-label"
              style={{ color: "rgba(255,250,242,0.55)" }}
            >
              Iniziamo
            </p>
            <h2 className="menuary-display mt-6 text-[clamp(2.6rem,5.2vw,5rem)]">
              Raccontaci il tuo ristorante.
              <br />
              <span className="italic text-[var(--menuary-gold)]">
                Ti rispondiamo con un&apos;idea concreta.
              </span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-white/65">
              Prima chiamata gratuita di 30 minuti. Capiamo se ha senso lavorare
              insieme — e ti diamo comunque qualche consiglio utile.
            </p>
          </div>
          <div className="flex flex-col items-start gap-5">
            <Link
              href="/contatti"
              className="menuary-button menuary-button-accent"
            >
              Prenota la prima chiamata
            </Link>
            <a
              href="mailto:hello@menuary.it"
              className="menuary-link menuary-link-light"
            >
              hello@menuary.it
              <ArrowUpRight size={16} strokeWidth={1.6} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   AUDIENCES
   ============================================================ */

const AUDIENCES = [
  {
    title: "Fine dining",
    body:
      "Una presenza misurata, fotografica, costruita per accompagnare la scelta del cliente prima ancora che varchi la porta.",
    image:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Pizzerie & trattorie",
    body:
      "Menu leggibile, contatti chiari, ordini rapidi. Contenuti concreti per chi decide in trenta secondi sul marciapiede.",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Cocktail bar & bistrot",
    body:
      "Atmosfera, carta beverage, eventi, aggiornamenti stagionali. Sempre in primo piano quello che sta succedendo stasera.",
    image:
      "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80",
  },
];

export function AudiencesSection() {
  return (
    <section
      id="ristoranti"
      className="bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
    >
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p
              className="menuary-section-label"
              style={{ color: "rgba(255,250,242,0.55)" }}
            >
              Per chi lavoriamo
            </p>
            <h2 className="menuary-display mt-6 text-[clamp(2.4rem,5vw,4.6rem)]">
              Dal fine dining al bistrot,
              <br />
              <span className="italic text-[var(--menuary-gold)]">
                ogni locale sembra se stesso.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-white/65">
            Non lavoriamo a temi. Lavoriamo a ristoranti — uno alla volta, con
            il tempo di capire cosa rende ognuno diverso dagli altri.
          </p>
        </div>

        <div className="mt-16 grid gap-px border-t border-white/12 sm:grid-cols-3">
          {AUDIENCES.map((a) => (
            <article
              key={a.title}
              className="border-t border-white/12 pt-8 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0 sm:first:border-l-0 sm:first:pl-0"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <Image
                  src={a.image}
                  alt={a.title}
                  width={900}
                  height={1125}
                  className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                />
              </div>
              <h3 className="menuary-display mt-6 text-2xl">{a.title}</h3>
              <p className="mt-3 max-w-xs text-[15px] leading-7 text-white/65">
                {a.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   DEMOS
   ============================================================ */

const DEMOS = [
  {
    href: "https://demo.menuary.it/bepork-demo",
    label: "Be Pork · Bari",
    tag: "Trattoria contemporanea",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  },
  {
    href: "https://demo.menuary.it/faak-demo",
    label: "Faak · Bari",
    tag: "Bistrot urban",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80",
  },
];

export function DemosSection() {
  return (
    <section className="border-t border-[var(--menuary-line)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="menuary-section-label">Esempi recenti</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.4vw,4rem)]">
              Due locali, due voci diverse.
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
            Esplora due ristoranti reali costruiti su Menuary. Stesso motore,
            identità opposte.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {DEMOS.map((d) => (
            <a
              key={d.href}
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block cursor-pointer"
            >
              <div className="menuary-photo aspect-[5/4] w-full">
                <Image
                  src={d.image}
                  alt={d.label}
                  width={1100}
                  height={880}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
                    {d.tag}
                  </p>
                  <p className="menuary-display mt-2 text-2xl">{d.label}</p>
                </div>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--menuary-line)] transition-colors group-hover:border-[var(--menuary-ink)] group-hover:bg-[var(--menuary-ink)] group-hover:text-[var(--menuary-paper)]">
                  <ArrowUpRight size={18} strokeWidth={1.6} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

