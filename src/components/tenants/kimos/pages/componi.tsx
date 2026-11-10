"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ShoppingBag } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { DishBuilder, type DishBuilderSubmit } from "@/components/modules/dish-builder/dish-builder";
import { CartDrawer } from "@/components/modules/shop/cart-drawer";
import { CartFlyOverlay } from "@/components/modules/shop/cart-fly-overlay";
import { getTenantDishRecipes } from "@/lib/dish-builder/tenant-recipes";
import { spawnCartFly } from "@/lib/cart-fly";
import { useCartStore, cartCount } from "@/store/cart-store";

export function KimosComponiPage() {
  const tenant = useTenant();
  const router = useRouter();
  const params = useSearchParams();
  const recipes = getTenantDishRecipes(tenant.id);
  const recipe = recipes.find((r) => r.id === params.get("piatto")) ?? recipes[0];
  const prefix = tenant.previewSlug ? `/${tenant.previewSlug}` : "";
  const addLine = useCartStore((s) => s.addLine);
  const setOpen = useCartStore((s) => s.setOpen);
  const count = useCartStore((s) => cartCount(s.lines));
  const [added, setAdded] = useState(0);
  const [round, setRound] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!recipe) return null;

  const submit = ({ line, from }: DishBuilderSubmit) => {
    addLine(line);
    spawnCartFly(from, recipe.coverImage ?? null);
    setAdded((n) => n + 1);
  };

  return (
    <main className="km-site km-componi">
      <header className="km-header">
        <Link href={prefix || "/"} className="km-brand" aria-label="Pizzeria Kimos home">
          <Image src="/kimos/logo.svg" alt="Pizzeria Kimos" width={210} height={64} priority />
        </Link>
        <nav className="km-nav" aria-label="Navigazione principale">
          <Link href={`${prefix}/menu`}>Menu</Link>
        </nav>
        <button type="button" className="km-button km-button-hot km-header-order" onClick={() => setOpen(true)} data-cart-fab-target>
          Carrello{count > 0 ? ` · ${count}` : ""} <ShoppingBag size={16} />
        </button>
      </header>

      <DishBuilder
        key={`${recipe.id}-${round}`}
        recipe={recipe}
        locale="it"
        copy={{ submit: "Inforna e aggiungi" }}
        onBack={() => router.push(`${prefix}/menu`)}
        onSubmit={submit}
        className="km-componi-builder"
      />

      {mounted && added > 0
        ? createPortal(
            // Portale sul body (position:fixed nel tenant e' rotto dai transform): l'attributo
            // data-tenant-surface riporta qui lo stile Kimos.
            <div data-tenant-surface="kimos" className="km-componi-done-layer" onClick={() => setAdded(0)}>
              <div className="km-componi-done" role="dialog" aria-modal="true" aria-labelledby="km-componi-done-title" onClick={(e) => e.stopPropagation()}>
                <p className="km-componi-done-kicker">Fatto</p>
                <h2 id="km-componi-done-title">La tua pizza è nel carrello</h2>
                <p>Puoi completare l&apos;ordine o comporne un&apos;altra.</p>
                <div className="km-componi-done-actions">
                  <button
                    type="button"
                    className="km-button km-button-hot"
                    onClick={() => {
                      setAdded(0);
                      setOpen(true);
                    }}
                  >
                    Vai al carrello
                  </button>
                  <button
                    type="button"
                    className="km-button km-componi-again"
                    onClick={() => {
                      setAdded(0);
                      setRound((r) => r + 1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Componine un&apos;altra
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      <CartFlyOverlay />
      <CartDrawer />
    </main>
  );
}
