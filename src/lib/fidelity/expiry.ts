import type { FidelityProgram } from "./types";

export function computeExpiresAt(program: FidelityProgram, accruedAt: Date): Date | null {
  switch (program.expiry_kind) {
    case "never":
      return null;
    case "yearly_dec31": {
      const y = accruedAt.getUTCFullYear();
      return new Date(Date.UTC(y, 11, 31, 23, 59, 59));
    }
    case "custom_date":
      return program.expiry_custom_date ? new Date(`${program.expiry_custom_date}T23:59:59Z`) : null;
    case "days_from_accrual": {
      const days = program.expiry_days ?? 365;
      const d = new Date(accruedAt);
      d.setUTCDate(d.getUTCDate() + days);
      return d;
    }
  }
}
