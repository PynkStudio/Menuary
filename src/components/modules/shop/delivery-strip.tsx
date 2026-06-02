"use client";

import Image from "next/image";
import { Truck } from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { useDocaCopy } from "@/lib/doca-i18n";

export function DeliveryStrip() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const docaCopy = useDocaCopy();
  const isDoca = tenant.id === "doca";

  return (
    <section className="tenant-delivery-strip bg-pork-ink text-pork-cream">
      <div className="container-wide flex flex-col items-center justify-between gap-6 py-8 md:flex-row">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pork-mustard text-pork-ink">
            <Truck size={22} />
          </div>
          <div>
            <p className="impact-title text-2xl">{isDoca ? docaCopy.deliveryTitle : content.delivery.title}</p>
            <p className="text-sm text-pork-cream/70">
              {isDoca ? docaCopy.deliveryBody : content.delivery.body}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {content.delivery.partners.map((d) => (
            <a
              key={d.name}
              href={d.url}
              aria-disabled={!d.active}
              className={
                isDoca
                  ? "inline-flex min-h-16 items-center gap-3 rounded-full border-2 border-pork-mustard bg-pork-cream px-5 py-3 text-base font-black text-pork-ink transition-transform hover:-translate-y-1"
                  : "rounded-full border border-pork-cream/20 px-4 py-2 text-sm font-semibold text-pork-cream/70 transition-colors hover:border-pork-mustard hover:text-pork-mustard"
              }
            >
              {isDoca ? (
                <Image
                  src="/doca/too-good-to-go.png"
                  alt=""
                  width={48}
                  height={42}
                  className="h-10 w-12 object-contain"
                />
              ) : null}
              {d.active ? d.name : `${d.name} · presto`}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
