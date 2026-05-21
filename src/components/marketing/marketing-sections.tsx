import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  CalendarCheck,
  ChefHat,
  Calculator,
  Check,
  Clock,
  Megaphone,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  TrendingUp,
  Users,
  Wand2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchPricingAddons, fetchPricingPlans, type MarketingReview, type MarketingTenant } from "@/lib/marketing-data";
import { DEFAULT_MARKET, MARKET_HEADER, getMarket, normalizeMarketCode } from "@/lib/markets";
import { formatPricingAmount, formatSetupFrom, replacePriceToken } from "@/lib/pricing-format";
import { headers } from "next/headers";

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
                  "relative flex flex-col gap-6 border p-8 sm:p-10 transition-colors " +
                  (isAI
                    ? "border-[var(--menuary-gold)] bg-[var(--menuary-ink)] text-[var(--menuary-paper)]"
                    : "border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] hover:border-[var(--menuary-ink)]/40")
                }
              >
                {isAI && (
                  <span className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-full bg-[var(--menuary-gold)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--menuary-ink)]">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--menuary-ink)] opacity-60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--menuary-ink)]" />
                    </span>
                    Live · 24/7
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
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--menuary-gold)]/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--menuary-gold)]">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--menuary-gold)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--menuary-gold)]" />
              </span>
              Live · risponde 24/7
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
                Attiva l&apos;IA per il tuo locale
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
                    Ristorante, buonasera. Come posso aiutarla?
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

