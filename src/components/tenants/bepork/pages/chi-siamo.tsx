import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

const souls = [
  {
    kicker: "American Taste",
    title: "Burger House",
    image: "/photos/burger-esagerato.png",
    body: "Smash patty, scottona, pulled, bacon in due consistenze. Non facciamo panini dietetici: facciamo i panini che ti ricordi. Tredici firme, zero compromessi.",
  },
  {
    kicker: "Italian Style",
    title: "Pizza House",
    image: "/photos/pizza-multigusto.png",
    body: "Impasto che resta stomaco-friendly, farciture che non hanno paura di essere generose. Dalle classiche come si deve alle speciali Be Pork, fino alla pizza all'Assassina.",
  },
  {
    kicker: "Tradizione Pugliese",
    title: "Cucina di casa",
    image: "/photos/orecchiette-brasciole.png",
    body: "Orecchiette con le brasciole, tagliata Angus, stinco di maiale, bombette in fonduta. La Puglia che ci portiamo da sempre, con la faccia pulita e il piatto pieno.",
  },
];

export function BeporkAboutPage() {
  return (
    <>
      <section className="bg-pork-ink pt-32 pb-16 text-pork-cream md:pt-40 md:pb-24">
        <div className="container-wide grid gap-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <span className="chip-mustard">Chi siamo</span>
            <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl text-balance">
              Be Pork non è un pranzo.
              <br />
              <span className="text-pork-mustard">È una posizione sul mondo.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-pork-cream/75 text-pretty">
              Siamo un ristorante con tre anime dichiarate, nel cuore di Bari.
              Ristorante, pizzeria, burger house: niente etichette, tutto sul piatto.
              Mangiare bene senza mettersi cravatta.
            </p>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-sm isolate">
            <Image
              src="/logo-payoff.png"
              alt="Be Pork — Mordi e Godi"
              fill
              unoptimized
              sizes="(max-width: 1024px) 60vw, 320px"
              className="object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>
      </section>

      <section className="bg-pork-cream py-20 md:py-28">
        <div className="container-wide space-y-16">
          {souls.map((s, i) => (
            <article
              key={s.title}
              className={`grid gap-8 md:grid-cols-2 md:items-center ${
                i % 2 === 1 ? "md:[&>div:first-child]:order-last" : ""
              }`}
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-pork-ink shadow-xl">
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div>
                <span className="impact-title text-sm text-pork-red">{s.kicker}</span>
                <h2 className="headline mt-2 text-4xl sm:text-5xl lg:text-6xl">{s.title}</h2>
                <p className="mt-4 text-lg text-pork-ink/75">{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-pork-peach/50 py-20 md:py-28">
        <div className="container-wide">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1">
              <span className="chip-red">Il metodo</span>
              <h2 className="headline mt-4 text-4xl sm:text-5xl lg:text-6xl text-balance">
                Poche regole.
                <br />
                <span className="text-pork-red">Tutte serie.</span>
              </h2>
            </div>
            <ul className="space-y-5 md:col-span-2">
              {[
                {
                  n: "01",
                  t: "Materia prima prima di tutto",
                  d: "Scottona, Angus, crudo di Parma, mortadella al pistacchio, mozzarella di bufala. Ingredienti che si riconoscono nel piatto.",
                },
                {
                  n: "02",
                  t: "Porzioni oneste",
                  d: "Se esci con fame, sbagliamo noi. I nostri menu fissi nascono per farti alzare dalla sedia soddisfatto.",
                },
                {
                  n: "03",
                  t: "Atmosfera senza posa",
                  d: "Non ci vestiamo da fine dining. Vieni come sei, ordini come vuoi, torni quando ti va.",
                },
              ].map((r) => (
                <li
                  key={r.n}
                  className="flex items-start gap-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-pork-ink/5"
                >
                  <span className="impact-title text-5xl leading-none text-pork-red">{r.n}</span>
                  <div>
                    <h3 className="impact-title text-2xl">{r.t}</h3>
                    <p className="mt-1 text-pork-ink/70">{r.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-pork-ink py-16 text-pork-cream">
        <div className="container-wide flex flex-col items-center gap-6 text-center">
          <h2 className="headline text-4xl sm:text-5xl lg:text-6xl text-balance">
            Vieni a trovarci in
            <br />
            <span className="text-pork-mustard">{siteConfig.address.street}.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mustard"
            >
              <MessageCircle size={18} />
              Prenota un tavolo
            </a>
            <Link href="/menu" className="btn-ghost-light">
              Guarda il menu
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
