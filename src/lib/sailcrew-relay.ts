import { createHash, createHmac, createPublicKey, randomUUID, timingSafeEqual, verify } from "node:crypto";
import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import type { WebSocket } from "ws";

const PROTOCOL_VERSION = 1;
const MAX_FRAMES_PER_SECOND = 250;

export type RelayClaims = { boatId: string; nodeId: string; deviceId: string; expiresAt: number };
type RelayClient = {
  socket: WebSocket;
  boatId: string;
  claimedNodeId: string;
  nodeId: string | null;
  connectionId: string;
  channel: RealtimeChannel | null;
  realtime: SupabaseClient;
  disconnected: boolean;
  rateWindowStartedAt: number;
  framesInWindow: number;
};

let supabaseClient: SupabaseClient | null = null;

function signingKey(): string {
  const value = process.env.SAILCREW_RELAY_SIGNING_KEY ?? "";
  if (Buffer.byteLength(value) < 32) throw new Error("SAILCREW_RELAY_SIGNING_KEY must contain at least 32 bytes");
  return value;
}

function supabase(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase Realtime credentials are not configured");
  supabaseClient = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return supabaseClient;
}

function realtimeCoordinator(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase Realtime credentials are not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function signature(payload: string): Buffer {
  return createHmac("sha256", signingKey()).update(payload).digest();
}

function safeEqualText(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function secretVerifier(boatId: string, boatSecret: string): string {
  return createHmac("sha256", signingKey()).update(`boat-secret:${boatId}:${boatSecret}`).digest("base64url");
}

function issueToken(claims: { boatId: string; nodeId: string; deviceId: string }): { accessToken: string; expiresAt: string } {
  const expiresAt = Date.now() + 15 * 60_000;
  const payload = Buffer.from(JSON.stringify({ v: 2, ...claims, exp: Math.floor(expiresAt / 1000) })).toString("base64url");
  return { accessToken: `${payload}.${signature(payload).toString("base64url")}`, expiresAt: new Date(expiresAt).toISOString() };
}

function validId(value: unknown, max = 160): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max && /^[A-Za-z0-9._:-]+$/.test(value);
}

export async function issueSailCrewDeviceCredential(input: Record<string, unknown>): Promise<{ accessToken: string; expiresAt: string }> {
  const { boatId, boatSecret, nodeId, deviceId, publicKey, nonce, timestamp, requestSignature } = input;
  if (!validId(boatId, 128) || !validId(nodeId) || !validId(deviceId, 64) || typeof boatSecret !== "string" || boatSecret.length < 32 || boatSecret.length > 512 || typeof publicKey !== "string" || typeof nonce !== "string" || nonce.length < 16 || nonce.length > 128 || typeof timestamp !== "number" || !Number.isSafeInteger(timestamp) || Math.abs(Date.now() - timestamp) > 5 * 60_000 || typeof requestSignature !== "string") {
    throw new Error("invalid_credential_request");
  }
  let publicKeyBytes: Buffer;
  let signatureBytes: Buffer;
  try {
    publicKeyBytes = Buffer.from(publicKey, "base64url");
    signatureBytes = Buffer.from(requestSignature, "base64url");
  } catch {
    throw new Error("invalid_device_proof");
  }
  const expectedDeviceId = createHash("sha256").update(publicKeyBytes).digest("base64url");
  const proof = `sailcrew-relay-credential-v1\n${boatId}\n${nodeId}\n${deviceId}\n${timestamp}\n${nonce}`;
  const derKey = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), publicKeyBytes]);
  if (publicKeyBytes.length !== 32 || !safeEqualText(deviceId, expectedDeviceId) || !verify(null, Buffer.from(proof), createPublicKey({ key: derKey, format: "der", type: "spki" }), signatureBytes)) {
    throw new Error("invalid_device_proof");
  }

  const client = supabase();
  const verifier = secretVerifier(boatId, boatSecret);
  const { data: existingBoat, error: boatReadError } = await client.from("sailcrew_relay_boats").select("secret_verifier").eq("boat_id", boatId).maybeSingle();
  if (boatReadError) throw boatReadError;
  if (!existingBoat) {
    const { error } = await client.from("sailcrew_relay_boats").insert({ boat_id: boatId, secret_verifier: verifier });
    if (error && error.code !== "23505") throw error;
    if (error) {
      const { data: racedBoat, error: racedReadError } = await client.from("sailcrew_relay_boats").select("secret_verifier").eq("boat_id", boatId).single();
      if (racedReadError || !safeEqualText(racedBoat.secret_verifier, verifier)) throw new Error("invalid_boat_secret");
    }
  } else if (!safeEqualText(existingBoat.secret_verifier, verifier)) {
    throw new Error("invalid_boat_secret");
  }

  const { data: existingDevice, error: deviceReadError } = await client.from("sailcrew_relay_devices").select("public_key, revoked_at").eq("boat_id", boatId).eq("device_id", deviceId).maybeSingle();
  if (deviceReadError) throw deviceReadError;
  if (existingDevice?.revoked_at || (existingDevice && !safeEqualText(existingDevice.public_key, publicKey))) throw new Error("device_not_authorized");
  const { error: deviceWriteError } = await client.from("sailcrew_relay_devices").upsert({ boat_id: boatId, device_id: deviceId, node_id: nodeId, public_key: publicKey, last_authenticated_at: new Date().toISOString() }, { onConflict: "boat_id,device_id" });
  if (deviceWriteError) throw deviceWriteError;
  return issueToken({ boatId, nodeId, deviceId });
}

