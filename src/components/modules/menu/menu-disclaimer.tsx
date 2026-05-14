import { Info } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

export function MenuDisclaimer() {
  const items = [siteConfig.disclaimers.eventi];

  return (
    <aside className="rounded-3xl bg-pork-brick p-6 text-pork-cream shadow-lg md:p-8">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pork-mustard text-pork-ink">
          <Info size={20} />
        </div>
        <div className="flex-1">
          <p className="impact-title text-2xl text-pork-mustard">Buono a sapersi</p>
          <ul className="mt-3 grid gap-2 text-sm text-pork-cream/85 md:grid-cols-2">
            {items.map((i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-pork-mustard" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-pork-cream/50">
            Gli allergeni sono disponibili in sala. Per intolleranze o esigenze specifiche
            chiedi al personale.
          </p>
        </div>
      </div>
    </aside>
  );
}
