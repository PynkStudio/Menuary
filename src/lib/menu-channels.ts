import type { TenantFeatureFlags } from "@/lib/tenant";
import type { MenuOrderChannel } from "@/lib/types";

export type MenuOrderChannelDefinition = {
  value: MenuOrderChannel;
  label: string;
  requiredModules: Array<keyof TenantFeatureFlags>;
  ignoresTimeRules?: boolean;
};

export const MENU_ORDER_CHANNELS: MenuOrderChannelDefinition[] = [
  { value: "site", label: "Menu online (/menu)", requiredModules: ["onlineMenu"] },
  { value: "phone", label: "Ordini in chiamata", requiredModules: ["aiPhone"] },
  { value: "whatsapp", label: "Ordini WhatsApp", requiredModules: ["aiWhatsapp"] },
  { value: "online", label: "Ordini online", requiredModules: ["takeaway"] },
  { value: "table", label: "Ordini al tavolo", requiredModules: ["tableOrders"] },
  {
    value: "product_reservation",
    label: "Prenotazioni prodotti",
    requiredModules: ["reservations", "onlineMenu"],
    ignoresTimeRules: true,
  },
];

export const MENU_ORDER_CHANNEL_VALUES = MENU_ORDER_CHANNELS.map((channel) => channel.value);

export function isMenuOrderChannel(value: unknown): value is MenuOrderChannel {
  return typeof value === "string" && MENU_ORDER_CHANNEL_VALUES.includes(value as MenuOrderChannel);
}

export function menuChannelIgnoresTimeRules(channel: MenuOrderChannel): boolean {
  return MENU_ORDER_CHANNELS.some((definition) => definition.value === channel && definition.ignoresTimeRules);
}

export function availableMenuOrderChannels(modules: Record<keyof TenantFeatureFlags, boolean>) {
  return MENU_ORDER_CHANNELS.filter((channel) =>
    channel.requiredModules.every((module) => modules[module]),
  );
}
