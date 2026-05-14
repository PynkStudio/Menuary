"use client";

import type { CSSProperties } from "react";
import { useCartFlyStore } from "@/store/cart-fly-store";

export function CartFlyOverlay() {
  const particles = useCartFlyStore((s) => s.particles);

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="cart-fly-particle absolute h-11 w-11 overflow-hidden rounded-full bg-pork-mustard shadow-lg ring-2 ring-pork-ink/15"
          style={
            {
              left: p.x0,
              top: p.y0,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
            } as CSSProperties
          }
        >
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- thumbnail effimero, URL menu arbitrari
            <img src={p.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg">
              🐷
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
