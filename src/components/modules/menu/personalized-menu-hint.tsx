"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/components/core/tenant-provider";

export function PersonalizedMenuHint() {
  const tenant = useTenant();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/personalization/menu?tenantId=${encodeURIComponent(tenant.id)}`,
          { credentials: "include" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { personalized?: boolean; headline?: string | null };
        if (!cancelled && data.personalized && data.headline) setMsg(data.headline);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenant.id]);

  if (!msg) return null;

  return (
    <div className="container-wide pb-4">
      <p className="rounded-2xl border border-pork-mustard/40 bg-pork-mustard/10 px-4 py-3 text-sm text-pork-cream">
        {msg}
      </p>
    </div>
  );
}
