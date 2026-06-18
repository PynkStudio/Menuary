"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlatformSubscriptionsPage } from "@/components/admin/platform/platform-subscriptions-page";
import { PlatformAIRevenuePage } from "@/components/admin/platform/platform-ai-revenue-page";

type Tab = "abbonamenti" | "proventi_ai";

const TABS: { value: Tab; label: string }[] = [
  { value: "abbonamenti", label: "Abbonamenti" },
  { value: "proventi_ai", label: "Proventi AI" },
];

export default function AbbonamentiPage() {
  const [tab, setTab] = useState<Tab>("abbonamenti");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-2xl bg-pork-ink/5 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "rounded-xl px-5 py-2 text-sm font-bold transition",
              tab === t.value
                ? "bg-pork-ink text-pork-cream"
                : "text-pork-ink/60 hover:text-pork-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "abbonamenti" && <PlatformSubscriptionsPage />}
      {tab === "proventi_ai" && <PlatformAIRevenuePage />}
    </div>
  );
}
