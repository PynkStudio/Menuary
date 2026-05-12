"use client";

import { createContext, useContext, type PropsWithChildren } from "react";
import type { PlatformMode } from "@/lib/platform";

const PlatformModeContext = createContext<PlatformMode>("tenant");

export function PlatformModeProvider({
  mode,
  children,
}: PropsWithChildren<{ mode: PlatformMode }>) {
  return (
    <PlatformModeContext.Provider value={mode}>
      {children}
    </PlatformModeContext.Provider>
  );
}

export function usePlatformMode(): PlatformMode {
  return useContext(PlatformModeContext);
}
