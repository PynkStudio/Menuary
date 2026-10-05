import { headers } from "next/headers";
import { resolveTenantFromHost } from "@/lib/tenant-runtime";

/**
 * Pagina di atterraggio del QR di "Are You Stupid?!" (party mode).
 * Con l'app installata iOS apre direttamente l'app tramite link universale e
 * questa pagina non viene mai caricata. Senza app (o da un browser): prova lo
 * schema `areyoustupid://` e offre il link all'App Store. HTML autonomo, fuori
 * dalla shell del sito, perché va servito senza redirect di lingua.
 */
const APP_STORE_URL = "https://apps.apple.com/app/id6809188487";

function page(room: string | null) {
  const deepLink = room ? `areyoustupid://join?room=${room}` : "areyoustupid://";
  const title = room ? `Join room ${room}` : "Are You Stupid?!";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<meta name="apple-itunes-app" content="app-id=6809188487${room ? `, app-argument=${deepLink}` : ""}">
<title>${title} · Are You Stupid?!</title>
<style>
:root{color-scheme:dark}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0e0d0c;color:#faf5eb;font:600 16px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;text-align:center;padding:24px;box-sizing:border-box}
main{max-width:420px}
h1{font-size:34px;line-height:1.05;margin:0 0 8px;font-weight:900;letter-spacing:-.5px}
h1 span{color:#ff2d55}
.code{font-size:56px;font-weight:900;letter-spacing:10px;color:#fed303;margin:18px 0}
p{color:#b9b4ad;margin:0 0 24px}
a.btn{display:block;padding:18px;border-radius:999px;text-decoration:none;font-weight:900;font-size:18px;margin:12px 0}
a.primary{background:#faf5eb;color:#0e0d0c}
a.secondary{border:2px solid #3a3836;color:#faf5eb}
</style></head>
<body><main>
<h1>ARE YOU <span>STUPID?!</span></h1>
${room ? `<p>You've been invited to a party room.</p><div class="code">${room}</div>` : `<p>The party game for your TV.</p>`}
<a class="btn primary" href="${deepLink}">OPEN THE GAME</a>
<a class="btn secondary" href="${APP_STORE_URL}">GET IT ON THE APP STORE</a>
<p>Already have it? Open the app, tap MULTIPLAYER and enter the room code.</p>
</main>
${room ? `<script>setTimeout(function(){location.href=${JSON.stringify(deepLink)}},300)</script>` : ""}
</body></html>`;
}

export async function GET(request: Request) {
  const tenant = resolveTenantFromHost((await headers()).get("host"));
  if (tenant?.id !== "pynkstudio") return new Response("Not found", { status: 404 });
  const raw = new URL(request.url).searchParams.get("room") ?? "";
  const room = /^[A-Za-z0-9]{4}$/.test(raw) ? raw.toUpperCase() : null;
  return new Response(page(room), {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}
