"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function PaymentPopupListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = useRef(searchParams.get("status"));

  useEffect(() => {
    currentStatus.current = searchParams.get("status");
  }, [searchParams]);

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (e.data?.type !== "payment:status") return;
      if (e.data.status === currentStatus.current) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("status", e.data.status);
      router.replace(`${pathname}?${params.toString()}`);
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [router, pathname, searchParams]);

  return null;
}
