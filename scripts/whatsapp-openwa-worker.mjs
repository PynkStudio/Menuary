import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import openWa from "@open-wa/wa-automate";

const { create, ev } = openWa;

const DEFAULT_CHROME_PATHS = [
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
];

function env(name, fallback = "") {
  return process.env[name]?.trim() || fallback;
}

function requiredEnv(name) {
  const value = env(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function resolveApiUrl() {
  const explicit = env("WHATSAPP_WEBHOOK_URL");
  if (explicit) return explicit;

  const base = requiredEnv("WHATSAPP_API_BASE_URL").replace(/\/+$/, "");
  const defaultPath = env("WHATSAPP_TENANT_ID") ? "/api/whatsapp/inbound" : "/api/webhooks/whatsapp/tenant-support";
  const pathName = env("TENANT_SUPPORT_WEBHOOK_PATH", defaultPath);
  return `${base}${pathName.startsWith("/") ? pathName : `/${pathName}`}`;
}

function resolveStatusUrl() {
  const explicit = env("WHATSAPP_SESSION_STATUS_URL");
  if (explicit) return explicit;

  const base = env("WHATSAPP_API_BASE_URL").replace(/\/+$/, "");
  return base ? `${base}/api/webhooks/whatsapp/session-status` : "";
}

function resolveChromePath() {
  const explicit = env("OPENWA_CHROME_PATH") || env("PUPPETEER_EXECUTABLE_PATH");
  if (explicit) return explicit;
  return DEFAULT_CHROME_PATHS.find((candidate) => fs.existsSync(candidate));
}

function normalizePhone(chatId) {
  const digits = String(chatId).replace(/@.+$/, "").replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function messageText(message) {
  return String(message.text || message.caption || message.body || "").trim();
}

function shouldIgnoreMessage(message) {
  const from = String(message.from || "");
  return (
    !from ||
    from === "status@broadcast" ||
    from.endsWith("@g.us") ||
    message.self === "out" ||
    message.local === true ||
    message.broadcast === true
  );
}

function imageMime(message) {
  const mimetype = String(message.mimetype || "").toLowerCase();
  return mimetype.startsWith("image/") ? mimetype : "";
}

const runtimeStatus = {
  ok: false,
  ready: false,
  state: "starting",
  qrDataUrl: null,
  qrText: null,
  updatedAt: new Date().toISOString(),
  error: null,
};
let statusServerStarted = false;

function patchRuntimeStatus(patch) {
  Object.assign(runtimeStatus, patch, { updatedAt: new Date().toISOString() });
}

function startStatusServer() {
  if (statusServerStarted) return;
  const port = Number.parseInt(env("WA_STATUS_PORT", "3031"), 10);
  if (!Number.isFinite(port) || port <= 0) return;
  const token = env("WA_STATUS_TOKEN");
  const server = http.createServer((req, res) => {
    if (req.url !== "/status") {
      res.writeHead(404, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "not_found" }));
      return;
    }
    if (token && req.headers.authorization !== `Bearer ${token}`) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
      return;
    }
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify(runtimeStatus));
  });
  server.listen(port, () => {
    statusServerStarted = true;
    console.info("[openwa] status server ready", { port });
  });
}

