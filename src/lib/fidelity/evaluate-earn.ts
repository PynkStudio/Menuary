import type {
  DateRangeBonusParams,
  DayOfWeekBonusParams,
  FidelityEarnRule,
  PerEuroSpentParams,
  PerOrderCountParams,
} from "./types";

export type EarnContext = {
  orderTotalEur: number;
  orderCreatedAt: Date;
  customerOrderCountBefore: number;
};

export type EarnResult = {
  ruleId: string;
  points: number;
  label: string;
};

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function evaluateEarn(rules: FidelityEarnRule[], ctx: EarnContext): EarnResult[] {
  const out: EarnResult[] = [];
  // basePoints accumulato dalle regole "per_euro_spent" / "per_order_count",
  // su cui poi i bonus moltiplicativi (day_of_week, date_range) si applicano.
  let basePoints = 0;
  let baseLabel: string | null = null;

  const ordered = [...rules]
    .filter((r) => r.is_active)
    .sort((a, b) => a.priority - b.priority);

  for (const rule of ordered) {
    switch (rule.kind) {
      case "signup_bonus":
        // gestita altrove (on enroll), non in ordine
        break;
      case "per_euro_spent": {
        const p = rule.params as Partial<PerEuroSpentParams>;
        if (ctx.orderTotalEur < asNumber(p.min_order, 0)) break;
        const points = Math.floor(ctx.orderTotalEur * asNumber(p.points_per_euro, 0));
        if (points > 0) {
          basePoints += points;
          baseLabel = rule.label;
          out.push({ ruleId: rule.id, points, label: rule.label });
        }
        break;
      }
      case "per_order_count": {
        const p = rule.params as Partial<PerOrderCountParams>;
        if (ctx.orderTotalEur < asNumber(p.min_order, 0)) break;
        const points = Math.floor(asNumber(p.points_per_order, 0));
        if (points > 0) {
          basePoints += points;
          baseLabel = rule.label;
          out.push({ ruleId: rule.id, points, label: rule.label });
        }
        break;
      }
      case "day_of_week_bonus": {
        const p = rule.params as Partial<DayOfWeekBonusParams>;
        const weekday = ctx.orderCreatedAt.getUTCDay();
        if (p.weekday !== weekday) break;
        const mult = asNumber(p.multiplier, 1);
        if (mult <= 1 || basePoints === 0) break;
        const bonus = Math.floor(basePoints * (mult - 1));
        if (bonus > 0) out.push({ ruleId: rule.id, points: bonus, label: rule.label });
        break;
      }
      case "date_range_bonus": {
        const p = rule.params as Partial<DateRangeBonusParams>;
        if (!p.from || !p.to) break;
        const t = ctx.orderCreatedAt.getTime();
        if (t < Date.parse(p.from) || t > Date.parse(`${p.to}T23:59:59Z`)) break;
        const mult = asNumber(p.multiplier, 1);
        if (mult <= 1 || basePoints === 0) break;
        const bonus = Math.floor(basePoints * (mult - 1));
        if (bonus > 0) out.push({ ruleId: rule.id, points: bonus, label: rule.label });
        break;
      }
    }
  }

  void baseLabel;
  return out;
}
