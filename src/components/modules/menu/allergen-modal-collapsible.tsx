"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { MenuAllergen } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AllergenBadges } from "@/components/modules/menu/allergen-badges";

export function AllergenModalCollapsible({
  allergens,
}: {
  allergens: MenuAllergen[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const btnId = useId();
  const panelId = `${btnId}-allergeni-panel`;

  if (!allergens?.length) return null;

  return (
    <div className="shrink-0 border-b border-pork-ink/10 px-5 py-3">
      <button
        type="button"
        id={btnId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl py-0.5 text-left transition-colors hover:bg-pork-ink/[0.04] active:bg-pork-ink/[0.07]"
      >
        <span className="impact-title shrink-0 text-[10px] text-pork-red">Allergeni</span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
          {!open ? (
            <AllergenBadges allergens={allergens} compact interactive={false} />
          ) : null}
          <ChevronDown
            size={18}
            className={cn(
              "shrink-0 text-pork-ink/45 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </div>
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={btnId}
          className="mt-3 border-t border-pork-ink/10 pt-3"
        >
          <AllergenBadges allergens={allergens} showLabels compact />
        </div>
      ) : null}
    </div>
  );
}
