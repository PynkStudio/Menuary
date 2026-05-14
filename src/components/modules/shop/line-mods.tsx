import { formatEuro } from "@/lib/price-utils";

type Extra = { id: string; name: string; price: number };

type BundlePickLine = { slotLabel: string; choiceName: string };

type Props = {
  /** Id ingredienti o etichette legacy (join se `removedDisplay` assente). */
  removed?: string[];
  /** Nomi già risolti (ingredienti a slot) — ha priorità sulla join di `removed`. */
  removedDisplay?: string;
  extras?: Extra[];
  note?: string;
  bundlePicks?: BundlePickLine[];
  tone?: "dark" | "light";
  withPrices?: boolean;
};

export function LineMods({
  removed,
  removedDisplay,
  extras,
  note,
  bundlePicks,
  tone = "dark",
  withPrices = false,
}: Props) {
  const hasRemoved =
    !!removedDisplay?.trim() || (removed?.length ?? 0) > 0;
  const hasExtras = (extras?.length ?? 0) > 0;
  const hasNote = !!note;
  const hasBundle = (bundlePicks?.length ?? 0) > 0;
  if (!hasRemoved && !hasExtras && !hasNote && !hasBundle) return null;

  const muted = tone === "light" ? "text-pork-cream/60" : "text-pork-ink/60";
  const removedColor =
    tone === "light" ? "text-pork-mustard" : "text-pork-red";
  const extrasColor =
    tone === "light" ? "text-pork-cream" : "text-pork-green";

  return (
    <div className="mt-1 space-y-0.5 text-[11px] leading-tight">
      {hasBundle && (
        <ul className={tone === "light" ? "text-pork-cream/90" : "text-pork-ink/80"}>
          {bundlePicks!.map((b) => (
            <li key={b.slotLabel}>
              <span className="font-semibold">{b.slotLabel}:</span> {b.choiceName}
            </li>
          ))}
        </ul>
      )}
      {hasRemoved && (
        <p className={`${removedColor} font-semibold`}>
          – senza{" "}
          {removedDisplay?.trim() ||
            (removed && removed.length > 0 ? removed.join(", ") : "")}
        </p>
      )}
      {hasExtras && (
        <ul className={`${extrasColor}`}>
          {extras!.map((x) => (
            <li key={x.id}>
              + {x.name}
              {withPrices && (
                <span className={`ml-1 ${muted}`}>
                  ({formatEuro(x.price)})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {hasNote && (
        <p className={`italic ${muted}`}>&ldquo;{note}&rdquo;</p>
      )}
    </div>
  );
}
