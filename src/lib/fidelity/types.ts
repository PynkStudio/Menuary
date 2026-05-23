export type FidelityExpiryKind =
  | "never"
  | "yearly_dec31"
  | "custom_date"
  | "days_from_accrual";

export type FidelityEarnKind =
  | "signup_bonus"
  | "per_euro_spent"
  | "per_order_count"
  | "day_of_week_bonus"
  | "date_range_bonus";

export type FidelityRewardKind =
  | "order_discount_amount"
  | "free_product"
  | "external_coupon_code"
  | "category_percent_discount";

export type FidelityLedgerSource =
  | "signup"
  | "order_earn"
  | "rule_bonus"
  | "redemption"
  | "expiry"
  | "manual_adjustment"
  | "refund";

export type FidelityRedemptionStatus =
  | "pending"
  | "applied"
  | "expired"
  | "refunded"
  | "cancelled";

export type FidelityProgram = {
  tenant_id: string;
  is_active: boolean;
  program_name: string;
  points_label: string;
  expiry_kind: FidelityExpiryKind;
  expiry_days: number | null;
  expiry_custom_date: string | null;
  optin_text: string;
  terms_url: string | null;
  created_at: string;
  updated_at: string;
};

export type FidelityEarnRule = {
  id: string;
  tenant_id: string;
  kind: FidelityEarnKind;
  label: string;
  params: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FidelityReward = {
  id: string;
  tenant_id: string;
  kind: FidelityRewardKind;
  name: string;
  description: string | null;
  points_cost: number;
  payload: Record<string, unknown>;
  stock: number | null;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
  sort_order: number;
};

export type FidelityMember = {
  id: string;
  tenant_id: string;
  user_id: string;
  enrolled_at: string;
  points_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  is_active: boolean;
};

export type FidelityLedgerEntry = {
  id: string;
  tenant_id: string;
  member_id: string;
  points: number;
  source: FidelityLedgerSource;
  order_id: string | null;
  rule_id: string | null;
  redemption_id: string | null;
  note: string | null;
  expires_at: string | null;
  expired_points: number;
  created_at: string;
};

export type FidelityRedemption = {
  id: string;
  tenant_id: string;
  member_id: string;
  reward_id: string;
  points_spent: number;
  coupon_code: string | null;
  status: FidelityRedemptionStatus;
  reward_kind: FidelityRewardKind;
  reward_payload: Record<string, unknown>;
  expires_at: string | null;
  order_id: string | null;
  created_at: string;
  applied_at: string | null;
};

// ── Param shapes (helper per UI/engine) ──────────────────────────────────
export type SignupBonusParams = { points: number };
export type PerEuroSpentParams = { points_per_euro: number; min_order?: number };
export type PerOrderCountParams = { points_per_order: number; min_order?: number };
export type DayOfWeekBonusParams = { weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6; multiplier: number };
export type DateRangeBonusParams = { from: string; to: string; multiplier: number };

export type OrderDiscountAmountPayload = { amount_eur: number };
export type FreeProductPayload = { menu_item_id: string };
export type ExternalCouponPayload = { code_prefix?: string; code_length?: number };
export type CategoryPercentDiscountPayload = { category_id: string; percent: number };
