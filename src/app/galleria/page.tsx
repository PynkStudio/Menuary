import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Gallery } from "@/components/modules/gallery/gallery";
import { whatsappUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Galleria",
  description:
    "Foto dei piatti firma di Be Pork: burger smashati, pizze speciali, tagliata Angus, spaghetti all'Assassina, bombette in fonduta.",
};

const photos = [
  { src: "/photos/burger-esagerato.png", alt: "The King Burger / Esagerato Pork", caption: "Esagerato Pork" },
  { src: "/photos/burger-assassina.png", alt: "Assassina Pork burger con spaghetti", caption: "Assassina Pork" },
  { src: "/photos/burger-godo.png", alt: "Godo Pork burger con parmigiana", caption: "Godo Pork" },
  { src: "/photos/burger-porkpistacchio.png", alt: "Porkpistacchio burger", caption: "Porkpistacchio 2.0" },
  { src: "/photos/pizza-multigusto.png", alt: "Pizza multigusto a 4 sezioni", caption: "Multigusto" },
  { src: "/photos/chips-bacon-cheddar.png", alt: "Chips bacon e cheddar", caption: "Chips bacon & cheddar" },
  { src: "/photos/tagliata-pork.png", alt: "Tagliata Pork Angus", caption: "Tagliata Pork" },
  { src: "/photos/stinco-pork.png", alt: "Stinco Pork con patate", caption: "Stinco Pork" },
  { src: "/photos/bombette-fonduta.png", alt: "Bombette in fonduta", caption: "Bombette in fonduta" },
  { src: "/photos/orecchiette-brasciole.png", alt: "Orecchiette con le brasciole", caption: "Orecchiette & brasciole" },
  { src: "/photos/orecchiette-padella.png", alt: "Orecchiette con le brasciole in padella", caption: "La domenica, ogni sera" },
];

export default function GalleriaPage() {
  return (
    <>
      <section className="bg-pork-ink pt-32 pb-12 text-pork-cream md:pt-40 md:pb-16">
        <div className="container-wide">
          <span className="chip-mustard">Galleria</span>
          <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl text-balance">
            L&apos;occhio mangia prima.
            <br />
            <span className="text-pork-mustard">Poi tocca a te.</span>
          </h1>
        </div>
      </section>

      <section className="bg-pork-cream py-16 md:py-20">
        <div className="container-wide">
          <Gallery photos={photos} />
        </div>
      </section>

      <section className="bg-pork-peach/50 py-16">
        <div className="container-wide flex flex-col items-center gap-6 text-center">
          <h2 className="headline text-4xl sm:text-5xl lg:text-6xl text-balance">
            Le foto fanno il loro.
            <br />
            <span className="text-pork-red">Il resto si fa in sala.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <MessageCircle size={18} />
              Prenota un tavolo
            </a>
            <Link href="/menu" className="btn-ghost">
              Sfoglia il menu
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
