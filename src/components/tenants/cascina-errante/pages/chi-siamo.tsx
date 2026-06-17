"use client";

import Image from "next/image";
import type { ComponentType } from "react";
import { Beaker, ChefHat, Leaf } from "lucide-react";

const values: Array<{
  icon: ComponentType<{ size?: number }>;
  title: string;
  text: string;
}> = [
  {
    icon: ChefHat,
    title: "Cucina teatro",
    text: "La brigata diventa parte dell'esperienza e accompagna l'ospite dentro il processo.",
  },
  {
    icon: Leaf,
    title: "Agricoltura visibile",
    text: "Microgreens, erbe e prodotti di cascina raccontano stagionalita e disponibilita.",
  },
  {
    icon: Beaker,
    title: "Laboratorio demo",
    text: "Ogni workflow operativo puo essere provato in sicurezza, pagamenti inclusi.",
  },
];

export function CascinaErranteAboutPage() {
  return (
    <div className="cascina-page cascina-static">
      <section className="cascina-static-hero">
        <Image
          src="/cascina-errante/logo-horizontal.png"
          alt="Cascina Errante"
          width={902}
          height={264}
          priority
        />
        <p className="cascina-kicker">Chi siamo</p>
        <h1>Una cascina immaginata per far lavorare tutta Menuary.</h1>
        <p>
          Cascina Errante unisce ristorante, bottega, adventure food ed eventi:
          una demo narrativa abbastanza ricca da mettere alla prova ogni modulo
          della piattaforma senza dipendere da un tenant cliente reale.
        </p>
      </section>
      <section className="cascina-values">
        {values.map(({ icon: Icon, title, text }) => {
          return (
            <article key={title}>
              <Icon size={28} />
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
