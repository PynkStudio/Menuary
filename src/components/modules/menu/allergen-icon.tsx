import type { LucideIcon } from "lucide-react";
import {
  Bean,
  CircleDot,
  Egg,
  Fish,
  Flame,
  FlaskConical,
  LeafyGreen,
  Milk,
  Nut,
  Shell,
  Snail,
  Sprout,
  Trees,
  Wheat,
} from "lucide-react";
import type { MenuAllergen } from "@/lib/types";

const ICON_MAP: Record<MenuAllergen, LucideIcon> = {
  glutine: Wheat,
  crostacei: Shell,
  uova: Egg,
  pesce: Fish,
  arachidi: Nut,
  soia: Bean,
  latte: Milk,
  frutta_guscio: Trees,
  sedano: LeafyGreen,
  senape: Flame,
  sesamo: CircleDot,
  solfiti: FlaskConical,
  lupini: Sprout,
  molluschi: Snail,
};

export function AllergenGlyph({
  allergen,
  size = 14,
  className,
  strokeWidth = 2.25,
}: {
  allergen: MenuAllergen;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = ICON_MAP[allergen];
  return <Icon size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}
