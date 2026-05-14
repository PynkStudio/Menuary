import Image from "next/image";
import { Flame, Leaf, Star } from "lucide-react";
import type { MenuItem } from "@/lib/menu-data";
import { AllergenBadges } from "@/components/modules/menu/allergen-badges";
import { SpicyLevelBadge } from "@/components/modules/menu/spicy-level-badge";
import { getResolvedPiccanteLevel } from "@/lib/piccante";
import { PriceSticker } from "@/components/modules/menu/price-sticker";
import { cn } from "@/lib/utils";

const tagMeta: Record<
  NonNullable<MenuItem["tags"]>[number],
  { label: string; icon: React.ReactNode; className: string }
> = {
  firma: {
    label: "Firma",
    icon: <Star size={12} />,
    className: "bg-pork-red text-white",
  },
  piccante: {
    label: "Piccante",
    icon: <Flame size={12} />,
    className: "bg-pork-mustard text-pork-ink",
  },
  veg: {
    label: "Veg",
    icon: <Leaf size={12} />,
    className: "bg-pork-green text-white",
  },
  novita: {
    label: "Novità",
    icon: <Star size={12} />,
    className: "bg-pork-pink text-white",
  },
};

function formatPriceChunks(price: MenuItem["price"]): {
  main: string;
  sub?: string;
  variant: "mustard" | "red" | "green" | "pink";
}[] {
  switch (price.kind) {
    case "single":
      return [
        { main: `€ ${price.value.toFixed(2).replace(".", ",")}`, variant: "mustard" },
      ];
    case "sized":
      return [
        { main: `€ ${price.big.toFixed(2).replace(".", ",")}`, sub: "Big", variant: "red" },
        { main: `€ ${price.small.toFixed(2).replace(".", ",")}`, sub: "Small", variant: "mustard" },
      ];
    case "persone":
      return [
        {
          main: `€ ${price.per2.toFixed(2).replace(".", ",")}`,
          sub: "2 pers.",
          variant: "mustard",
        },
        {
          main: `€ ${price.per4.toFixed(2).replace(".", ",")}`,
          sub: "4 pers.",
          variant: "red",
        },
      ];
    case "volume":
      return [
        {
          main: `€ ${price.small.price.toFixed(2).replace(".", ",")}`,
          sub: price.small.label,
          variant: "mustard",
        },
        {
          main: `€ ${price.large.price.toFixed(2).replace(".", ",")}`,
          sub: price.large.label,
          variant: "red",
        },
      ];
  }
}

export function MenuCard({ item, compact }: { item: MenuItem; compact?: boolean }) {
  const prices = formatPriceChunks(item.price);
  const spicyLevel = getResolvedPiccanteLevel(item);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-pork-ink/5 transition-all hover:-translate-y-1 hover:shadow-xl",
        compact && "h-full"
      )}
    >
      {item.image ? (
        <div className="relative aspect-[4/3] overflow-hidden bg-pork-ink/5">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
            {prices.map((p, i) => (
              <PriceSticker key={i} variant={p.variant} rotate={i % 2 === 0 ? -3 : 3}>
                {p.main}
                {p.sub && <span className="ml-1 text-xs font-normal opacity-80">{p.sub}</span>}
              </PriceSticker>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="impact-title text-2xl leading-tight text-pork-ink">
            {item.name}
          </h3>
          {!item.image && (
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {prices.map((p, i) => (
                <PriceSticker
                  key={i}
                  variant={p.variant}
                  rotate={i % 2 === 0 ? -3 : 3}
                >
                  {p.main}
                  {p.sub && (
                    <span className="ml-1 text-xs font-normal opacity-80">
                      {p.sub}
                    </span>
                  )}
                </PriceSticker>
              ))}
            </div>
          )}
        </div>

        {item.description && (
          <p className="text-sm leading-relaxed text-pork-ink/70">
            {item.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          {item.abv && (
            <span className="chip bg-pork-ink text-pork-cream">
              {item.abv} vol.
            </span>
          )}
          <AllergenBadges allergens={item.allergens} />
          {spicyLevel ? <SpicyLevelBadge level={spicyLevel} /> : null}
          {item.tags
            ?.filter((t) => t !== "piccante")
            .map((t) => {
              const meta = tagMeta[t];
              return (
                <span
                  key={t}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide",
                    meta.className
                  )}
                >
                  {meta.icon}
                  {meta.label}
                </span>
              );
            })}
        </div>
      </div>
    </article>
  );
}
