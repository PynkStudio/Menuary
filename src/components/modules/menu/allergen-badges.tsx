import type { MenuAllergen } from "@/lib/types";
import { allergenMeta, sortAllergens } from "@/lib/allergens";
import { cn } from "@/lib/utils";
import { AllergenGlyph } from "@/components/modules/menu/allergen-icon";

export function AllergenBadges({
  allergens,
  className,
  /** In modale: icona + nome su ogni riga. */
  showLabels,
  /** Icone più piccole (liste compatte, solo icone). */
  compact,
  /**
   * Se false, solo pill con icona (niente espansione al hover).
   * Utile dentro altri controlli (es. collapsable in modale).
   */
  interactive = true,
}: {
  allergens: MenuAllergen[] | undefined;
  className?: string;
  showLabels?: boolean;
  compact?: boolean;
  interactive?: boolean;
}) {
  if (!allergens?.length) return null;
  const sorted = sortAllergens(allergens);
  const iconSize = compact ? 12 : 14;

  if (showLabels) {
    return (
      <div
        className={cn("flex flex-col gap-1.5", className)}
        role="list"
        aria-label="Allergeni"
      >
        {sorted.map((key) => {
          const meta = allergenMeta(key);
          if (!meta) return null;
          return (
            <div
              key={key}
              role="listitem"
              className="flex items-start gap-2 rounded-lg bg-pork-ink/5 px-2 py-1.5 ring-1 ring-pork-ink/10"
            >
              <span
                className={cn(
                  "inline-flex shrink-0 items-center justify-center rounded-full bg-pork-ink/8 text-pork-ink ring-1 ring-pork-ink/15",
                  compact ? "h-7 w-7" : "h-8 w-8",
                )}
                aria-hidden
              >
                <AllergenGlyph allergen={key} size={iconSize} />
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 font-semibold leading-snug text-pork-ink",
                  compact ? "text-[10px]" : "text-xs",
                )}
              >
                {meta.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (!interactive) {
    const iconBox = compact ? "h-6 w-6" : "h-7 w-7";
    return (
      <div
        className={cn("flex flex-wrap items-center justify-end gap-1", className)}
        role="list"
        aria-label="Allergeni"
      >
        {sorted.map((key) => {
          const meta = allergenMeta(key);
          if (!meta) return null;
          return (
            <span
              key={key}
              role="listitem"
              title={meta.label}
              aria-label={meta.label}
              className={cn(
                "inline-flex items-center justify-center rounded-full bg-pork-ink/8 text-pork-ink ring-1 ring-pork-ink/15",
                iconBox,
              )}
            >
              <AllergenGlyph allergen={key} size={iconSize} />
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1", className)}
      role="list"
      aria-label="Allergeni"
    >
      {sorted.map((key) => {
        const meta = allergenMeta(key);
        if (!meta) return null;
        const collapsed = compact ? "max-w-6" : "max-w-7";
        const iconBox = compact ? "h-6 w-6" : "h-7 w-7";
        return (
          <div
            key={key}
            role="listitem"
            aria-label={meta.label}
            className={cn(
              "group inline-flex min-w-0 items-stretch overflow-hidden rounded-full bg-pork-ink/8 text-pork-ink ring-1 ring-pork-ink/15",
              "transition-[max-width,box-shadow] duration-300 ease-out",
              collapsed,
              compact ? "h-6" : "h-7",
              "sm:hover:relative sm:hover:z-20 sm:hover:max-w-[min(18rem,calc(100vw-2rem))] sm:hover:gap-1 sm:hover:pr-2 sm:hover:shadow-md",
            )}
          >
            <span
              className={cn(
                "inline-flex shrink-0 items-center justify-center self-center",
                iconBox,
              )}
              aria-hidden
            >
              <AllergenGlyph allergen={key} size={iconSize} />
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 self-center overflow-hidden text-left font-semibold leading-snug text-pork-ink",
                "whitespace-nowrap py-0.5 opacity-0 transition-opacity duration-200 ease-out sm:group-hover:opacity-100",
                compact ? "text-[9px]" : "text-[10px]",
              )}
            >
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