function boatTopic(boatId: string): string {
  const opaqueId = createHmac("sha256", signingKey()).update(`boat:${boatId}`).digest("hex").slice(0, 40);
  return `sailcrew:${opaqueId}`;
}

export function verifySailCrewRelayToken(token: string): RelayClaims | null {
  const [payload, encodedSignature, extra] = token.split(".");
  if (!payload || !encodedSignature || extra) return null;
  try {
    const received = Buffer.from(encodedSignature, "base64url");
    const expected = signature(payload);
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
    if (decoded.v !== 2 || typeof decoded.boatId !== "string") return null;
    if (!decoded.boatId || decoded.boatId.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(decoded.boatId)) return null;
    if (typeof decoded.exp !== "number" || !Number.isSafeInteger(decoded.exp) || decoded.exp * 1000 <= Date.now()) return null;
    if (!validId(decoded.nodeId) || !validId(decoded.deviceId, 64)) return null;
    return { boatId: decoded.boatId, nodeId: decoded.nodeId, deviceId: decoded.deviceId, expiresAt: decoded.exp * 1000 };
  } catch {
    return null;
  }
}

function send(client: RelayClient, data: Record<string, unknown>): void {
  if (!client.disconnected && client.socket.readyState === 1) client.socket.send(JSON.stringify(data));
}

async function disconnect(client: RelayClient): Promise<void> {
  if (client.disconnected) return;
  client.disconnected = true;
  if (client.channel) {
    await client.channel.untrack().catch(() => undefined);
    await client.realtime.removeChannel(client.channel).catch(() => undefined);
    client.channel = null;
  }
}

function close(client: RelayClient, code: number, reason: string): void {
  client.socket.close(code, reason);
  void disconnect(client);
}

function rateLimitAllowsFrame(client: RelayClient): boolean {
  const now = Date.now();
  if (now - client.rateWindowStartedAt >= 1_000) {
    client.rateWindowStartedAt = now;
    client.framesInWindow = 0;
  }
  return ++client.framesInWindow <= MAX_FRAMES_PER_SECOND;
}

function peerIds(channel: RealtimeChannel, localNodeId: string): string[] {
  const ids = new Set<string>([localNodeId]);
  for (const presences of Object.values(channel.presenceState())) {
    for (const rawPresence of presences) {
      const presence = rawPresence as typeof rawPresence & { nodeId?: unknown };
      if (typeof presence.nodeId === "string") ids.add(presence.nodeId);
    }
  }
  return [...ids];
}

