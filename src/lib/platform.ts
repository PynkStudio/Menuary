export type PlatformMode =
  | "tenant"
  | "marketing"
  | "platform-admin"
  | "preview";

export const PLATFORM_HOSTS = {
  marketing: ["menuary.it", "www.menuary.it", "menuary.localhost"],
  admin: ["admin.menuary.it", "admin.menuary.localhost"],
  preview: ["demo.menuary.it", "demo.menuary.localhost"],
} as const;

export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").toLowerCase().split(":")[0] ?? "";
}

export function getPlatformModeFromHost(
  host: string | null | undefined,
): PlatformMode {
  const normalized = normalizeHost(host);
  if (PLATFORM_HOSTS.marketing.includes(normalized as never)) return "marketing";
  if (PLATFORM_HOSTS.admin.includes(normalized as never)) return "platform-admin";
  if (PLATFORM_HOSTS.preview.includes(normalized as never)) return "preview";
  return "tenant";
}
