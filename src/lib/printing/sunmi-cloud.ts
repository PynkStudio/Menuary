import "server-only";

import { createHash } from "crypto";

// Client per le stampanti cloud SUNMI (modulo printStations, connection 'sunmi_cloud').
//
// Modello (da docs SUNMI Cloud Printer Partner):
//  1) il nostro server "pusha" un messaggio firmato a una stampante (per SN);
//  2) per privacy SUNMI NON trasporta il contenuto: la stampante si ricollega al
//     NOSTRO endpoint di callback e SCARICA il contenuto ESC/POS da stampare
//     (vedi src/app/api/printing/sunmi/pull/route.ts).
//
// Credenziali (per-piattaforma, una sola SUNMI partner app):
//   SUNMI_CLOUD_APP_ID, SUNMI_CLOUD_APP_KEY
//   SUNMI_CLOUD_API_BASE  (host API SUNMI)
//
// ⚠️ TODO(verify): endpoint esatto, nomi dei parametri del push e composizione
// precisa del `sign` vanno confermati sulla doc autenticata SUNMI / col partner
// account prima del go-live. Tutto ciò che è incerto è isolato qui sotto.
// Doc: https://docs.sunmi.com/en/  (Cloud Printer Product R&D Instruction)

const APP_ID = process.env.SUNMI_CLOUD_APP_ID ?? "";
const APP_KEY = process.env.SUNMI_CLOUD_APP_KEY ?? "";
// TODO(verify): base host corretto dell'OpenAPI SUNMI per il cloud printer.
const API_BASE = process.env.SUNMI_CLOUD_API_BASE ?? "https://open.sunmi.com";
// TODO(verify): path dell'endpoint "push message" del cloud printer.
const PUSH_PATH = process.env.SUNMI_CLOUD_PUSH_PATH ?? "/v2/printer/cloudprinter/pushContent";

export function isSunmiConfigured(): boolean {
  return Boolean(APP_ID && APP_KEY);
}

/**
 * sign = MD5 (UPPERCASE, 32 char) dei parametri ordinati per chiave nella forma
 * key=value&... con app_key in coda.
 * ⚠️ TODO(verify): la doc SUNMI specifica l'esatta stringa-base del sign; questa
 * è l'implementazione tipica SUNMI ma va confermata col partner account.
 */
export function sunmiSign(params: Record<string, string>): string {
  const base = Object.keys(params)
    .filter((k) => k !== "sign" && params[k] !== "" && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("md5").update(`${base}&app_key=${APP_KEY}`).digest("hex").toUpperCase();
}

/** Verifica la firma di una richiesta in ingresso (callback di pull). */
export function verifySunmiSign(params: Record<string, string>, provided: string | null): boolean {
  if (!provided) return false;
  return sunmiSign(params).toUpperCase() === provided.toUpperCase();
}

export type SunmiPushResult = { ok: boolean; status: number; raw: string };

/**
 * Notifica alla stampante (per SN) che c'è una comanda da stampare. Il contenuto
 * NON viene inviato qui: la stampante lo scaricherà dal nostro callback usando
 * `traceId` per identificare l'ordine.
 */
export async function pushPrintMessage(input: {
  sn: string;
  traceId: string;
}): Promise<SunmiPushResult> {
  if (!isSunmiConfigured()) {
    return { ok: false, status: 0, raw: "sunmi_not_configured" };
  }

  // ⚠️ TODO(verify): nomi esatti dei campi (sn / printerName / msgType / trace_id).
  const params: Record<string, string> = {
    app_id: APP_ID,
    sn: input.sn,
    timestamp: String(Math.floor(Date.now() / 1000)),
    trace_id: input.traceId,
  };
  params.sign = sunmiSign(params);

  const res = await fetch(`${API_BASE}${PUSH_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const raw = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, raw };
}
