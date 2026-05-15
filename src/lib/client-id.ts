"use client";

const KEY = "menuary-client-id";

export function getClientId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const id = `cli-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  window.localStorage.setItem(KEY, id);
  return id;
}
