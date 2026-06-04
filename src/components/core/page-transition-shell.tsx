"use client";

import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

/** Wrappa i children con una key basata sul pathname così, ad ogni navigazione,
 *  React rimonta il div e rilancia l'animazione CSS di entrata. */
export function PageTransitionShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="motion-safe:animate-page-fade-up min-w-0 overflow-x-clip">
      {children}
    </div>
  );
}
