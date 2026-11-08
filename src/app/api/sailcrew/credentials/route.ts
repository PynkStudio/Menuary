import { issueSailCrewDeviceCredential } from "@/lib/sailcrew-relay";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }
  try {
    return Response.json(await issueSailCrewDeviceCredential(body as Record<string, unknown>), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "credential_failed";
    const denied = ["invalid_credential_request", "invalid_device_proof", "invalid_boat_secret", "device_not_authorized"].includes(code);
    if (!denied) console.error("SailCrew credential issuance failed", error);
    return Response.json({ error: denied ? code : "credential_failed" }, { status: denied ? 401 : 503 });
  }
}
