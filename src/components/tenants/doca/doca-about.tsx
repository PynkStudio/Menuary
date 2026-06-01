"use client";

import Image from "next/image";
import { useDocaCopy } from "@/lib/doca-i18n";

export function DocaAbout() {
  const text = useDocaCopy();

  return (
    <section className="doca-about bg-pork-cream py-20 md:py-28">
      <div className="container-wide grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative min-h-[30rem] overflow-hidden rounded-3xl bg-pork-ink shadow-xl">
          <Image
            src="/doca/proprietaria-al-lavoro.webp"
            alt="Queren Girardi al lavoro nel laboratorio di Doca"
            fill
            sizes="(max-width: 1024px) 100vw, 44vw"
            className="object-cover"
          />
        </div>
        <div>
          <span className="chip-red">{text.aboutEyebrow}</span>
          <h2 className="headline mt-4 text-5xl text-balance sm:text-6xl lg:text-7xl">
            {text.aboutTitle}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pork-ink/75">{text.aboutBody}</p>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pork-ink/75">{text.aboutDetail}</p>
        </div>
      </div>
    </section>
  );
}
