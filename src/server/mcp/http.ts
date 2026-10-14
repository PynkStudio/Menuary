export function requestOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_PYNKSTUDIO_ADMIN_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");
  const forwarded = request.headers.get("x-forwarded-host");
  const host = forwarded ?? request.headers.get("host") ?? "admin.pynkstudio.eu";
  const protocol = request.headers.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export function mcpResource(request: Request): string {
  return `${requestOrigin(request)}/mcp`;
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
