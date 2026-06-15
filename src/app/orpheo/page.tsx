import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Camera,
  Check,
  FileText,
  Mic2,
  Sparkles,
  Star,
  Ticket,
  Users,
} from "lucide-react";
import { OrpheoShell } from "@/components/orpheo/orpheo-shell";
import {
  ORPHEO_MARKETING_DESCRIPTION,
  ORPHEO_ORIGIN,
  ORPHEO_KEYWORDS,
  marketingAlternates,
} from "@/lib/marketing-seo";
import { getLocale } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Orpheo - piattaforma per artisti e professionisti creativi",
    description: ORPHEO_MARKETING_DESCRIPTION,
    keywords: ORPHEO_KEYWORDS,
    alternates: marketingAlternates(ORPHEO_ORIGIN, "", await getLocale()),
  };
}

const heroStats = [
  { value: "01", label: "press kit sempre pronto" },
  { value: "24h", label: "richieste e follow-up tracciati" },
  { value: "360", label: "opere, eventi, contatti e diritti" },
];

const spotlightImages = [
  {
    src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1100&q=85",
    alt: "Concerto dal vivo con pubblico e luci di palco",
    label: "Concerti",
  },
  {
    src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=85",
    alt: "Musicisti durante una sessione live",
    label: "Showcase",
  },
  {
    src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85",
    alt: "Autore che firma copie e materiali editoriali",
    label: "Firmacopie",
  },
];

const productionMoments = [
  {
    icon: Mic2,
    title: "Concerti e live",
    text: "Schede evento, materiali tecnici, disponibilità, cachet, contatti venue, richieste stampa e recap post-serata nello stesso flusso.",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1000&q=85",
    alt: "Microfono su un palco illuminato",
  },
  {
    icon: Camera,
    title: "Provini e casting",
    text: "Ruoli, self tape, callback, agenzie, scadenze, liberatorie e materiali richiesti diventano attività chiare per artista e manager.",
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=85",
    alt: "Team creativo che valuta materiali durante una selezione",
  },
  {
    icon: Ticket,
    title: "Firmacopie e lanci",
    text: "Calendario promozionale, librerie, store, scalette, link vendita, newsletter e follow-up fanbase pronti prima dell'apertura porte.",
    image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1000&q=85",
    alt: "Sala con libri e pubblico per un evento editoriale",
  },
];

const modules = [
  "Sito ufficiale e dominio",
  "Bio, foto ufficiali e press kit",
  "Catalogo opere, crediti e asset",
  "Booking eventi e opportunità",
  "Diritti, licenze e contratti",
  "Fanbase, newsletter e analytics",
  "Recensioni e provider esterni",
  "CRM per manager e ufficio stampa",
];

const workflow = [
  {
    icon: FileText,
    title: "Presenza ufficiale",
    text: "Una pagina professionale, leggibile da stampa, fan, casting director, venue e partner commerciali.",
  },
  {
    icon: CalendarClock,
    title: "Operatività",
    text: "Ogni richiesta diventa una pipeline: nuovo lead, briefing, preventivo, conferma, materiali, follow-up.",
  },
  {
    icon: Users,
    title: "Team",
    text: "Artista, manager, agente, ufficio stampa e amministrazione lavorano sullo stesso archivio aggiornato.",
  },
  {
    icon: Star,
    title: "Reputazione",
    text: "Recensioni, citazioni, premi, rassegna stampa e provider vengono raccolti in una narrativa coerente.",
  },
];

