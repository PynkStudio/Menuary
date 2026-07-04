import "server-only";

import { createHmac } from "crypto";

// Client per le stampanti cloud SUNMI — API "Cloud Printer V2", modalità
// "Cloud to Cloud" / push diretto (modulo printStations, connection 'sunmi_cloud').
//
// Flusso: costruiamo la comanda in ESC/POS, la convertiamo in esadecimale (UTF-8)
// e la inviamo a SUNMI OpenAPI con `pushContent`. SUNMI la inoltra alla stampante
// identificata per SN. Nessun endpoint di callback lato nostro (a differenza della
// modalità "Device to Cloud", qui non serve).
//
// Auth via header HTTP:
//   Sunmi-Appid      = APP_ID
//   Sunmi-Timestamp  = unix a 10 cifre
//   Sunmi-Nonce      = 6 cifre casuali
//   Sunmi-Sign       = HMAC-SHA256(jsonBody + appid + timestamp + nonce, appkey) hex
//   Source           = "openapi" (valore fisso)
// Content-Type: application/json. Risposta di successo: { code: 1, msg: "success" }.
//
// Credenziali (per-piattaforma, una sola partner app SUNMI):
//   SUNMI_CLOUD_APP_ID, SUNMI_CLOUD_APP_KEY, SUNMI_CLOUD_API_BASE
// Doc: https://docs.sunmi.com/en-US/cdixeghjk491/xffdeghjk524 (Cloud Printer V2 §3)

const APP_ID = process.env.SUNMI_CLOUD_APP_ID ?? "";
const APP_KEY = process.env.SUNMI_CLOUD_APP_KEY ?? "";
const API_BASE = process.env.SUNMI_CLOUD_API_BASE ?? "https://openapi.sunmi.com";
const PUSH_PATH = "/v2/printer/open/open/device/pushContent";

export function isSunmiConfigured(): boolean {
  return Boolean(APP_ID && APP_KEY);
}

// Nonce a 6 cifre: solo anti-replay lato SUNMI, non serve robustezza crittografica.
function nonce6(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Sunmi-Sign = HMAC-SHA256(json-body + appid + timestamp + nonce, appkey), hex minuscolo.
// La firma copre ESATTAMENTE la stringa JSON inviata: usare lo stesso `jsonBody` per
// firma e body della richiesta, senza ri-serializzare.
function signBody(jsonBody: string, timestamp: string, nonce: string): string {
  return createHmac("sha256", APP_KEY)
    .update(jsonBody + APP_ID + timestamp + nonce)
    .digest("hex");
}

export type SunmiPushResult = { ok: boolean; status: number; code: number | null; raw: string };

/**
 * Invia il contenuto ESC/POS di una comanda alla stampante cloud (per SN) via
 * pushContent. `tradeNo` è l'ID univoco per shop (max 32 caratteri): funge anche
 * da chiave di dedup lato SUNMI — stesso tradeNo = stesso contenuto, non ristampa.
 */
export async function pushPrintContent(input: {
  sn: string;
  tradeNo: string;
  escpos: string;
  copies?: number;
  orderType?: number; // 1 nuovo, 2 annullo, 3 sollecito, 4 storno, 5 altro
}): Promise<SunmiPushResult> {
  if (!isSunmiConfigured()) {
    return { ok: false, status: 0, code: null, raw: "sunmi_not_configured" };
  }

  // SUNMI richiede il contenuto come esadecimale della codifica UTF-8 (ESC/POS incluso).
  const contentHex = Buffer.from(input.escpos, "utf8").toString("hex");

  const jsonBody = JSON.stringify({
    trade_no: input.tradeNo,
    sn: input.sn,
    order_type: input.orderType ?? 1,
    content: contentHex,
    count: input.copies ?? 1,
  });

  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = nonce6();
  const sign = signBody(jsonBody, timestamp, nonce);

  const res = await fetch(`${API_BASE}${PUSH_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Sunmi-Appid": APP_ID,
      "Sunmi-Timestamp": timestamp,
      "Sunmi-Nonce": nonce,
      "Sunmi-Sign": sign,
      Source: "openapi",
    },
    body: jsonBody,
  });

  const raw = await res.text().catch(() => "");
  let code: number | null = null;
  try {
    code = (JSON.parse(raw) as { code?: number }).code ?? null;
  } catch {
    /* risposta non-JSON: lasciamo code = null */
  }
  return { ok: res.ok && code === 1, status: res.status, code, raw };
}
