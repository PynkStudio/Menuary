"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  Compass,
  Heart,
  Home,
  Leaf,
  Mountain,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const sections = [
  ["La Cascina", "Ospitalità elegante e fattoria innovativa nel cuore della natura lombarda", "/chi-siamo", "Scopri la cascina", Home, "forest"],
  ["La Bottega", "Prodotti freschi, liofilizzati e conserve della nostra produzione", "/menu", "Esplora i prodotti", ShoppingBag, "pop"],
  ["Errante Adventure", "Liofilizzati gourmet e esperienze outdoor per esploratori esigenti", "/menu", "Scopri i kit", Mountain, "accent"],
  ["Eventi & Privé", "Food truck premium ed esperienze itineranti su misura", "/prenota", "Richiedi un evento", CalendarDays, "warm"],
] as const;

const products = [
  "Microgreens Premium",
  "Miele Aromatizzato",
  "Erbe Aromatiche",
  "Verdure Idroponiche",
  "Rizoma di Loto",
  "Funghi Orientali",
  "Fiori Edibili",
  "Uova di Papera",
];

export function CascinaErranteHomePage() {
  const href = useTenantLocalizedHref();

  return (
    <div className="ce-site">
      <section className="ce-home-hero">
        <div className="ce-home-hero-shade" />
        <div className="ce-home-hero-copy">
          <Image
            src="/cascina-errante/logo-horizontal.png"
            alt="Cascina Errante"
            width={902}
            height={264}
            priority
            className="ce-home-logo"
          />
          <h1>Poesia e Fantasia</h1>
          <p>
            Dove tradizione e innovazione si incontrano nel cuore della natura
            lombarda. Cascina, bottega, avventure e eventi in un&apos;esperienza
            che rispetta la natura e celebra l&apos;eccellenza.
          </p>
          <Link href={href("/chi-siamo")} className="ce-button ce-button-light">
            Scopri la nostra storia <ArrowRight size={18} />
          </Link>
        </div>
        <div className="ce-home-next"><Leaf size={18} />Dal campo al piatto</div>
      </section>

      <section className="ce-section">
        <div className="ce-heading">
          <p>Quattro identità, una visione</p>
          <h2>Le Nostre Anime Creative</h2>
          <span>
            Ogni aspetto di Cascina Errante racconta una storia diversa, unita
            dalla passione per la qualità e il rispetto per la natura.
          </span>
        </div>
        <div className="ce-souls-grid">
          {sections.map(([title, description, path, cta, Icon, tone]) => (
            <Link key={title} href={href(path)} className={`ce-soul ce-soul-${tone}`}>
              <span className="ce-soul-icon"><Icon size={28} /></span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
                <strong>{cta}<ArrowRight size={15} /></strong>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="ce-theatre">
        <div className="ce-theatre-copy">
          <p className="ce-eyebrow">La Cascina</p>
          <h2>Il Teatro della Cucina</h2>
          <p>
            Nel cuore della Lombardia, un antico fienile trasformato in un
            ristorante unico. La cucina diventa spettacolo e i nostri
            ingredienti idroponici diventano arte.
          </p>
          <div className="ce-theatre-stats">
            <span><strong>10</strong> posti esclusivi intorno alla cucina centrale</span>
            <span><strong>20</strong> tavoli con vista panoramica dall&apos;alto</span>
          </div>
          <Link href={href("/prenota")} className="ce-button ce-button-forest">
            <CalendarDays size={18} />Vivi l&apos;esperienza
          </Link>
        </div>
        <div className="ce-theatre-scene">
          <ChefHat size={54} />
          <blockquote>“Ogni pasto è uno spettacolo unico”</blockquote>
          <div><Sparkles size={18} /> Cucina a vista</div>
        </div>
      </section>

      <section className="ce-production">
        <div className="ce-heading ce-heading-left">
          <p>Produzione a Vista</p>
          <h2>Dal campo al piatto, sotto i vostri occhi.</h2>
          <span>
            Le serre idroponiche con pareti in vetro permettono ai commensali di
            osservare l&apos;intero ciclo: dalla crescita alla trasformazione in cucina.
          </span>
        </div>
        <div className="ce-products">
          {products.map((product) => (
            <div key={product}><Leaf size={17} /><span>{product}</span></div>
          ))}
        </div>
      </section>

      <section className="ce-philosophy">
        <Heart size={30} />
        <p className="ce-eyebrow">La Nostra Filosofia</p>
        <blockquote>
          “Errante non è solo un nome, è la nostra essenza: un viaggio continuo
          tra tradizione e innovazione, tra rispetto per la natura e ricerca
          dell&apos;eccellenza.”
        </blockquote>
        <div className="ce-principles">
          <span><Leaf size={21} /><strong>Sostenibilità</strong>Ogni scelta guidata dal rispetto per l&apos;ambiente</span>
          <span><Compass size={21} /><strong>Innovazione</strong>Tecnologia al servizio della tradizione</span>
          <span><Sparkles size={21} /><strong>Eccellenza</strong>Qualità senza compromessi in ogni dettaglio</span>
        </div>
      </section>

      <section className="ce-final-cta">
        <h2>Inizia il Tuo Viaggio con Noi</h2>
        <p>
          Che tu voglia assaporare i nostri prodotti o vivere un&apos;esperienza
          speciale, siamo qui per creare insieme qualcosa di indimenticabile.
        </p>
        <div>
          <Link href={href("/prenota")} className="ce-button ce-button-light">Prenota l&apos;esperienza</Link>
          <Link href={href("/menu")} className="ce-button ce-button-outline-light">Scopri menu e bottega</Link>
        </div>
      </section>
    </div>
  );
}
