import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const HUBRISE_AUTHORIZE_URL = "https://manager.hubrise.com/oauth2/v1/authorize";
const SCOPES = ["catalog.write", "orders.read", "customers.read", "customers.write"];

/**
 * Start OAuth flow HubRise: redirect a HubRise authorize.
 * Query: tenantId (obbligatorio), locationId (opzionale).
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.HUBRISE_OAUTH_CLIENT_ID;
  const callbackUrl = process.env.HUBRISE_OAUTH_CALLBACK_URL;
  if (!clientId || !callbackUrl) {
    return NextResponse.json({ error: "hubrise_oauth_unconfigured" }, { status: 500 });
  }

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenantId");
  const locationId = url.searchParams.get("locationId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const state = randomBytes(16).toString("hex");
  const jar = await cookies();
  jar.set("hubrise_oauth_state", state, { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" });
  jar.set(
    "hubrise_oauth_ctx",
    JSON.stringify({ tenantId, locationId }),
    { httpOnly: true, sameSite: "lax", maxAge: 600, path: "/" },
  );

  const authorize = new URL(HUBRISE_AUTHORIZE_URL);
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("redirect_uri", callbackUrl);
  authorize.searchParams.set("scope", SCOPES.join(" "));
  authorize.searchParams.set("state", state);

  return NextResponse.redirect(authorize.toString());
}