export default function OrpheoHome() {
  return (
    <OrpheoShell>
      <section className="relative isolate min-h-[calc(78svh-5rem)] overflow-hidden border-b border-[var(--menuary-line)] bg-[#120d18] text-white">
        <Image
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=2200&q=88"
          alt="Palco di concerto con artista e luci professionali"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(14,10,20,0.94)_0%,rgba(14,10,20,0.74)_42%,rgba(14,10,20,0.24)_100%),linear-gradient(180deg,rgba(14,10,20,0.1)_0%,rgba(14,10,20,0.92)_100%)]" />
        <div className="menuary-container grid min-h-[calc(78svh-5rem)] items-end gap-8 py-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-4xl pb-4">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#d8c5ff]">
              <Sparkles size={15} strokeWidth={1.7} />
              Orpheo per artisti, autori e team creativi
            </p>
            <h1 className="mt-6 max-w-5xl text-5xl font-medium leading-none text-balance md:text-6xl" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
              La tua carriera creativa, finalmente in regia.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/78">
              Concerti, provini, casting, firmacopie, catalogo opere, diritti, press kit e fanbase: Orpheo trasforma presenza pubblica e lavoro operativo in una piattaforma unica, elegante e professionale.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/orpheo/pricing" className="menuary-button bg-white text-[#17111F] hover:bg-[#f4df9a]">
                Vedi piani Orpheo
                <ArrowRight size={15} strokeWidth={1.8} className="ml-1" />
              </Link>
              <Link href="/orpheo/contatti" className="menuary-button border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/18">
                Richiedi una demo
              </Link>
            </div>
          </div>

          <div className="grid gap-3 pb-2 sm:grid-cols-3 lg:grid-cols-1">
            {heroStats.map((stat) => (
              <div key={stat.label} className="border border-white/18 bg-white/10 p-4 backdrop-blur-md">
                <p className="text-2xl font-medium text-[#f4df9a]" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/76">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--menuary-line)] bg-[#17111F] text-white">
        <div className="menuary-container py-16 lg:py-20">
          <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr_0.9fr]">
            {spotlightImages.map((item, index) => (
              <figure key={item.label} className={index === 0 ? "relative min-h-[30rem] overflow-hidden md:row-span-2" : "relative min-h-[14.25rem] overflow-hidden"}>
                <Image src={item.src} alt={item.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 to-transparent p-5">
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#f4df9a]">{item.label}</span>
                </figcaption>
              </figure>
            ))}
            <div className="border border-white/12 bg-white/[0.06] p-7 md:min-h-[14.25rem]">
              <p className="menuary-section-label text-[#d8c5ff]">Non solo vetrina</p>
              <h2 className="mt-5 text-3xl font-medium leading-tight md:text-4xl" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                Un backstage digitale per chi lavora davvero.
              </h2>
              <p className="mt-5 text-sm leading-7 text-white/70">
                Orpheo tiene insieme estetica pubblica e gestione concreta: materiali, scadenze, opportunità, contatti, asset, report e prossime mosse.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--menuary-line)] bg-[var(--menuary-paper)]">
        <div className="menuary-container py-20 lg:py-28">
          <div className="grid items-end gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="menuary-section-label">Dove Orpheo cambia passo</p>
              <h2 className="mt-6 text-4xl font-medium leading-tight md:text-6xl" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                Dal palco alla trattativa, senza perdere pezzi.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-[var(--menuary-muted)] lg:justify-self-end">
              Ogni momento professionale genera informazioni: file da inviare, persone da ricordare, scadenze, condizioni, recensioni, prove, contratti. Orpheo li organizza in un sistema pensato per carriere creative, non per aziende generiche.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {productionMoments.map((moment) => {
              const Icon = moment.icon;
              return (
                <article key={moment.title} className="overflow-hidden border border-[var(--menuary-line)] bg-white">
                  <div className="relative min-h-72">
                    <Image src={moment.image} alt={moment.alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                  </div>
                  <div className="p-6">
                    <div className="flex h-11 w-11 items-center justify-center bg-[var(--menuary-ink)] text-white">
                      <Icon size={19} strokeWidth={1.7} />
                    </div>
                    <h3 className="mt-6 text-2xl font-medium" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                      {moment.title}
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[var(--menuary-muted)]">{moment.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--menuary-line)] bg-[var(--menuary-porcelain)]">
        <div className="menuary-container grid gap-12 py-20 lg:grid-cols-[0.82fr_1.18fr] lg:py-28">
          <div>
            <p className="menuary-section-label">Moduli Orpheo</p>
            <h2 className="mt-6 text-4xl font-medium leading-tight md:text-6xl" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
              Tutto quello che serve quando l&apos;arte diventa lavoro.
            </h2>
            <p className="mt-6 text-base leading-8 text-[var(--menuary-muted)]">
              Una base solida per musicisti, scrittori, attori, performer, creator, management e uffici stampa.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {modules.map((module) => (
              <div key={module} className="flex items-start gap-3 border border-[var(--menuary-line)] bg-[var(--menuary-paper)] p-5">
                <Check size={17} strokeWidth={2} className="mt-0.5 shrink-0 text-[var(--menuary-sage)]" />
                <span className="text-sm font-semibold leading-6">{module}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--menuary-line)] bg-[#FBFAF7]">
        <div className="menuary-container py-20 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="menuary-section-label">Workflow professionale</p>
              <h2 className="mt-6 text-4xl font-medium leading-tight md:text-6xl" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
                Bello fuori. Serio dentro.
              </h2>
            </div>
            <div className="grid gap-px border border-[var(--menuary-line)] bg-[var(--menuary-line)] sm:grid-cols-2">
              {workflow.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="bg-[#FBFAF7] p-7">
                    <Icon size={22} strokeWidth={1.7} className="text-[var(--menuary-copper)]" />
                    <h3 className="mt-6 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[var(--menuary-muted)]">{item.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#17111F] text-white">
        <Image
          src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=86"
          alt="Artista sul palco davanti al pubblico"
          fill
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover opacity-42"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,17,31,0.96),rgba(23,17,31,0.72),rgba(23,17,31,0.34))]" />
        <div className="menuary-container py-20 lg:py-28">
          <div className="max-w-3xl">
            <p className="menuary-section-label text-[#d8c5ff]">Pronto per la prossima data</p>
            <h2 className="mt-6 text-4xl font-medium leading-tight md:text-6xl" style={{ fontFamily: "var(--font-menuary-display), Georgia, serif" }}>
              Dai al tuo progetto creativo una presenza all&apos;altezza del pubblico che vuoi raggiungere.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/74">
              Portiamo online il tenant Orpheo con una demo professionale, poi attiviamo i moduli utili al tuo flusso: booking, press kit, eventi, opere, fanbase, diritti e assistente AI.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/orpheo/contatti" className="menuary-button bg-white text-[#17111F] hover:bg-[#f4df9a]">
                Parliamo del progetto
                <ArrowRight size={15} strokeWidth={1.8} className="ml-1" />
              </Link>
              <Link href="/orpheo/pricing" className="menuary-button border border-white/30 bg-white/10 text-white hover:bg-white/18">
                Confronta i piani
              </Link>
            </div>
          </div>
        </div>
      </section>
    </OrpheoShell>
  );
}
