"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import { useDocaCopy } from "@/lib/doca-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

type RichTextPart = {
  text: string;
  bold?: boolean;
};

function renderRichText(parts: readonly RichTextPart[]) {
  return parts.map((part, index) =>
    part.bold ? <strong key={index}>{part.text}</strong> : <span key={index}>{part.text}</span>,
  );
}

export function ThreeSouls() {
  const tenant = useTenant();
  const mode = usePlatformMode();
  const pathname = usePathname();
  const content = getTenantContent(tenant.id);
  const docaCopy = useDocaCopy();
  const isDoca = tenant.id === "doca";
  const tenantHref = useTenantLocalizedHref();
  const isPathPreview = !!tenant.previewSlug && pathname?.startsWith(`/${tenant.previewSlug}`);
  const previewPrefix =
    (mode === "preview" || isPathPreview) && tenant.previewSlug ? `/${tenant.previewSlug}` : "";

  return (
    <section id="tre-anime" className="tenant-souls relative scroll-mt-24 bg-pork-cream py-20 md:py-28">
      <div className="container-wide">
        <div className="mb-12 flex flex-col items-center text-center">
          <span className="chip-red">{isDoca ? docaCopy.introEyebrow : content.soulsIntro.eyebrow}</span>
          <h2 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
            {isDoca ? docaCopy.introTitleLead : content.soulsIntro.titleLead}
            <br />
            <span className="text-pork-red">{isDoca ? docaCopy.introTitleAccent : content.soulsIntro.titleAccent}</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-pork-ink/70">
            {isDoca ? renderRichText(docaCopy.introBodyParts) : content.soulsIntro.body}
          </p>
        </div>

        <div className={`grid gap-5 md:grid-cols-3 ${isDoca ? "doca-mobile-carousel" : ""}`}>
          {content.souls.map((soul, i) => {
            const localizedSoul = isDoca ? docaCopy.categories[i] : undefined;
            return (
            <motion.div
              key={soul.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
            >
              <Link
                href={tenantHref(`${previewPrefix}${soul.href}`)}
                className="group relative block h-[28rem] overflow-hidden rounded-3xl bg-pork-ink shadow-xl"
              >
                <Image
                  src={soul.image}
                  alt=""
                  fill
                  loading={isDoca ? "eager" : "lazy"}
                  sizes="(max-width: 640px) 82vw, (max-width: 768px) 100vw, 400px"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pork-ink via-pork-ink/40 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-pork-cream">
                  <span className="impact-title text-sm text-pork-mustard">
                    {localizedSoul?.kicker ?? soul.kicker}
                  </span>
                  <h3 className="headline mt-1 text-4xl">{localizedSoul?.title ?? soul.title}</h3>
                  <p className="mt-2 text-pork-cream/80">{localizedSoul?.desc ?? soul.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-pork-mustard transition-all group-hover:gap-3">
                    {isDoca ? docaCopy.menu : "Scopri i piatti"} <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
