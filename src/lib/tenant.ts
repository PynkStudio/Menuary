export type TenantFeatureFlags = {
  website: boolean;
  onlineMenu: boolean;
  takeaway: boolean;
  tableOrders: boolean;
  orderKiosk: boolean;
  kitchenDisplay: boolean;
  dinerSeparation: boolean;
  reservations: boolean;
  tablePlanner: boolean;
  productAvailability: boolean;
  upselling: boolean;
  crm: boolean;
  analytics: boolean;
  takeawaySlots: boolean;
  deliveryHub: boolean;
  inventoryFoodCost: boolean;
  printStations: boolean;
  staffRoles: boolean;
  multiLocation: boolean;
  favorites: boolean;
  reviews: boolean;
  gallery: boolean;
};

export type TenantTheme = {
  red: string;
  redDark: string;
  peach: string;
  cream: string;
  ink: string;
  brick: string;
  mustard: string;
  mustardSoft: string;
  green: string;
  pink: string;
};

export type TenantProfile = {
  id: string;
  name: string;
  label: string;
  domains: string[];
  previewSlug?: string;
  enabled: boolean;
  theme: TenantTheme;
  features: TenantFeatureFlags;
};

export type TenantFeatureKey = keyof TenantFeatureFlags;