async function acceptHello(client: RelayClient, data: Record<string, unknown>): Promise<void> {
  const nodeId = data.nodeId;
  if (data.type !== "hello" || data.protocolVersion !== PROTOCOL_VERSION || data.boatId !== client.boatId || nodeId !== client.claimedNodeId) {
    close(client, 1008, "invalid_hello");
    return;
  }
  client.nodeId = nodeId;
  const channel = client.realtime.channel(boatTopic(client.boatId), {
    config: { presence: { key: `${nodeId}:${client.connectionId}` }, broadcast: { self: false, ack: true } },
  });
  client.channel = channel;
  channel
    .on("presence", { event: "sync" }, () => send(client, { type: "peerSnapshot", peers: peerIds(channel, nodeId) }))
    .on("broadcast", { event: "frame" }, ({ payload }) => {
      if (!payload || payload.originConnectionId === client.connectionId) return;
      if (payload.broadcast === true || payload.targetNodeId === client.nodeId) send(client, payload.frame as Record<string, unknown>);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ nodeId, connectionId: client.connectionId, onlineAt: Date.now() });
        send(client, { type: "peerSnapshot", peers: peerIds(channel, nodeId) });
        const { data: pending, error } = await supabase().from("sailcrew_relay_events").select("target_node_id,frame").eq("boat_id", client.boatId).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }).limit(500);
        if (error) console.error("SailCrew durable replay failed", error);
        else for (const row of pending ?? []) {
          if (row.target_node_id === null || row.target_node_id === nodeId) send(client, row.frame as Record<string, unknown>);
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("SailCrew relay coordination failed", { status });
        close(client, 1011, "realtime_unavailable");
      }
    });
}

async function routeFrame(client: RelayClient, data: Record<string, unknown>): Promise<void> {
  if (!["message", "pttStart", "pttEnd", "audioFrame", "syncEvent"].includes(String(data.type))) return;
  const broadcast = data.type === "syncEvent";
  if (!broadcast && (typeof data.targetNodeId !== "string" || !data.targetNodeId)) return;
  const frame = { ...data, nodeId: client.nodeId, senderId: client.nodeId, authorNodeId: client.nodeId };
  if (data.type === "message" || data.type === "syncEvent") {
    if (!validId(data.eventId, 200)) return;
    const encoded = JSON.stringify(frame);
    if (Buffer.byteLength(encoded) > 64_000) return;
    const { error } = await supabase().from("sailcrew_relay_events").upsert({ boat_id: client.boatId, event_id: data.eventId, author_node_id: client.nodeId, target_node_id: broadcast ? null : data.targetNodeId, frame }, { onConflict: "boat_id,event_id", ignoreDuplicates: true });
    if (error) {
      console.error("SailCrew durable event persistence failed", error);
      send(client, { type: "eventRejected", eventId: data.eventId, reason: "persistence_failed" });
      return;
    }
    send(client, { type: "eventStored", eventId: data.eventId });
  }
  await client.channel?.send({
    type: "broadcast",
    event: "frame",
    payload: {
      originConnectionId: client.connectionId,
      targetNodeId: data.targetNodeId,
      broadcast,
      frame,
    },
  });
}

export function attachSailCrewRelaySocket(socket: WebSocket, claims: RelayClaims): void {
  const client: RelayClient = {
    socket,
    boatId: claims.boatId,
    claimedNodeId: claims.nodeId,
    nodeId: null,
    connectionId: randomUUID(),
    channel: null,
    realtime: realtimeCoordinator(),
    disconnected: false,
    rateWindowStartedAt: Date.now(),
    framesInWindow: 0,
  };
  const helloTimeout = setTimeout(() => {
    if (!client.nodeId) close(client, 1008, "hello_timeout");
  }, 10_000);
  socket.on("message", (raw) => {
    if (!rateLimitAllowsFrame(client)) return close(client, 1008, "rate_limit");
    try {
      const data = JSON.parse(raw.toString()) as unknown;
      if (!data || typeof data !== "object" || Array.isArray(data)) return;
      const operation = !client.nodeId
        ? acceptHello(client, data as Record<string, unknown>)
        : routeFrame(client, data as Record<string, unknown>);
      void operation.catch((error) => {
        console.error("SailCrew relay frame handling failed", error);
        close(client, 1011, "relay_failure");
      });
    } catch {
      return;
    }
  });
  socket.once("close", () => { clearTimeout(helloTimeout); void disconnect(client); });
  socket.once("error", () => { clearTimeout(helloTimeout); void disconnect(client); });
}
