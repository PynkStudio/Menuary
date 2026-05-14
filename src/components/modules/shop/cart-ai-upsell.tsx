"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/components/core/tenant-provider";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import type { CartLine } from "@/lib/types";

export function CartAiUpsell({ lines }: { lines: CartLine[] }) {
  const tenant = useTenant();
  const { modules } = useEffectiveFeatures();
  const [hints, setHints] = useState<string[]>([]);

  useEffect(() => {
    if (!modules.upselling || lines.length === 0) {
      setHints([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/menu-suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: tenant.id,
            itemIds: lines.map((l) => l.itemId),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions?: { text: string }[] };
        if (cancelled) return;
        setHints((data.suggestions ?? []).map((s) => s.text).slice(0, 3));
      } catch {
        setHints([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lines, modules.upselling, tenant.id]);

  if (!modules.upselling || hints.length === 0) return null;

  return (
    <div className="mx-5 mb-4 rounded-2xl border border-pork-mustard/40 bg-pork-mustard/10 px-4 py-3 text-sm text-pork-ink">
      <p className="text-xs font-bold uppercase text-pork-red">Suggerimenti</p>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        {hints.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </div>
  );
}
