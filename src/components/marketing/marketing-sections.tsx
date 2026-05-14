import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  ChefHat,
  LineChart,
  Plus,
  QrCode,
  ShoppingBag,
  Sparkles,
  Star,
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
}[] = [
  {
    icon: BookOpen,
    title: "Menu digitale, sempre vivo",
    body:
      "Piatti, prezzi, allergeni e disponibilità in un editor pensato per la sala. Aggiorni in due tocchi, online in un secondo.",
  },
  {
    icon: CalendarCheck,
    title: "Prenotazioni dal sito",
    body:
      "Richieste raccolte in un solo posto, ordinate per data e turno. Il cliente prenota in trenta secondi, tu rispondi quando vuoi.",
  },
  {
    icon: ShoppingBag,
    title: "Ordini al tavolo e asporto",
    body:
      "QR sul tavolo, ordine in cucina, ricevuta al cliente. Niente comande perse, niente errori in copertura piena.",
    tone: "dark",
  },
  {
    icon: QrCode,
    title: "QR menu e carte di sala",
    body:
      "Una sola fonte di verità per il menu. Versione QR, versione stampata, versione mobile: cambiano insieme.",
  },
  {
    icon: Wand2,
    title: "Identità su misura",
    body:
      "Tipografia, fotografia, colori e voce costruiti sul tuo locale. Niente template, niente scenografia di sistema.",
  },
  {
    icon: LineChart,
    title: "Numeri leggibili",
    body:
      "Pagine viste, ordini, prenotazioni, conversioni. Una dashboard che dice cosa funziona — e cosa cambiare.",
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
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:items-end">
          <div>
            <p className="menuary-section-label">Tutto quello che serve</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.4rem,5vw,4.4rem)]">
              Un solo strumento.
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                Tutta la sala digitale.
              </span>
            </h2>
          </div>
          <p className="max-w-md text-[15px] leading-7 text-[var(--menuary-muted)] lg:justify-self-end lg:text-right">
            Menuary mette in un solo prodotto quello che oggi chiedi a tre o
            quattro fornitori diversi. Stesso linguaggio, stesso supporto,
            stesso conto a fine mese.
          </p>
        </div>

        <div className="mt-14 grid gap-px border-[var(--menuary-line)] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                data-tone={f.tone === "dark" ? "dark" : undefined}
                className="menuary-feature-card"
                style={{ animationDelay: `${i * 80}ms` }}
              >
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

const PRICING_TEASER = [
  {
    name: "Presenza",
    tagline: "Sito su misura",
    price: "39",
    setup: "setup da € 690",
    items: [
      "Sito personalizzato",
      "Menu digitale aggiornabile",
      "Recensioni, foto, orari, contatti",
    ],
  },
  {
    name: "Operatività",
    tagline: "Sito + servizi",
    price: "79",
    setup: "setup da € 990",
    featured: true,
    items: [
      "Tutto di Presenza",
      "Prenotazioni e ordini",
      "QR menu di sala",
      "Pannello staff",
    ],
  },
  {
    name: "Crescita",
    tagline: "Su richiesta",
    price: "—",
    setup: "preventivo dedicato",
    items: [
      "Tutto di Operatività",
      "Funzioni custom su richiesta",
      "Campagne stagionali",
      "Supporto prioritario",
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

