import type { TenantTheme } from "./tenant";

function hexToRgbChannels(hex: string): string {
  const raw = hex.replace("#", "").trim();
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : raw;

  const value = Number.parseInt(normalized, 16);
  if (!Number.isFinite(value) || normalized.length !== 6) return "0 0 0";

  return [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ].join(" ");
}

export function tenantThemeCssVars(theme: TenantTheme): Record<string, string> {
  return {
    "--tenant-red": hexToRgbChannels(theme.red),
    "--tenant-red-dark": hexToRgbChannels(theme.redDark),
    "--tenant-peach": hexToRgbChannels(theme.peach),
    "--tenant-cream": hexToRgbChannels(theme.cream),
    "--tenant-ink": hexToRgbChannels(theme.ink),
    "--tenant-brick": hexToRgbChannels(theme.brick),
    "--tenant-mustard": hexToRgbChannels(theme.mustard),
    "--tenant-mustard-soft": hexToRgbChannels(theme.mustardSoft),
    "--tenant-green": hexToRgbChannels(theme.green),
    "--tenant-pink": hexToRgbChannels(theme.pink),
  };
}
