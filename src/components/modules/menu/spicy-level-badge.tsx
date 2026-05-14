import { Flame, Zap } from "lucide-react";
import type { PiccanteLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const PEPPER = "\u{1F336}\uFE0F";

const titles: Record<PiccanteLevel, string> = {
  1: "Piccante — livello 1",
  2: "Piccante — livello 2",
  3: "Piccante — livello 3",
  4: "Super piccante / piccantissimo",
};

export function SpicyLevelBadge({
  level,
  className,
  compact,
}: {
  level: PiccanteLevel;
  className?: string;
  compact?: boolean;
}) {
  if (level <= 3) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full bg-pork-mustard/40 px-2 py-0.5 ring-1 ring-pork-mustard/55",
          compact && "px-1.5 py-px",
          className,
        )}
        title={titles[level]}
      >
        {Array.from({ length: level }, (_, i) => (
          <span
            key={i}
            className={cn(
              "leading-none select-none",
              compact ? "text-[13px]" : "text-base",
            )}
            aria-hidden
          >
            {PEPPER}
          </span>
        ))}
        <span className="sr-only">{titles[level]}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-800 via-orange-600 to-amber-500 px-2 py-0.5 text-white shadow-sm ring-1 ring-red-950/25",
        compact && "gap-0.5 px-1.5 py-px",
        className,
      )}
      title={titles[4]}
    >
      <Flame
        size={compact ? 11 : 13}
        className="shrink-0"
        strokeWidth={2.25}
        aria-hidden
      />
      <Zap
        size={compact ? 10 : 12}
        className="shrink-0 text-amber-200"
        strokeWidth={2}
        fill="currentColor"
        aria-hidden
      />
      <span
        className={cn(
          "font-black uppercase leading-none tracking-wide text-amber-50",
          compact ? "text-[8px]" : "text-[9px]",
        )}
      >
        Piccantissimo
      </span>
      <span className="sr-only">{titles[4]}</span>
    </span>
  );
}
