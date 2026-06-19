"use client";

import { Suspense, type ReactNode } from "react";
import { InteractiveMenu } from "@/components/modules/menu/interactive-menu";
import { DeliveryStrip } from "@/components/modules/shop/delivery-strip";
import { MenuIntroParagraph } from "@/components/modules/menu/menu-intro-paragraph";
import { MenuActiveTableBar } from "@/components/modules/table-orders/menu-active-table-bar";
import { MenuaryAuthHintGate } from "@/components/modules/menu/menuary-auth-hint-gate";
import { PersonalizedMenuHint } from "@/components/modules/menu/personalized-menu-hint";
import { useTenant } from "@/components/core/tenant-provider";

export function MenuPageShell({
  hasGlobalHeader = true,
  hero,
}: {
  hasGlobalHeader?: boolean;
  hero?: ReactNode;
}) {
  const tenant = useTenant();
  const isFaak = tenant.id === "faak";
  const isDoca = tenant.id === "doca";
  const isNomSushi = tenant.id === "nom-sushi";
  const isKimos = tenant.id === "kimos";

  return (
    <>
      {!isDoca && <MenuaryAuthHintGate />}
      {!isDoca && <PersonalizedMenuHint />}
      {!isDoca && hero}
      {!isDoca && !hero && (
        <section className="tenant-menu-hero relative bg-pork-ink pt-32 pb-12 text-pork-cream md:pt-40 md:pb-16">
          <div className="container-wide">
            <span className="chip-mustard">Menu</span>
            <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl text-balance">
              {isFaak ? (
                <>
                  Mattina, giorno,
                  <br />
                  <span className="text-pork-mustard">sera e ribellione naturale.</span>
                </>
              ) : isNomSushi ? (
                <>
                  Roll, nigiri,
                  <br />
                  {" "}
                  <span className="text-pork-mustard">aperisushi e cena.</span>
                </>
              ) : isKimos ? (
                <>
                  Pizza, kebab,
                  <br />
                  <span className="text-pork-mustard">fritti e fame vera.</span>
                </>
              ) : (
                <>
                  Qui si mangia
                  <br />
                  <span className="text-pork-mustard">
                    con la forchetta e con le mani.
                  </span>
                </>
              )}
            </h1>
            {isFaak ? (
              <p className="mt-6 max-w-2xl text-lg text-pork-cream/75 text-pretty">
                Il menu demo cambia lessico, categorie e contenuti: non e il listino
                ThePork con un altro logo, ma una struttura costruita sul ritmo FAAK.
              </p>
            ) : isNomSushi ? (
              <p className="mt-6 max-w-2xl text-lg text-pork-cream/75 text-pretty">
                Pranzo AYCE, aperisushi e cena hanno sezioni e disponibilità diverse.
                Qui il cliente trova subito crudi, dim sum, gunkan, roll e formule Nøm.
              </p>
            ) : isKimos ? (
              <p className="mt-6 max-w-2xl text-lg text-pork-cream/75 text-pretty">
                Una carta ampia e diretta per Santa Giulia: pizze tradizionali,
                kebab, panini, focacce, fritti e menu completi ordinabili online.
              </p>
            ) : (
              <MenuIntroParagraph />
            )}
            <MenuActiveTableBar />
          </div>
        </section>
      )}

      <Suspense fallback={null}>
        <InteractiveMenu hasGlobalHeader={hasGlobalHeader} />
      </Suspense>

      <DeliveryStrip />
    </>
  );
}
