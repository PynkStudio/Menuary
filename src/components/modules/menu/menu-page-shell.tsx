"use client";

import { Suspense } from "react";
import { InteractiveMenu } from "@/components/modules/menu/interactive-menu";
import { DeliveryStrip } from "@/components/modules/shop/delivery-strip";
import { MenuIntroParagraph } from "@/components/modules/menu/menu-intro-paragraph";
import { MenuActiveTableBar } from "@/components/modules/table-orders/menu-active-table-bar";
import { MenuaryAuthHintGate } from "@/components/modules/menu/menuary-auth-hint-gate";
import { PersonalizedMenuHint } from "@/components/modules/menu/personalized-menu-hint";
import { useTenant } from "@/components/core/tenant-provider";

export function MenuPageShell() {
  const tenant = useTenant();
  const isFaak = tenant.id === "faak";

  return (
    <>
      <MenuaryAuthHintGate />
      <PersonalizedMenuHint />
      <section className="relative bg-pork-ink pt-32 pb-12 text-pork-cream md:pt-40 md:pb-16">
        <div className="container-wide">
          <span className="chip-mustard">Menu</span>
          <h1 className="headline mt-4 text-6xl sm:text-7xl lg:text-8xl text-balance">
            {isFaak ? (
              <>
                Mattina, giorno,
                <br />
                <span className="text-pork-mustard">sera e ribellione naturale.</span>
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
              Be Pork con un altro logo, ma una struttura costruita sul ritmo FAAK.
            </p>
          ) : (
            <MenuIntroParagraph />
          )}
          <MenuActiveTableBar />
        </div>
      </section>

      <Suspense fallback={null}>
        <InteractiveMenu />
      </Suspense>

      <DeliveryStrip />
    </>
  );
}
