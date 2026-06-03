import "server-only";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function messagingTwiML(messages: string[]): string {
  const clean = messages.map((message) => message.trim()).filter(Boolean);
  const body = clean.length
    ? clean.map((message) => `<Message>${escapeXml(message)}</Message>`).join("")
    : "";
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

export function twimlResponse(messages: string[], init?: ResponseInit): Response {
  return new Response(messagingTwiML(messages), {
    status: 200,
    headers: {
      "content-type": "text/xml; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}