async function maybeDecryptImage(client, message) {
  if (!imageMime(message)) return null;
  try {
    return await client.decryptMedia(message);
  } catch (error) {
    console.error("[openwa] media decrypt failed", {
      messageId: message.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function postWebhook(url, secrets, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(secrets.webBridge ? { "x-whatsapp-web-secret": secrets.webBridge } : {}),
      ...(secrets.tenantSupport ? { "x-tenant-support-whatsapp-secret": secrets.tenantSupport } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`webhook_${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function normalizeQrDataUrl(qr) {
  const value = String(qr || "").trim();
  if (!value) return null;
  if (value.startsWith("data:image/")) return value;
  if (value.startsWith("iVBOR")) return `data:image/png;base64,${value}`;
  return value;
}

async function postSessionStatus(config, status, patch = {}) {
  if (!config.tenantId || !config.statusUrl) return;
  await fetch(config.statusUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.secrets.webBridge ? { "x-whatsapp-web-secret": config.secrets.webBridge } : {}),
    },
    body: JSON.stringify({
      tenantId: config.tenantId,
      sessionId: config.sessionId,
      status,
      ...patch,
    }),
  }).catch((error) => {
    console.error("[openwa] session status update failed", error instanceof Error ? error.message : String(error));
  });
}

async function sendReplies(client, to, replies) {
  for (const reply of replies) {
    const text = String(reply || "").trim();
    if (text) await client.sendText(to, text);
  }
}

async function handleIncomingMessage(client, config, message) {
  if (shouldIgnoreMessage(message)) return;

  const from = normalizePhone(message.from);
  const text = messageText(message);
  const imageDataUrl = await maybeDecryptImage(client, message);

  if (!from || (!text && !imageDataUrl)) return;

  const payload = {
    ...(config.tenantId ? { action: "incoming_message", tenantId: config.tenantId } : {}),
    from,
    text,
    messageId: message.id,
    imageDataUrl,
    payload: {
      openWaMessageId: message.id,
      chatId: message.from,
      type: message.type,
      mimetype: message.mimetype ?? null,
      timestamp: message.timestamp ?? message.t ?? null,
      notifyName: message.notifyName ?? null,
    },
  };

  console.info("[openwa] inbound", {
    from,
    type: message.type,
    hasText: Boolean(text),
    hasImage: Boolean(imageDataUrl),
  });

  const result = await postWebhook(config.webhookUrl, config.secrets, payload);
  const replies = Array.isArray(result.replies) ? result.replies : [];
  await sendReplies(client, message.from, replies);
}

async function start() {
  startStatusServer();
  const sessionDataPath = env("WA_SESSION_DATA_PATH", path.join(process.cwd(), ".openwa-session"));
  fs.mkdirSync(sessionDataPath, { recursive: true });

  const chromePath = resolveChromePath();
  const sessionId = env("WA_SESSION_ID", env("WHATSAPP_TENANT_ID") ? `tenant-${env("WHATSAPP_TENANT_ID")}` : "menuary-tenant-support");
  const config = {
    webhookUrl: resolveApiUrl(),
    statusUrl: resolveStatusUrl(),
    tenantId: env("WHATSAPP_TENANT_ID"),
    sessionId,
    secrets: {
      webBridge: env("WHATSAPP_WEB_BRIDGE_SECRET"),
      tenantSupport: env("TENANT_SUPPORT_WHATSAPP_SECRET"),
    },
  };

  console.info("[openwa] starting", {
    sessionId,
    sessionDataPath,
    webhookUrl: config.webhookUrl,
    statusUrl: config.statusUrl || "disabled",
    tenantId: config.tenantId || "support",
    chromePath: chromePath || "bundled",
  });

  ev.on(`qr.${sessionId}`, (qr) => {
    patchRuntimeStatus({
      ok: true,
      ready: false,
      state: "qr",
      qrDataUrl: normalizeQrDataUrl(qr),
      qrText: null,
      error: null,
    });
    if (config.tenantId) {
      void postSessionStatus(config, "pending_qr", { qrDataUrl: normalizeQrDataUrl(qr) });
    }
  });

  const client = await create({
    sessionId,
    sessionDataPath,
    headless: true,
    authTimeout: 0,
    qrTimeout: 0,
    qrLogSkip: env("OPENWA_QR_LOG_SKIP", "false").toLowerCase() === "true",
    disableSpins: true,
    killProcessOnBrowserClose: true,
    restartOnCrash: start,
    executablePath: chromePath,
    chromiumArgs: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      `--user-data-dir=${path.join(sessionDataPath, "chrome-profile")}`,
    ],
  });

  patchRuntimeStatus({
    ok: true,
    ready: true,
    state: "ready",
    qrDataUrl: null,
    qrText: null,
    error: null,
  });
  await postSessionStatus(config, "connected");
  const heartbeat = setInterval(() => {
    void postSessionStatus(config, "connected");
  }, Number(env("WHATSAPP_HEARTBEAT_MS", "60000")));

  await client.onMessage((message) => {
    handleIncomingMessage(client, config, message).catch((error) => {
      console.error("[openwa] message handling failed", {
        messageId: message?.id,
        from: message?.from,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });

  process.on("SIGTERM", async () => {
    console.info("[openwa] SIGTERM received, closing client");
    clearInterval(heartbeat);
    patchRuntimeStatus({ ok: false, ready: false, state: "disconnected", error: "worker_sigterm" });
    await postSessionStatus(config, "offline", { lastError: "worker_sigterm" });
    await client.kill().catch(() => undefined);
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.info("[openwa] SIGINT received, closing client");
    clearInterval(heartbeat);
    patchRuntimeStatus({ ok: false, ready: false, state: "disconnected", error: "worker_sigint" });
    await postSessionStatus(config, "offline", { lastError: "worker_sigint" });
    await client.kill().catch(() => undefined);
    process.exit(0);
  });

  console.info("[openwa] ready");
}

start().catch(async (error) => {
  patchRuntimeStatus({
    ok: false,
    ready: false,
    state: "error",
    error: error instanceof Error ? error.message : String(error),
  });
  console.error("[openwa] fatal", error);
  const base = env("WHATSAPP_API_BASE_URL").replace(/\/+$/, "");
  const tenantId = env("WHATSAPP_TENANT_ID");
  if (tenantId && base) {
    await fetch(`${base}/api/webhooks/whatsapp/session-status`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(env("WHATSAPP_WEB_BRIDGE_SECRET") ? { "x-whatsapp-web-secret": env("WHATSAPP_WEB_BRIDGE_SECRET") } : {}),
      },
      body: JSON.stringify({
        tenantId,
        sessionId: env("WA_SESSION_ID", `tenant-${tenantId}`),
        status: "error",
        lastError: error instanceof Error ? error.message : String(error),
      }),
    }).catch(() => undefined);
  }
  process.exit(1);
});
