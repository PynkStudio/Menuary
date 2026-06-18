"use client";

import Link from "next/link";
import { Award, Globe2, Heart, Leaf, Target, Users } from "lucide-react";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

const values = [
  [Heart, "Rispetto", "Per gli animali, la natura e le persone. Ogni nostra scelta è guidata dal rispetto per la vita."],
  [Leaf, "Innovazione Sostenibile", "Tecnologie avanzate al servizio dell'ambiente per un futuro più verde e consapevole."],
  [Users, "Comunità", "Creiamo legami autentici con produttori locali, ospiti e collaboratori in un network di qualità."],
  [Award, "Eccellenza", "Standard elevati in ogni dettaglio, dalla coltivazione all'ospitalità, senza mai scendere a compromessi."],
] as const;

export function CascinaErranteAboutPage() {
  const href = useTenantLocalizedHref();

  return (
    <div className="ce-site">
      <section className="ce-page-hero ce-page-hero-forest">
        <p>Chi Siamo</p>
        <h1>Errante è una filosofia di vita.</h1>
        <blockquote>
          “Una filosofia che abbraccia il rispetto, l&apos;innovazione e
          l&apos;eccellenza in ogni suo aspetto.”
        </blockquote>
      </section>

      <section className="ce-manifesto">
        <p className="ce-eyebrow">Il Nostro Manifesto</p>
        <h2>Radici agricole, visione contemporanea.</h2>
        <div>
          <p><strong>Cascina Errante</strong> nasce dalla visione di un&apos;agricoltura che guarda al futuro senza dimenticare le radici. Siamo un progetto agricolo e gastronomico innovativo che unisce l&apos;anima rurale alla qualità e alla visione contemporanea dell&apos;alta ospitalità.</p>
          <p>La nostra è un&apos;<strong>identità multipla</strong>: siamo cascina e siamo movimento, siamo tradizione e siamo innovazione. Come il nostro nome suggerisce, non ci limitiamo a un singolo luogo o concetto, ma portiamo la nostra filosofia ovunque ci sia spazio per la bellezza e la qualità.</p>
          <p>Ogni giorno lavoriamo per dimostrare che è possibile creare <strong>eccellenza senza compromessi etici</strong>, che l&apos;innovazione può servire la natura, e che l&apos;ospitalità di lusso può essere profondamente rispettosa di tutti gli esseri viventi.</p>
        </div>
      </section>

      <section className="ce-values-section">
        <div className="ce-heading">
          <p>Ciò che ci guida</p>
          <h2>I Nostri Valori</h2>
          <span>Principi solidi che guidano ogni decisione, dalla coltivazione all&apos;accoglienza dei nostri ospiti.</span>
        </div>
        <div className="ce-values-grid">
          {values.map(([Icon, title, description]) => (
            <article key={title}><Icon size={26} /><h3>{title}</h3><p>{description}</p></article>
          ))}
        </div>
      </section>

      <section className="ce-innovation">
        <div>
          <p className="ce-eyebrow">Innovazione Agricola</p>
          <h2>La natura incontra la tecnologia.</h2>
          <p>Produciamo internamente la maggior parte delle materie prime attraverso un sistema agricolo all&apos;avanguardia che combina rispetto ambientale e innovazione.</p>
          <ul>
            <li><Target size={19} />Coltivazioni idroponiche verticali NFT con torri modulari</li>
            <li><Leaf size={19} />Produzione di rizoma di loto edibile e ingredienti ricercati</li>
            <li><Globe2 size={19} />Laghetto naturale e animali da cortile in libertà</li>
          </ul>
        </div>
        <div className="ce-innovation-mark">E</div>
      </section>

      <section className="ce-collaboration">
        <h2>Collaborazioni</h2>
        <p>Produttori etici, ristoratori sostenibili, organizzatori di eventi consapevoli: se la tua visione si allinea con la nostra, parliamone.</p>
        <Link href={href("/contatti")} className="ce-button ce-button-forest">Contattaci per collaborare</Link>
      </section>
    </div>
  );
}
