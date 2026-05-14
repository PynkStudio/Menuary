"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type Photo = { src: string; alt: string; caption?: string };

export function Gallery({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {photos.map((p, i) => {
          const span =
            i % 7 === 0
              ? "md:col-span-2 md:row-span-2"
              : i % 5 === 0
              ? "md:row-span-2"
              : "";
          return (
            <button
              key={p.src}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-2xl bg-pork-ink/10 transition-all hover:z-10 hover:shadow-2xl",
                span
              )}
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              {p.caption && (
                <p className="impact-title absolute bottom-3 left-4 right-4 text-left text-lg text-pork-cream opacity-0 transition-opacity group-hover:opacity-100">
                  {p.caption}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {active !== null && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-pork-ink/90 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-pork-cream text-pork-ink transition-transform hover:scale-110"
            onClick={() => setActive(null)}
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
          <div className="relative h-full max-h-[85vh] w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[active].src}
              alt={photos[active].alt}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
