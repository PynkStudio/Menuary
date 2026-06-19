import { cookies } from "next/headers";

export const RIDER_SESSION_COOKIE = "rider-session";

export type RiderSession = {
  riderId: string;
  tenantId: string;
  riderName: string;
};

export async function getRiderSession(): Promise<RiderSession | null> {
  const store = await cookies();
  const raw = store.get(RIDER_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    if (
      typeof parsed.riderId === "string" &&
      typeof parsed.tenantId === "string" &&
      typeof parsed.riderName === "string"
    ) {
      return parsed as RiderSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function encodeRiderSession(session: RiderSession): string {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}
