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
//   SUNMI_CLOUD_APP_ID, SUNMI_CLOUD_APP_KEY, SUNMI_CLOUD_API_BASE, SUNMI_CLOUD_SHOP_ID
// Doc: https://docs.sunmi.com/en-US/cdixeghjk491/xffdeghjk524 (Cloud Printer V2 §3)

const APP_ID = process.env.SUNMI_CLOUD_APP_ID ?? "";
const APP_KEY = process.env.SUNMI_CLOUD_APP_KEY ?? "";
const API_BASE = process.env.SUNMI_CLOUD_API_BASE ?? "https://openapi.sunmi.com";
const PUSH_PATH = "/v2/printer/open/open/device/pushContent";
const BIND_PATH = "/v2/printer/open/open/device/bindShop";
const ONLINE_PATH = "/v2/printer/open/open/device/onlineStatus";
const SHOP_ID = Number(process.env.SUNMI_CLOUD_SHOP_ID ?? "1") || 1;

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

export type SunmiResult = { ok: boolean; status: number; code: number | null; msg: string | null; raw: string };
export type SunmiPushResult = SunmiResult;

async function sunmiPost(path: string, payload: Record<string, unknown>): Promise<SunmiResult> {
  if (!isSunmiConfigured()) {
    return { ok: false, status: 0, code: null, msg: "sunmi_not_configured", raw: "sunmi_not_configured" };
  }
  const jsonBody = JSON.stringify(payload);
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = nonce6();
  const sign = signBody(jsonBody, timestamp, nonce);

  const res = await fetch(`${API_BASE}${path}`, {
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
  let msg: string | null = null;
  try {
    const parsed = JSON.parse(raw) as { code?: number; msg?: string };
    code = parsed.code ?? null;
    msg = parsed.msg ?? null;
  } catch {
    /* risposta non-JSON: lasciamo code = null */
  }
  return { ok: res.ok && code === 1, status: res.status, code, msg, raw };
}

/**
 * Associa la stampante (per SN) a uno shop della nostra app SUNMI. Senza bind,
 * pushContent risponde `10071704 not belong to this channel`. `shop_id` è un
 * intero scelto dal partner: usiamo un unico shop di piattaforma
 * (SUNMI_CLOUD_SHOP_ID, default 1) perché il routing tenant→SN sta già nel DB.
 */
export async function bindPrinterToShop(sn: string): Promise<SunmiResult> {
  return sunmiPost(BIND_PATH, { sn, shop_id: SHOP_ID });
}

/** Stato online della stampante. `data` contiene `is_online` (1/0) per SN. */
export async function getPrinterOnlineStatus(sn: string): Promise<SunmiResult & { online: boolean | null }> {
  const res = await sunmiPost(ONLINE_PATH, { sn });
  let online: boolean | null = null;
  try {
    const data = (JSON.parse(res.raw) as { data?: unknown }).data;
    const row = Array.isArray(data)
      ? data[0]
      : data && typeof data === "object" && Array.isArray((data as { list?: unknown[] }).list)
        ? (data as { list: unknown[] }).list[0]
        : data;
    const flag = row && typeof row === "object" ? (row as { is_online?: unknown }).is_online : undefined;
    if (flag !== undefined) online = flag === 1 || flag === true || flag === "1";
  } catch {
    /* formato inatteso: online resta null */
  }
  return { ...res, online };
}

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
  // SUNMI richiede il contenuto come esadecimale della codifica UTF-8 (ESC/POS incluso).
  const contentHex = Buffer.from(input.escpos, "utf8").toString("hex");
  return sunmiPost(PUSH_PATH, {
    trade_no: input.tradeNo,
    sn: input.sn,
    order_type: input.orderType ?? 1,
    content: contentHex,
    count: input.copies ?? 1,
  });
}
