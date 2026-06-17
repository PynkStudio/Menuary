"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function PopupStatusForwarder() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  useEffect(() => {
    if (!status) return;
    if (window.opener) {
      window.opener.postMessage(
        { type: "payment:status", status },
        window.location.origin,
      );
      window.close();
    }
  }, [status]);

  return null;
}
