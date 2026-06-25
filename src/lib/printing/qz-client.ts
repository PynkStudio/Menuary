// Wrapper client-only attorno a QZ Tray (https://qz.io).
//
// QZ Tray è un servizio locale installato sul PC cassa (Windows/Mac/Linux) che
// espone le stampanti dell'OS — incluse quelle USB già installate via driver —
// su un WebSocket locale (wss://localhost:8181). La web app vi si connette dal
// browser e invia la comanda in ESC/POS raw.
//
// IMPORTANTE: usare solo lato client (import dinamico). Niente SSR.
//
// TODO(produzione): per la stampa SILENZIOSA senza popup serve firmare le
// richieste con un certificato commerciale QZ. In dev/unsigned QZ mostra un
// dialog "Allow" una volta per origine. Vedi setCertificatePromise/
// setSignaturePromise più sotto: oggi configurati in modalità non firmata.

type QzModule = {
  websocket: {
    isActive: () => boolean;
    connect: (opts?: Record<string, unknown>) => Promise<void>;
    disconnect: () => Promise<void>;
  };
  printers: {
    find: () => Promise<string[] | string>;
    getDefault: () => Promise<string | null>;
  };
  configs: { create: (printer: string, opts?: Record<string, unknown>) => unknown };
  print: (config: unknown, data: unknown[]) => Promise<void>;
  security: {
    setCertificatePromise: (cb: (resolve: (v?: unknown) => void, reject: (e?: unknown) => void) => void) => void;
    setSignaturePromise: (
      cb: (toSign: string) => (resolve: (v?: unknown) => void, reject: (e?: unknown) => void) => void,
    ) => void;
  };
};

let qzPromise: Promise<QzModule> | null = null;
let securityConfigured = false;

async function getQz(): Promise<QzModule> {
  if (!qzPromise) {
    qzPromise = import("qz-tray").then((m) => (m as unknown as { default?: QzModule }).default ?? (m as unknown as QzModule));
  }
  const qz = await qzPromise;
  if (!securityConfigured) {
    // Modalità non firmata (dev): nessun certificato, firma vuota → QZ chiede
    // conferma all'utente una volta. TODO(produzione): certificato + firma.
    qz.security.setCertificatePromise((resolve) => resolve());
    qz.security.setSignaturePromise(() => (resolve) => resolve());
    securityConfigured = true;
  }
  return qz;
}

export async function isQzConnected(): Promise<boolean> {
  try {
    const qz = await getQz();
    return qz.websocket.isActive();
  } catch {
    return false;
  }
}

export async function connectQz(): Promise<void> {
  const qz = await getQz();
  if (qz.websocket.isActive()) return;
  // retries: QZ a volte tenta più porte/protocolli prima di agganciarsi.
  await qz.websocket.connect({ retries: 2, delay: 1 });
}

export async function disconnectQz(): Promise<void> {
  const qz = await getQz();
  if (qz.websocket.isActive()) await qz.websocket.disconnect();
}

export async function listQzPrinters(): Promise<string[]> {
  const qz = await getQz();
  if (!qz.websocket.isActive()) await connectQz();
  const found = await qz.printers.find();
  return Array.isArray(found) ? found : found ? [found] : [];
}

export async function getDefaultQzPrinter(): Promise<string | null> {
  const qz = await getQz();
  if (!qz.websocket.isActive()) await connectQz();
  try {
    return await qz.printers.getDefault();
  } catch {
    return null;
  }
}

/** Invia una stringa ESC/POS raw alla stampante indicata. */
export async function printRawEscPos(
  printerName: string,
  escposData: string,
  copies = 1,
): Promise<void> {
  const qz = await getQz();
  if (!qz.websocket.isActive()) await connectQz();
  const config = qz.configs.create(printerName, { copies: Math.max(1, copies) });
  // qz-tray 2.2: raw ESC/POS → type 'raw', format 'command', flavor 'plain'.
  await qz.print(config, [{ type: "raw", format: "command", flavor: "plain", data: escposData }]);
}
