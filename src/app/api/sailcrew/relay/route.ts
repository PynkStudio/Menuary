import { upgradeWebSocket } from "@vercel/functions";
import { attachSailCrewRelaySocket, verifySailCrewRelayToken } from "@/lib/sailcrew-relay";

export const maxDuration = 800;

export async function GET(request: Request): Promise<Response> {
  const authorization = request.headers.get("authorization");
  const claims = authorization?.startsWith("Bearer ")
    ? verifySailCrewRelayToken(authorization.slice(7))
    : null;
  if (!claims) return Response.json({ error: "invalid_token" }, { status: 401 });
  try {
    return await upgradeWebSocket(
      (socket) => attachSailCrewRelaySocket(socket, claims),
      { maxPayload: 100_000 },
    );
  } catch (error) {
    console.error("SailCrew WebSocket upgrade failed", error);
    return Response.json({ error: "upgrade_failed" }, { status: 500 });
  }
}

