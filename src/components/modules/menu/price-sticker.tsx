import { cn } from "@/lib/utils";

type Variant = "mustard" | "red" | "green" | "pink";

export function PriceSticker({
  children,
  variant = "mustard",
  className,
  rotate = -3,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  rotate?: number;
}) {
  const styles: Record<Variant, string> = {
    mustard: "bg-pork-mustard text-pork-ink",
    red: "bg-pork-red text-white",
    green: "bg-pork-green text-white",
    pink: "bg-pork-pink text-white",
  };

  return (
    <span
      style={{ transform: `rotate(${rotate}deg)` }}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-3 py-1.5 font-impact text-lg leading-none shadow-md shadow-black/10",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
