import { NextRequest, NextResponse } from "next/server";
import { completeConnectOAuth, parseOAuthState } from "@/lib/payments/stripe/connect";

export const dynamic = "force-dynamic";

// GET /api/payments/stripe/callback?code=...&state=...
// Stripe ridireziona qui dopo l'autorizzazione OAuth. Scambiamo il code,
// salviamo l'account collegato e ridirigiamo l'utente al pannello admin.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const baseRedirect = "/admin/integrazioni/pagamenti";

  if (error) {
    return NextResponse.redirect(
      new URL(
        `${baseRedirect}?status=error&reason=${encodeURIComponent(errorDescription ?? error)}`,
        url,
      ),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL(`${baseRedirect}?status=error&reason=missing_params`, url));
  }

  const parsed = parseOAuthState(state);
  if (!parsed.valid) {
    return NextResponse.redirect(
      new URL(`${baseRedirect}?status=error&reason=${parsed.reason ?? "bad_state"}`, url),
    );
  }

  try {
    const account = await completeConnectOAuth({ tenantId: parsed.tenantId, code });
    const status = account.chargesEnabled ? "connected" : "pending";
    return NextResponse.redirect(
      new URL(
        `${baseRedirect}?status=${status}&tenant=${encodeURIComponent(parsed.tenantId)}`,
        url,
      ),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "callback_failed";
    return NextResponse.redirect(
      new URL(`${baseRedirect}?status=error&reason=${encodeURIComponent(message)}`, url),
    );
  }
}
