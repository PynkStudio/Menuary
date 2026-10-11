import { timingSafeEqual } from "node:crypto";

/**
 * Bearer condiviso tra host AYS (tvOS/Mac) e backend. Vive in
 * AYS_PRESENTER_API_TOKEN; senza env tutte le route AYS rispondono 401.
 */
export function isAysPresenterAuthorized(req: Request): boolean {
  const expected = process.env.AYS_PRESENTER_API_TOKEN;
  const actual = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!expected || actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

const WINDOW_MS = 60_000;
const windows = new Map<string, { count: number; resetsAt: number }>();

/** Limite per IP e per istanza: argine di primo livello, non un tetto di spesa. */
export function isAysPresenterRateLimited(req: Request, bucket: string, maxPerWindow: number): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetsAt <= now) {
    windows.set(key, { count: 1, resetsAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > maxPerWindow;
}