export async function LogosStripSection({ tenants }: { tenants: MarketingTenant[] }) {
  if (tenants.length === 0) return null;
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.logosStrip;
  const labels = tenants.map((t) => t.name);
  const minMarqueeItems = 8;
  const repeats = Math.max(2, Math.ceil(minMarqueeItems / labels.length));
  const track = Array.from({ length: repeats }, () => labels).flat();
  return (
    <section className="border-y border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-10 lg:py-14">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-12">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--menuary-muted)] sm:max-w-[12rem] sm:text-right">
            {t.label}
          </p>
          <div className="menuary-marquee flex-1">
            <div className="menuary-marquee-track">
              {track.map((label, i) => (
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

export async function TestimonialsSection({ reviews }: { reviews: MarketingReview[] }) {
  if (reviews.length === 0) return null;
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.testimonials;
  const visible = reviews.slice(0, 3);
  const avg =
    reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="menuary-section-label">{t.label}</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
              {t.h2}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--menuary-muted)]">
            <div className="flex gap-0.5 text-[var(--menuary-copper)]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            <span>
              <strong className="text-[var(--menuary-ink)]">
                {avg.toFixed(1).replace(".", ",")} / 5
              </strong>{" "}
              {t.avgGoogle}
            </span>
          </div>
        </div>

        <div className="mt-12 grid gap-px sm:gap-6 md:grid-cols-3">
          {visible.map((t) => (
            <figure key={t.id} className="menuary-testimonial">
              <div className="flex gap-0.5 text-[var(--menuary-copper)]">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <blockquote className="menuary-testimonial-quote">
                &ldquo;{t.text}&rdquo;
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-[var(--menuary-line)] pt-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--menuary-ink)] text-[var(--menuary-paper)] font-bold text-sm">
                  {t.author
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.author}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                    {t.tenantName}
                    {t.tenantCity ? ` · ${t.tenantCity}` : ""}
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

export async function FAQSection({
  items,
  title,
  kicker,
}: {
  items: FAQItem[];
  title?: string;
  kicker?: string;
}) {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.faq;
  const resolvedKicker = kicker ?? t.kicker;
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="menuary-section-label">{resolvedKicker}</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.4vw,3.6rem)]">
              {title ?? "Le risposte alle cose che ci chiedete sempre."}
            </h2>
            <p className="mt-6 max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
              {t.notFound}{" "}
              <Link href="/contatti" className="menuary-link">
                {t.ctaLink}
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
    tagline: "Gestionale + IA",
    price: "249",
    setup: "setup da € 1.990",
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
            Contratto annuale, zero commissioni e zero fee nascoste. Puoi
            cambiare piano in qualsiasi momento — la variazione parte dal mese
            successivo.
          </p>
        </div>

        <div className="mt-14 grid gap-px sm:gap-6 md:grid-cols-3">
          {PRICING_TEASER.map((p) => (
            <article
              key={p.name}
              className={
                "relative flex flex-col gap-5 border p-8 transition-colors " +
                (p.featured
                  ? "border-[var(--menuary-copper)] bg-[var(--menuary-paper)]"
                  : "border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] hover:border-[var(--menuary-ink)]/40")
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
                  <span className="amount">€{p.price}</span>
                  <span className="unit">/mese</span>
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

export async function FinalCTASection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.finalCta;
  return (
    <section className="bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
      <div className="menuary-container py-24 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-end lg:gap-20">
          <div>
            <p
              className="menuary-section-label"
              style={{ color: "rgba(255,250,242,0.55)" }}
            >
              {t.label}
            </p>
            <h2 className="menuary-display mt-6 text-[clamp(2.6rem,5.2vw,5rem)]">
              {t.h2a}
              <br />
              <span className="italic text-[var(--menuary-gold)]">
                {t.h2b}
              </span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-white/65">
              {t.sub}
            </p>
          </div>
          <div className="flex flex-col items-start gap-5">
            <Link
              href="/contatti"
              className="menuary-button menuary-button-accent"
            >
              {t.cta}
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
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
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

export function DemosSection({ tenants }: { tenants: MarketingTenant[] }) {
  if (tenants.length === 0) return null;
  const visible = tenants.slice(0, 4);
  const title =
    visible.length === 1
      ? "Un locale, una voce."
      : visible.length === 2
        ? "Due locali, due voci diverse."
        : `${visible.length} locali, ${visible.length} voci diverse.`;
  return (
    <section className="border-t border-[var(--menuary-line)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="menuary-section-label">Esempi recenti</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.4vw,4rem)]">
              {title}
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
            Esplora ristoranti reali costruiti su Menuary. Stesso motore,
            identità opposte.
          </p>
        </div>

        <div
          className={
            "mt-12 grid gap-8 " +
            (visible.length === 1 ? "md:grid-cols-1" : "md:grid-cols-2")
          }
        >
          {visible.map((d) => (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block cursor-pointer"
            >
              <div className="menuary-photo aspect-[5/4] w-full">
                <Image
                  src={d.image}
                  alt={d.name}
                  width={1100}
                  height={880}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
                    {d.city}
                  </p>
                  <p className="menuary-display mt-2 text-2xl">
                    {d.name}
                    {d.city ? ` · ${d.city}` : ""}
                  </p>
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

/* ============================================================
   INTEGRATIONS STRIP — "Funziona con quello che usi già"
   ============================================================ */

const INTEGRATIONS = [
  { name: "Stripe", category: "Pagamenti" },
  { name: "WhatsApp Business", category: "Messaggi" },
  { name: "Google Reserve", category: "Prenotazioni" },
  { name: "TheFork", category: "Prenotazioni" },
  { name: "Deliveroo", category: "Delivery" },
  { name: "Glovo", category: "Delivery" },
  { name: "Just Eat", category: "Delivery" },
  { name: "Apple Pay", category: "Pagamenti" },
  { name: "SumUp", category: "Pagamenti" },
  { name: "Retell AI", category: "IA vocale" },
  { name: "ElevenLabs", category: "IA vocale" },
  { name: "Meta", category: "Social" },
];

export function IntegrationsSection() {
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
      <div className="menuary-container py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20 lg:items-center">
          <div>
            <p className="menuary-section-label">Integrazioni</p>
            <h2 className="menuary-display mt-6 text-[clamp(2rem,4vw,3.4rem)]">
              Funziona con
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                quello che usi già.
              </span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-7 text-[var(--menuary-muted)]">
              Pagamenti, delivery, prenotazioni, WhatsApp, social, voce IA. Le
              integrazioni che servono — già collegate, già configurate.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px border border-[var(--menuary-line)] sm:grid-cols-3 md:grid-cols-4">
            {INTEGRATIONS.map((i) => (
              <div
                key={i.name}
                className="menuary-integration-tile"
                title={i.category}
              >
                <span className="menuary-integration-name">{i.name}</span>
                <span className="menuary-integration-cat">{i.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   MODULE SHOWCASES — 3 visual mini mockups (food cost, magazzino, CRM)
   ============================================================ */

export function ModuleShowcasesSection() {
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="menuary-section-label">Dentro il prodotto</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
              Tre strumenti che cambiano
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                il modo in cui chiudi il mese.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
            Food cost in tempo reale, magazzino intelligente, CRM che conosce
            ogni cliente. Tre moduli, tre superpoteri.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {/* FOOD COST */}
          <article className="menuary-module-card">
            <div className="flex items-center justify-between">
              <span className="menuary-feature-icon">
                <Calculator size={18} strokeWidth={1.7} />
              </span>
              <span className="text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
                Food cost
              </span>
            </div>
            <h3 className="menuary-display mt-5 text-2xl">
              Margine reale per piatto.
            </h3>

            <div className="mt-6 rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--menuary-muted)]">
                    Piatto
                  </p>
                  <p className="menuary-display text-lg mt-0.5">
                    Tagliatelle al ragù
                  </p>
                </div>
                <p className="text-2xl font-semibold tabular-nums">€ 16</p>
              </div>
              <div className="mt-4 space-y-1.5 text-[13px]">
                {[
                  ["Pasta fresca", "0,80"],
                  ["Ragù di brasato", "3,40"],
                  ["Ricotta dura", "0,60"],
                  ["Olio · sale · erbe", "0,30"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-center justify-between text-[var(--menuary-muted)]"
                  >
                    <span>{k}</span>
                    <span className="tabular-nums">€ {v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--menuary-line)] pt-3 text-[13px]">
                <span className="text-[var(--menuary-muted)]">
                  Costo materia prima
                </span>
                <span className="font-semibold tabular-nums">€ 5,10</span>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--menuary-sage)]/12 px-3 py-2">
                <span className="text-xs uppercase tracking-[0.18em] text-[#5a6b4e] font-bold">
                  Margine
                </span>
                <span className="text-base font-bold tabular-nums text-[#3f4f37]">
                  68% · € 10,90
                </span>
              </div>
            </div>

            <p className="mt-5 text-[14px] leading-6 text-[var(--menuary-muted)]">
              Quando aumenta un fornitore, il margine cambia in tempo reale.
              Niente Excel di fine mese.
            </p>
          </article>

          {/* MAGAZZINO */}
          <article className="menuary-module-card">
            <div className="flex items-center justify-between">
              <span className="menuary-feature-icon">
                <Boxes size={18} strokeWidth={1.7} />
              </span>
              <span className="text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
                Magazzino
              </span>
            </div>
            <h3 className="menuary-display mt-5 text-2xl">
              Scorte che si parlano.
            </h3>

            <div className="mt-6 space-y-2.5">
              {[
                {
                  name: "Burrata di Andria",
                  qty: "2 kg",
                  status: "sotto",
                  hint: "Soglia 4 kg · fornitore: Casearia Sud",
                },
                {
                  name: "Pomodori datterino",
                  qty: "12 kg",
                  status: "ok",
                  hint: "Lotto fresco · scade tra 3 gg",
                },
                {
                  name: "Olio EVO Coratina",
                  qty: "4 L",
                  status: "ok",
                  hint: "—",
                },
                {
                  name: "Farina 0 Mulino",
                  qty: "1 sacco",
                  status: "sotto",
                  hint: "Soglia 5 sacchi · ordine suggerito",
                },
              ].map((row) => (
                <div
                  key={row.name}
                  data-status={row.status}
                  className="menuary-stock-row"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold truncate">
                      {row.name}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--menuary-muted)] truncate">
                      {row.hint}
                    </p>
                  </div>
                  <span className="text-[13px] font-bold tabular-nums shrink-0">
                    {row.qty}
                  </span>
                  {row.status === "sotto" && (
                    <span className="menuary-stock-pill">Sotto soglia</span>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-6 text-[14px] leading-6 text-[var(--menuary-muted)]">
              Le ricette del menu scalano automaticamente le scorte quando un
              piatto esce in cucina.
            </p>
          </article>

          {/* CRM */}
          <article className="menuary-module-card">
            <div className="flex items-center justify-between">
              <span className="menuary-feature-icon">
                <Users size={18} strokeWidth={1.7} />
              </span>
              <span className="text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)]">
                CRM clienti
              </span>
            </div>
            <h3 className="menuary-display mt-5 text-2xl">
              Conosci chi entra.
            </h3>

            <div className="mt-6 rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--menuary-ink)] text-[var(--menuary-paper)] font-bold">
                  GB
                </span>
                <div>
                  <p className="menuary-display text-lg">Giulia Bianchi</p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)]">
                    Cliente da 14 mesi · 18 visite
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
                <div className="rounded-xl bg-[var(--menuary-porcelain)] p-3">
                  <p className="uppercase tracking-[0.18em] text-[var(--menuary-muted)] text-[10px]">
                    Spesa media
                  </p>
                  <p className="menuary-display text-xl mt-1 tabular-nums">
                    € 42
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--menuary-porcelain)] p-3">
                  <p className="uppercase tracking-[0.18em] text-[var(--menuary-muted)] text-[10px]">
                    Ultima visita
                  </p>
                  <p className="menuary-display text-xl mt-1">12 gg fa</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--menuary-copper)]" />
                  <span className="text-[var(--menuary-muted)]">
                    Preferenze:
                  </span>
                  <span className="font-semibold">vegano, no glutine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--menuary-copper)]" />
                  <span className="text-[var(--menuary-muted)]">
                    Tavolo preferito:
                  </span>
                  <span className="font-semibold">finestra, 4 cop.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--menuary-copper)]" />
                  <span className="text-[var(--menuary-muted)]">Vino:</span>
                  <span className="font-semibold">
                    Verdicchio · Bianchello
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-5 text-[14px] leading-6 text-[var(--menuary-muted)]">
              Il cliente accede con il suo profilo Menuary: tu vedi solo i dati
              utili al servizio.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   COMPARISON — Menuary vs gestionale tradizionale
   ============================================================ */

const COMPARISON_ROWS = [
  {
    label: "Aggiornare un prezzo del menu",
    old: { v: "Chiamata all'agenzia · 2-3 giorni", bad: true },
    new: { v: "2 tocchi · online in 1 secondo", good: true },
  },
  {
    label: "Nuova prenotazione fuori orario",
    old: { v: "Segreteria telefonica · clienti persi", bad: true },
    new: { v: "L'IA risponde e prenota in agenda", good: true },
  },
  {
    label: "Sapere il margine di un piatto",
    old: { v: "Excel a fine mese · dati vecchi", bad: true },
    new: { v: "Live · cambia con il listino fornitori", good: true },
  },
  {
    label: "Ordinare le scorte",
    old: { v: "Conta a mano · ordini d'emergenza", bad: true },
    new: { v: "Alert sotto soglia automatici", good: true },
  },
  {
    label: "Sapere chi sta tornando",
    old: { v: "Memoria della sala · si perde", bad: true },
    new: { v: "Profilo cliente con storico", good: true },
  },
  {
    label: "Cambiare delivery provider",
    old: { v: "Nuovo accordo + 4 settimane", bad: true },
    new: { v: "Switch nel pannello · stesso giorno", good: true },
  },
  {
    label: "Aggiornamenti del software",
    old: { v: "Costo extra · downtime", bad: true },
    new: { v: "Inclusi nel canone · zero stop", good: true },
  },
];

export function ComparisonSection() {
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="menuary-section-label">Menuary vs il modo vecchio</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,4rem)]">
              La differenza non è
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                solo nei numeri.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-[var(--menuary-muted)]">
            Sette cose che cambiano davvero quando passi da tre fornitori
            scollegati a un unico sistema operativo.
          </p>
        </div>

        <div className="mt-12 overflow-hidden border border-[var(--menuary-line)]">
          {/* header */}
          <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[1.2fr_1fr_1fr] border-b border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
            <div className="hidden p-5 text-xs uppercase tracking-[0.22em] text-[var(--menuary-muted)] font-bold sm:block">
              Operazione
            </div>
            <div className="flex items-center gap-2 border-l border-[var(--menuary-line)] p-5 text-xs uppercase tracking-[0.22em] text-[var(--menuary-muted)] font-bold">
              <Clock size={12} strokeWidth={2.2} />
              Tradizionale
            </div>
            <div className="flex items-center gap-2 border-l border-[var(--menuary-line)] p-5 text-xs uppercase tracking-[0.22em] text-[var(--menuary-copper)] font-bold">
              <TrendingUp size={12} strokeWidth={2.2} />
              Con Menuary
            </div>
          </div>

          {COMPARISON_ROWS.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_1fr] border-t border-[var(--menuary-line)] sm:grid-cols-[1.2fr_1fr_1fr]"
            >
              <div className="col-span-2 px-5 pt-5 pb-2 menuary-display text-base sm:col-span-1 sm:p-5 sm:text-lg">
                {row.label}
              </div>
              <div className="flex items-start gap-3 border-l border-[var(--menuary-line)] p-5 text-[14px] leading-6 text-[var(--menuary-muted)]">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--menuary-line)] text-[var(--menuary-muted)]">
                  <X size={13} strokeWidth={2.4} />
                </span>
                <span>{row.old.v}</span>
              </div>
              <div className="flex items-start gap-3 border-l border-[var(--menuary-line)] p-5 text-[14px] leading-6">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--menuary-sage)]/18 text-[#3f4f37]">
                  <Check size={13} strokeWidth={2.4} />
                </span>
                <span className="font-medium">{row.new.v}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   BIG NUMBERS — emotional impact metrics
   ============================================================ */

export function BigNumbersSection() {
  const stats = [
    { n: "1", l: "Pannello per tutta l'operatività", h: "sito, sala, cucina, IA" },
    { n: "24/7", l: "Risposte automatiche al telefono", h: "anche fuori orario" },
    { n: "9", l: "Moduli integrati", h: "accendi solo ciò che ti serve" },
    { n: "0", l: "Commissioni su ordini e prenotazioni", h: "incassi integrali" },
  ];

  return (
    <section className="relative overflow-hidden border-t border-[var(--menuary-line)] bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,250,242,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,250,242,1) 1px, transparent 1px)",
          backgroundSize: "3rem 3rem",
          maskImage: "linear-gradient(180deg, transparent 0%, black 30%, black 70%, transparent 100%)",
        }}
      />
      <div className="menuary-container relative py-20 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="menuary-section-label" style={{ color: "rgba(255,250,242,0.55)" }}>
              I numeri che contano
            </p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.6vw,3.8rem)]">
              Quattro promesse, una piattaforma.
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-7 text-white/65">
            Quello che vogliamo garantire a ogni ristorante che entra su
            Menuary — dal primo giorno, senza eccezioni.
          </p>
        </div>

        <div className="mt-14 grid gap-px border-t border-white/12 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.l}
              className="border-b border-white/12 p-8 sm:border-l sm:p-10 sm:first:border-l-0 sm:[&:nth-child(3)]:border-l-0 lg:[&:nth-child(3)]:border-l"
            >
              <p
                className="menuary-display text-[clamp(3.4rem,6vw,5.4rem)] text-[var(--menuary-gold)]"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {s.n}
              </p>
              <p className="mt-3 text-sm font-semibold text-white">{s.l}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                {s.h}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   GOOGLE SYNC — "Google sempre aggiornato"
   ============================================================ */

const GOOGLE_SYNC_ICONS = [Star, Clock, Megaphone, ShieldCheck] as const;

export async function GoogleSyncSection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.googleSync;
  const cards = t.cards;
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="max-w-3xl">
          <p className="menuary-section-label">{t.label}</p>
          <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.8vw,4rem)]">
            {t.h2}
          </h2>
          <p className="mt-6 max-w-xl text-[17px] leading-[1.7] text-[var(--menuary-muted)]">
            {t.sub}
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, idx) => {
            const Icon = GOOGLE_SYNC_ICONS[idx] ?? Star;
            return (
              <div
                key={card.title}
                className="group flex flex-col rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--menuary-ink)] hover:shadow-[0_18px_50px_-20px_rgba(24,35,31,0.18)]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--menuary-ink)]/5 text-[var(--menuary-ink)]">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <h3 className="menuary-display mt-6 text-[1.35rem] leading-tight">
                  {card.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-[var(--menuary-muted)]">
                  {card.body}
                </p>
                {card.note ? (
                  <p className="mt-5 border-t border-[var(--menuary-line)] pt-4 text-[11px] uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
                    {card.note}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   LOCAL PRESENCE — Google / Yelp / TripAdvisor
   ============================================================ */

export async function LocalPresenceSection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.localPresence;
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <p className="menuary-section-label">{t.label}</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.8vw,4rem)]">
              {t.h2a}
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                {t.h2b}
              </span>
            </h2>
            <p className="mt-7 max-w-lg text-[17px] leading-[1.7] text-[var(--menuary-muted)]">
              {t.sub}
            </p>
            <Link href="/contatti" className="menuary-link mt-8 inline-flex">
              {t.cta}
              <ArrowUpRight size={14} strokeWidth={1.6} />
            </Link>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            {/* Google card */}
            <div className="relative z-20 rounded-2xl border border-[var(--menuary-line)] bg-white p-5 shadow-[0_24px_60px_-24px_rgba(24,35,31,0.22)]">
              <div className="flex items-center gap-3">
                <GoogleGlyph />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    Google
                  </p>
                  <p className="text-sm font-semibold truncate text-[var(--menuary-ink)]">
                    {t.googleOpen}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex gap-0.5 text-[var(--menuary-copper)]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-[var(--menuary-ink)]">
                  4,7
                </span>
                <span className="text-xs text-[var(--menuary-muted)]">
                  · aggiornato oggi
                </span>
              </div>
            </div>

            {/* TripAdvisor card */}
            <div className="relative z-10 -mt-3 ml-12 rounded-2xl border border-[var(--menuary-line)] bg-white p-4 shadow-[0_20px_50px_-24px_rgba(24,35,31,0.18)]">
              <div className="flex items-center gap-3">
                <TripAdvisorGlyph />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    Tripadvisor
                  </p>
                  <p className="text-sm font-semibold truncate text-[var(--menuary-ink)]">
                    Eccellenza · 2026
                  </p>
                </div>
              </div>
            </div>

            {/* Yelp card */}
            <div className="relative z-0 -mt-3 ml-4 mr-12 rounded-2xl border border-[var(--menuary-line)] bg-white p-4 shadow-[0_16px_40px_-24px_rgba(24,35,31,0.18)]">
              <div className="flex items-center gap-3">
                <YelpGlyph />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                    Yelp
                  </p>
                  <p className="text-sm font-semibold truncate text-[var(--menuary-ink)]">
                    128 recensioni · 4,3
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GoogleGlyph() {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_var(--menuary-line)]">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC04"
          d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        />
      </svg>
    </span>
  );
}

function TripAdvisorGlyph() {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
      {/* TripAdvisor owl — green circle, two eyes */}
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden>
        <circle cx="20" cy="20" r="20" fill="#00AF87" />
        {/* left eye */}
        <circle cx="13" cy="21" r="6" fill="white" />
        <circle cx="13" cy="21" r="3.5" fill="#00AF87" />
        <circle cx="13" cy="21" r="2" fill="#1A1A1A" />
        <circle cx="12" cy="20" r="0.7" fill="white" />
        {/* right eye */}
        <circle cx="27" cy="21" r="6" fill="white" />
        <circle cx="27" cy="21" r="3.5" fill="#00AF87" />
        <circle cx="27" cy="21" r="2" fill="#1A1A1A" />
        <circle cx="26" cy="20" r="0.7" fill="white" />
        {/* beak */}
        <ellipse cx="20" cy="27" rx="2.5" ry="1.5" fill="white" opacity="0.9" />
      </svg>
    </span>
  );
}

function YelpGlyph() {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#D32323]">
      {/* Yelp burst star */}
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="white">
        <path d="M12.27 12.56l-3.93 1.06a.5.5 0 0 1-.6-.64l1.58-3.67a.5.5 0 0 1 .88-.06l2.35 2.61a.5.5 0 0 1-.28.7zm1.37-.96l2.08-3.43a.5.5 0 0 1 .85.06l1.24 3.8a.5.5 0 0 1-.57.65l-3.32-.43a.5.5 0 0 1-.28-.65zm-4.83 4.28l-3.59-1.6a.5.5 0 0 1-.1-.86l3.08-2.25a.5.5 0 0 1 .76.28l.51 3.83a.5.5 0 0 1-.66.6zm9.04 1.14l-3.6 1.53a.5.5 0 0 1-.67-.57l.46-3.85a.5.5 0 0 1 .75-.37l3.13 2.2a.5.5 0 0 1-.07.86zm-4.43 3.83l.04 3.9a.5.5 0 0 1-.78.42l-3.22-2.12a.5.5 0 0 1 .07-.86l3.18-1.77a.5.5 0 0 1 .71.43z" />
      </svg>
    </span>
  );
}

/* ============================================================
   BENEFITS — editorial 4-card grid
   ============================================================ */

export async function BenefitsEditorialSection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.benefits;
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-24 lg:py-32">
        <div className="max-w-3xl">
          <p className="menuary-section-label">{t.label}</p>
          <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.8vw,4rem)]">
            {t.h2a}
            <br />
            <span className="italic text-[var(--menuary-copper)]">
              {t.h2b}
            </span>
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.cards.map((card) => (
            <div
              key={card.n}
              className="flex flex-col rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--menuary-ink)]"
            >
              <p
                className="menuary-display text-base font-medium text-[var(--menuary-copper)]"
                aria-hidden
              >
                {card.n}
              </p>
              <h3 className="menuary-display mt-6 text-[1.45rem] leading-tight">
                {card.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.6] text-[var(--menuary-muted)]">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   HOME PRICING — 3 piani (Presenza / Prenotazioni / Operatività)
   ============================================================ */



export async function HomePricingSection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.homePricing;
  const h = await headers();
  const marketCode = normalizeMarketCode(h.get(MARKET_HEADER)) ?? DEFAULT_MARKET;
  const market = getMarket(marketCode);
  const [pricingPlans, pricingAddons] = await Promise.all([
    fetchPricingPlans(marketCode),
    fetchPricingAddons(marketCode),
  ]);
  const aiAddon = pricingAddons[0];
  const perMonthLabel = t.perMonth.replace(/[€$£]\s*/, "");
  const copyById = new Map(t.plans.map((plan) => [plan.id, plan]));
  const plans = pricingPlans.map((plan) => {
    const copy = copyById.get(plan.slug) ?? t.plans[0];
    const currency = plan.currency ?? market.currency;
    return {
      ...copy,
      id: plan.slug,
      price_annual: plan.price_annual,
      price_monthly: plan.price_monthly,
      currency,
      monthly: formatPricingAmount(plan.price_annual, currency, market.locale),
      monthlyBilling: formatPricingAmount(plan.price_monthly, currency, market.locale),
      setup: formatSetupFrom(plan.setup_from, currency, market.locale),
      highlighted: plan.is_featured === true,
    };
  });
  return (
    <section
      id="prezzi"
      className="border-t border-[var(--menuary-line)] bg-[var(--menuary-paper)]"
    >
      <div className="menuary-container py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="menuary-section-label">{t.label}</p>
            <h2 className="menuary-display mt-6 text-[clamp(2.2rem,4.8vw,4rem)]">
              {t.h2a}
              <br />
              <span className="italic text-[var(--menuary-copper)]">
                {t.h2b}
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-[1.6] text-[var(--menuary-muted)]">
            {t.sub}
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => {
            const highlighted = plan.highlighted === true;
            const saving = (plan.price_monthly - plan.price_annual) * 12;
            const formattedSaving = formatPricingAmount(saving, plan.currency, market.locale);
            return (
              <article
                key={plan.id}
                className={
                  "relative flex flex-col rounded-3xl border bg-[var(--menuary-paper)] p-8 transition-all duration-200 " +
                  (highlighted
                    ? "border-[var(--menuary-ink)] shadow-[0_30px_70px_-30px_rgba(24,35,31,0.32)] lg:scale-[1.02]"
                    : "border-[var(--menuary-line)] hover:border-[var(--menuary-ink)]")
                }
              >
                {highlighted ? (
                  <span className="absolute -top-3 left-8 inline-flex items-center rounded-full bg-[var(--menuary-copper)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    {t.mostChosen}
                  </span>
                ) : null}

                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                  {highlighted ? "Piano" : plan.eyebrow}
                </p>
                <h3 className="menuary-display mt-2 text-[1.9rem] leading-tight">
                  {plan.name}
                </h3>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="menuary-display text-[3.4rem] leading-none tabular-nums">
                    {plan.monthly}
                  </span>
                  <span className="text-sm text-[var(--menuary-muted)]">
                    {perMonthLabel}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-[var(--menuary-muted)]">
                  {t.annualBilling} ·{" "}
                  <span className="font-semibold text-[var(--menuary-sage)]">
                    {replacePriceToken(t.savingsLabel, "amount", formattedSaving)}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[var(--menuary-muted)]">
                  {t.monthlyLabel
                    .replace(/[€$£]?\{price\}/, plan.monthlyBilling)
                    .replace("{setup}", plan.setup)}
                </p>

                <div className="my-7 h-px bg-[var(--menuary-line)]" />

                {plan.inherits ? (
                  <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--menuary-ink)]">
                    {plan.inherits}
                  </p>
                ) : null}

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-[15px] leading-[1.5] text-[var(--menuary-ink)]"
                    >
                      <Check
                        size={16}
                        strokeWidth={2}
                        className="mt-1 shrink-0 text-[var(--menuary-sage)]"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-8">
                  <Link
                    href="/contatti"
                    className={
                      "menuary-button " +
                      (highlighted
                        ? "menuary-button-accent"
                        : "menuary-button-light")
                    }
                  >
                    {plan.ctaLabel}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.16em] text-[var(--menuary-muted)]">
          {t.vatNote}
        </p>

        {/* AI add-on callout */}
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-porcelain)] p-6 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex items-center gap-4 shrink-0">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--menuary-ink)] text-[var(--menuary-paper)]">
              <Phone size={18} strokeWidth={1.7} />
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                {t.aiEyebrow}
              </p>
              <p className="menuary-display text-lg">
                {t.aiTitle.replace(
                  /\+\s*[€$£]?\d+/,
                  `+${formatPricingAmount(aiAddon.monthly, aiAddon.currency ?? market.currency, market.locale)}`,
                )}
              </p>
            </div>
          </div>
          <p className="flex-1 text-[14px] leading-[1.65] text-[var(--menuary-muted)]">
            {t.aiDesc}
          </p>
          <Link
            href="/pricing#ai"
            className="menuary-button menuary-button-light shrink-0 text-sm"
          >
            {t.aiCta}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   AI INTEGRATIONS — sezione secondaria opzionale
   ============================================================ */

export async function AIIntegrationsTeaserSection() {
  const t = (await import("@/i18n").then((m) => m.getTranslations("marketing"))).sections.aiTeaser;
  return (
    <section className="border-t border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
      <div className="menuary-container py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="menuary-section-label">{t.label}</p>
            <h2 className="menuary-display mt-6 text-[clamp(1.7rem,3.2vw,2.4rem)] leading-tight">
              {t.h2}
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-[1.7] text-[var(--menuary-muted)]">
              {t.sub}
            </p>
            <Link href="/contatti" className="menuary-link mt-6 inline-flex">
              {t.cta}
              <ArrowUpRight size={14} strokeWidth={1.6} />
            </Link>
          </div>

          <aside
            aria-hidden
            className="rounded-2xl border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--menuary-muted)] font-bold">
                <Phone size={12} strokeWidth={2} />
                {t.mockupCallHandled}
              </span>
              <span className="text-[11px] text-[var(--menuary-muted)]">
                14:32 · 2 min
              </span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p className="rounded-xl bg-[var(--menuary-ink)]/5 px-3 py-2 text-[var(--menuary-ink)]">
                {t.mockupMessage}
              </p>
              <p className="flex items-start gap-2 text-[var(--menuary-muted)]">
                <Check
                  size={14}
                  strokeWidth={2.2}
                  className="mt-1 shrink-0 text-[var(--menuary-sage)]"
                />
                {t.mockupBooked}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
