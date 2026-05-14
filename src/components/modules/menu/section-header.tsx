import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  dark,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest",
            dark ? "bg-pork-mustard text-pork-ink" : "bg-pork-ink text-pork-mustard"
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "headline text-5xl sm:text-6xl lg:text-7xl",
          dark ? "text-pork-cream" : "text-pork-ink"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "max-w-2xl text-lg",
            dark ? "text-pork-cream/70" : "text-pork-ink/70",
            align === "center" && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
