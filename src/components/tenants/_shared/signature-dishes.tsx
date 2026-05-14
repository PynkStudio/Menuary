"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/modules/menu/section-header";
import { PriceSticker } from "@/components/modules/menu/price-sticker";
import { ArrowRight } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { usePlatformMode } from "@/components/core/platform-mode-provider";

export function SignatureDishes() {
  const tenant = useTenant();
  const mode = usePlatformMode();
  const content = getTenantContent(tenant.id);
  const previewPrefix =
    mode === "preview" && tenant.previewSlug ? `/${tenant.previewSlug}` : "";
  const menuHref = `${previewPrefix}/menu`;

  return (
    <section className="bg-pork-cream py-20 md:py-28">
      <div className="container-wide">
        <SectionHeader
          eyebrow={content.dishesIntro.eyebrow}
          title={content.dishesIntro.title}
          subtitle={content.dishesIntro.subtitle}
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.dishes.map((dish, i) => (
            <motion.div
              key={dish.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              <Link
                href={`${previewPrefix}${dish.href}`}
                className="group relative block h-72 overflow-hidden rounded-3xl bg-pork-ink shadow-lg ring-1 ring-pork-ink/5 transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                <Image
                  src={dish.image}
                  alt={dish.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute right-4 top-4">
                  <PriceSticker variant={dish.variant}>{dish.price}</PriceSticker>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 text-pork-cream">
                  <h3 className="impact-title text-3xl">{dish.name}</h3>
                  <p className="mt-1 text-sm text-pork-cream/85">{dish.desc}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href={menuHref} className="btn-primary text-base">
            Tutto il menu <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
