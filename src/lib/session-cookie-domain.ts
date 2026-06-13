export function isMenuaryHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const normalized = host.split(":")[0].toLowerCase();
  return normalized === "menuary.it" || normalized.endsWith(".menuary.it");
}

export function isPynkstudioHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const normalized = host.split(":")[0].toLowerCase();
  return normalized === "pynkstudio.it" || normalized.endsWith(".pynkstudio.it");
}

export function resolveSessionCookieDomain(host: string | null | undefined): string | undefined {
  if (isMenuaryHost(host)) return ".menuary.it";
  if (isPynkstudioHost(host)) return ".pynkstudio.it";
  return undefined;
}

export function usesSharedMenuarySession(host: string | null | undefined): boolean {
  return resolveSessionCookieDomain(host) === ".menuary.it";
}
