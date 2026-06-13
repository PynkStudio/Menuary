import "server-only";

const BUNQ_API = "https://api.bunq.com/v1";
const BUNQ_SANDBOX_API = "https://public-api.sandbox.bunq.com/v1";

function apiBase(): string {
  return process.env.BUNQ_SANDBOX === "true" ? BUNQ_SANDBOX_API : BUNQ_API;
}

function apiToken(): string {
  const token = process.env.BUNQ_API_TOKEN;
  if (!token) throw new Error("bunq_api_token_unset");
  return token;
}

export function monetaryAccountId(): string {
  const id = process.env.BUNQ_MONETARY_ACCOUNT_ID;
  if (!id) throw new Error("bunq_monetary_account_id_unset");
  return id;
}

function userId(): string {
  const id = process.env.BUNQ_USER_ID;
  if (!id) throw new Error("bunq_user_id_unset");
  return id;
}

export type BunqRequestInit = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
};

export type BunqError = {
  message: string;
  status: number;
};

export async function bunqRequest<T>(
  path: string,
  init: BunqRequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "User-Agent": "menuary-platform/1.0",
    "X-Bunq-Client-Authentication": apiToken(),
  };

  const method = init.method ?? "GET";
  const body = init.body ? JSON.stringify(init.body) : undefined;
  const url = `${apiBase()}${path}`;

  const res = await fetch(url, { method, headers, body });
  const json = await res.json().catch(() => null) as Record<string, unknown> | null;

  if (!res.ok) {
    const errorArr = json?.Error as Array<{ error_description: string }> | undefined;
    const message = errorArr?.[0]?.error_description ?? `bunq_request_failed_${res.status}`;
    const err: BunqError = { message, status: res.status };
    throw Object.assign(new Error(err.message), { bunq: err });
  }

  const response = json?.Response as T;
  if (!response) throw new Error("bunq_empty_response");
  return response;
}

export function userPath(): string {
  return `/user/${userId()}`;
}

export function accountPath(): string {
  return `${userPath()}/monetary-account/${monetaryAccountId()}`;
}
