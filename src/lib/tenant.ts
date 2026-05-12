export type TenantFeatureFlags = {
  takeaway: boolean;
  tableOrders: boolean;
  kitchenDisplay: boolean;
  dinerSeparation: boolean;
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
