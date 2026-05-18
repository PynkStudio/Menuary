"use client";

import { useEffect } from "react";
import { installDemoFetchInterceptor } from "@/lib/demo-mode";

interface Props {
  tenantId: string;
}

// Montato dal layout solo su demo.menuary.it / demo.bizery.it.
// Installa l'interceptor di fetch che dirotta tutte le scritture /api/gestione/*
// a localStorage, garantendo che nessuna modifica raggiunga il server.
export function DemoModeInstaller(_props: Props) {
  useEffect(() => {
    installDemoFetchInterceptor();
  }, []);

  return null;
}
