import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  ChefHat,
  Globe2,
  Layers3,
  MonitorSmartphone,
  PanelsTopLeft,
  Settings2,
  Sparkles,
} from "lucide-react";
import { Hero } from "@/components/hero";
import { ThreeSouls } from "@/components/three-souls";
import { SignatureDishes } from "@/components/signature-dishes";
import { FixedMenus } from "@/components/fixed-menus";
import { ReviewsSection } from "@/components/reviews-section";
import { FindUs } from "@/components/find-us";
import { DeliveryStrip } from "@/components/delivery-strip";
import { getPlatformModeFromHost } from "@/lib/platform";

function TenantHome() {
  return (
    <>
      <Hero />
      <ThreeSouls />
      <SignatureDishes />
      <FixedMenus />
      <ReviewsSection />
      <FindUs />
      <DeliveryStrip />
    </>
  );
}

function MarketingHome() {
  return (
    <div className="min-h-screen bg-[#f7f2eb] text-[#16120f]">
      <section className="relative overflow-hidden px-5 pb-20 pt-6 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full bg-white/88 px-4 py-3 shadow-[0_24px_80px_rgba(20,16,16,0.08)] ring-1 ring-black/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#17120f] text-[#f7f2eb]">
              <PanelsTopLeft size={18} />
            </div>
            <div>
              <p className="impact-title text-sm text-[#b8332e]">Menuary</p>
              <p className="text-xs text-black/55">Restaurant site platform</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="#sistema" className="rounded-full px-4 py-2 text-sm font-semibold text-black/68 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/5 hover:text-black">
              Sistema
            </Link>
            <Link href="#moduli" className="rounded-full px-4 py-2 text-sm font-semibold text-black/68 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/5 hover:text-black">
              Moduli
            </Link>
            <Link href="#demo" className="rounded-full px-4 py-2 text-sm font-semibold text-black/68 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/5 hover:text-black">
              Demo
            </Link>
            <Link href="/pricing" className="rounded-full px-4 py-2 text-sm font-semibold text-black/68 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/5 hover:text-black">
              Pricing
            </Link>
          </div>
          <a
            href="https://admin.menuary.it"
            className="group inline-flex items-center gap-2 rounded-full bg-[#17120f] px-4 py-2.5 text-sm font-semibold text-[#f7f2eb] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
          >
            Pannello
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/12 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
              <ArrowRight size={14} />
            </span>
          </a>
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7f6258] shadow-[0_18px_50px_rgba(20,16,16,0.05)] ring-1 ring-black/5">
              <Sparkles size={12} />
              sito, menu, ordini, admin
            </div>
            <h1 className="headline mt-6 text-6xl text-[#17120f] sm:text-7xl lg:text-[6.8rem]">
              La piattaforma per vendere siti ristorante veri, non pagine isolate.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-black/68">
              Menuary unifica dominio, identita, preview commerciali, menu digitali,
              ordini e moduli attivabili in una sola infrastruttura multi-tenant.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/contatti"
                className="group inline-flex items-center gap-3 rounded-full bg-[#b8332e] px-5 py-3 text-base font-bold text-white shadow-[0_18px_40px_rgba(184,51,46,0.22)] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-[#8e2420]"
              >
                Richiedi una demo
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/18 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                  <ArrowRight size={16} />
                </span>
              </Link>
              {[
                ["Preview BePork", "https://demo.menuary.it/bepork-demo"],
                ["Preview FAAK", "https://demo.menuary.it/faak-demo"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="group inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-base font-bold text-[#17120f] shadow-[0_18px_40px_rgba(20,16,16,0.08)] ring-1 ring-black/5 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
                >
                  {label}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/6 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                    <ArrowRight size={16} />
                  </span>
                </a>
              ))}
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-3 rounded-full bg-[#f1dfc8] px-5 py-3 text-base font-bold text-[#6e342d] ring-1 ring-[#b8332e]/10 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
              >
                Vedi struttura offerta
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                  <ArrowRight size={16} />
                </span>
              </Link>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                ["1 codebase", "tenant aggiornati insieme"],
                ["3 fronti", "marketing, demo, dominio"],
                ["n moduli", "attivabili per ristorante"],
              ].map(([value, label]) => (
                <div key={value} className="rounded-[1.75rem] bg-white p-4 shadow-[0_24px_60px_rgba(20,16,16,0.05)] ring-1 ring-black/5">
                  <p className="impact-title text-xl text-[#b8332e]">{value}</p>
                  <p className="mt-1 text-sm text-black/58">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2.25rem] bg-white/74 p-2 shadow-[0_40px_100px_rgba(20,16,16,0.12)] ring-1 ring-black/5">
              <div className="overflow-hidden rounded-[2rem] bg-[#17120f] p-4 text-white">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/48">
                      live tenant preview
                    </p>
                    <p className="impact-title text-2xl">BePork + FAAK</p>
                  </div>
                  <span className="rounded-full bg-[#f5c518] px-3 py-1 text-xs font-black text-[#17120f]">
                    attivo
                  </span>
                </div>
                <div className="grid gap-4 pt-4 sm:grid-cols-[1.05fr_0.95fr]">
                  <div className="relative min-h-[320px] overflow-hidden rounded-[1.6rem]">
                    <Image
                      src="/photos/burger-esagerato.png"
                      alt="Esempio visual tenant ristorante"
                      fill
                      priority
                      sizes="(min-width: 1024px) 32rem, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="impact-title text-sm text-[#f5c518]">Hero brandizzato</p>
                      <p className="headline mt-2 text-4xl">Ordini, menu e identita.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      ["Preview demo", "demo.menuary.it/bepork-demo"],
                      ["Secondo tenant", "demo.menuary.it/faak-demo"],
                      ["Feature flags", "brand, recapiti, visual"],
                    ].map(([title, value]) => (
                      <div key={title} className="rounded-[1.45rem] bg-white/8 p-4 ring-1 ring-white/10">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/48">{title}</p>
                        <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sistema" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7f6258] ring-1 ring-black/5">
              architettura
            </p>
            <h2 className="headline mt-5 text-5xl sm:text-6xl">
              Un sistema unico, con superfici diverse per vendita, demo e operativita.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] bg-white p-2 shadow-[0_28px_80px_rgba(20,16,16,0.08)] ring-1 ring-black/5">
              <div className="grid gap-5 rounded-[1.65rem] bg-[#17120f] p-6 text-white md:grid-cols-2">
                {[
                  [Globe2, "menuary.it", "Sito vetrina prodotto per outreach e lead generation."],
                  [Settings2, "admin.menuary.it", "Pannello centrale per tenant, moduli e preview."],
                  [MonitorSmartphone, "demo.menuary.it", "Anteprime condivisibili prima del dominio finale."],
                  [ChefHat, "domini tenant", "Esperienza ristorante completa e area operativa locale."],
                ].map(([Icon, title, body]) => (
                  <article key={title as string} className="rounded-[1.45rem] bg-white/8 p-5 ring-1 ring-white/10">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5c518] text-[#17120f]">
                      <Icon size={18} />
                    </div>
                    <h3 className="impact-title mt-4 text-2xl">{title as string}</h3>
                    <p className="mt-2 text-sm leading-7 text-white/68">{body as string}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-5">
              {[
                [BadgeCheck, "Update centralizzati", "Nuove funzionalita introdotte una volta si propagano ai tenant."],
                [Layers3, "Configurazione per tenant", "Brand, dati, domini e moduli restano indipendenti."],
                [Sparkles, "Sales-ready preview", "Le demo diventano un asset operativo del processo commerciale."],
              ].map(([Icon, title, body]) => (
                <article key={title as string} className="rounded-[2rem] bg-white p-6 shadow-[0_24px_60px_rgba(20,16,16,0.06)] ring-1 ring-black/5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f1dfc8] text-[#b8332e]">
                    <Icon size={18} />
                  </div>
                  <h3 className="impact-title mt-4 text-2xl text-[#b8332e]">{title as string}</h3>
                  <p className="mt-2 text-sm leading-7 text-black/66">{body as string}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="moduli" className="bg-[#17120f] px-5 py-24 text-[#f7f2eb] sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#f5c518] ring-1 ring-white/10">
                moduli
              </p>
              <h2 className="headline mt-5 text-5xl sm:text-6xl">
                Ogni ristorante parte leggero e attiva solo cio che serve.
              </h2>
            </div>
            <p className="max-w-md text-base leading-8 text-white/64">
              Il pannello centrale controlla disponibilita funzionali e stato tenant.
              L&apos;area personale del locale gestisce invece operativita e contenuti.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Menu digitale", "Categorie, piatti, foto, extra e disponibilita."],
              ["Ordini", "Asporto, tavolo, checkout e conferme."],
              ["Cucina", "Schermo di lavorazione e stati ordine."],
              ["Tenant admin", "Configurazione locale, orari e strumenti gestionali."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-[2rem] bg-white/[0.06] p-6 ring-1 ring-white/10">
                <p className="impact-title text-2xl text-[#f5c518]">{title}</p>
                <p className="mt-3 text-sm leading-7 text-white/68">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="px-5 py-24 sm:px-8 lg:px-12 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#7f6258] ring-1 ring-black/5">
              outreach
            </p>
            <h2 className="headline mt-5 text-5xl sm:text-6xl">
              Mostra una preview prima di vendere il progetto definitivo.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-black/68">
              Menuary permette di creare un tenant demo, inviare un link condivisibile
              e trasformarlo poi nel sito live associando il dominio finale.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                ["Apri demo BePork", "https://demo.menuary.it/bepork-demo"],
                ["Apri demo FAAK", "https://demo.menuary.it/faak-demo"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="group inline-flex items-center gap-3 rounded-full bg-[#17120f] px-5 py-3 text-base font-bold text-white transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5"
                >
                  {label}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/12 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                    <ArrowRight size={16} />
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {["/photos/burger-assassina.png", "/photos/orecchiette-padella.png", "/photos/pizza-multigusto.png", "/photos/tagliata-pork.png"].map((src, index) => (
              <div
                key={src}
                className="overflow-hidden rounded-[2rem] bg-white p-2 shadow-[0_26px_70px_rgba(20,16,16,0.08)] ring-1 ring-black/5"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.65rem]">
                  <Image
                    src={src}
                    alt={`Esempio contenuto demo ${index + 1}`}
                    fill
                    sizes="(min-width: 1024px) 18rem, 45vw"
                    className="object-cover transition duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.03]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28">
        <div className="mx-auto max-w-7xl rounded-[2.25rem] bg-[#b8332e] p-2 shadow-[0_36px_100px_rgba(184,51,46,0.22)]">
          <div className="rounded-[1.95rem] bg-[#8e2420] px-6 py-10 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-12 lg:py-12">
            <div className="max-w-3xl">
              <p className="impact-title text-sm text-[#f5c518]">menuary.it</p>
              <h2 className="headline mt-4 text-5xl sm:text-6xl">
                Porta un ristorante da demo a dominio live senza rifare il prodotto.
              </h2>
            </div>
            <Link
              href="/contatti"
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-base font-bold text-[#8e2420] transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 lg:mt-0"
            >
              Parliamone
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8e2420]/10 transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default async function HomePage() {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  return mode === "marketing" ? <MarketingHome /> : <TenantHome />;
}
