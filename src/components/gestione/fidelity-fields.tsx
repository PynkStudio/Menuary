"use client";

import { useState } from "react";
import type { FidelityEarnKind, FidelityRewardKind } from "@/lib/fidelity/types";

export const REWARD_KIND_LABELS: Record<FidelityRewardKind, string> = {
  order_discount_amount: "Sconto su totale ordine (€)",
  free_product: "Prodotto gratis",
  external_coupon_code: "Codice coupon esterno",
  category_percent_discount: "Sconto % su categoria",
};

export const EARN_KIND_LABELS: Record<FidelityEarnKind, string> = {
  signup_bonus: "Bonus iscrizione",
  per_euro_spent: "Punti per € spesi",
  per_order_count: "Punti per ordine",
  day_of_week_bonus: "Bonus giorno della settimana",
  date_range_bonus: "Bonus in un periodo",
};

const WEEKDAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];

type Option = { id: string; label: string };

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "ga-field ga-field-wide" : "ga-field"}>
      <span className="ga-label-text">{label}</span>
      {children}
    </label>
  );
}

/**
 * Campi di un premio. Il tipo si sceglie solo alla creazione: cambiarlo dopo
 * renderebbe incoerenti i premi già riscattati.
 */
export function RewardKindFields({
  lockedKind,
  payload = {},
  products,
  categories,
}: {
  lockedKind?: FidelityRewardKind;
  payload?: Record<string, unknown>;
  products: Option[];
  categories: Option[];
}) {
  const [kind, setKind] = useState<FidelityRewardKind>(lockedKind ?? "order_discount_amount");

  return (
    <>
      {lockedKind ? (
        <input type="hidden" name="kind" value={lockedKind} />
      ) : (
        <Field label="Tipo di premio">
          <select
            name="kind"
            className="ga-select"
            value={kind}
            onChange={(event) => setKind(event.target.value as FidelityRewardKind)}
          >
            {Object.entries(REWARD_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {kind === "order_discount_amount" && (
        <Field label="Importo sconto (€)">
          <input type="number" name="amount_eur" min={0.01} step="0.01" className="ga-input" defaultValue={(payload.amount_eur as number) ?? 5} required />
        </Field>
      )}
      {kind === "free_product" && (
        <Field label="Prodotto in omaggio" wide>
          {products.length > 0 ? (
            <select name="menu_item_id" className="ga-select" defaultValue={(payload.menu_item_id as string) ?? ""} required>
              <option value="" disabled>
                Scegli un prodotto
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="ga-card-hint">Aggiungi prima i prodotti al menu.</span>
          )}
        </Field>
      )}
      {kind === "external_coupon_code" && (
        <>
          <Field label="Prefisso codice">
            <input name="code_prefix" className="ga-input" defaultValue={(payload.code_prefix as string) ?? "FID"} />
          </Field>
          <Field label="Lunghezza codice">
            <input type="number" name="code_length" min={4} max={16} className="ga-input" defaultValue={(payload.code_length as number) ?? 8} />
          </Field>
        </>
      )}
      {kind === "category_percent_discount" && (
        <>
          <Field label="Categoria">
            {categories.length > 0 ? (
              <select name="category_id" className="ga-select" defaultValue={(payload.category_id as string) ?? ""} required>
                <option value="" disabled>
                  Scegli una categoria
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="ga-card-hint">Aggiungi prima le categorie al menu.</span>
            )}
          </Field>
          <Field label="Sconto (%)">
            <input type="number" name="percent" min={1} max={100} className="ga-input" defaultValue={(payload.percent as number) ?? 20} />
          </Field>
        </>
      )}
    </>
  );
}

export function EarnRuleKindFields({
  lockedKind,
  params = {},
}: {
  lockedKind?: FidelityEarnKind;
  params?: Record<string, unknown>;
}) {
  const [kind, setKind] = useState<FidelityEarnKind>(lockedKind ?? "per_euro_spent");

  return (
    <>
      {lockedKind ? (
        <input type="hidden" name="kind" value={lockedKind} />
      ) : (
        <Field label="Tipo di regola">
          <select
            name="kind"
            className="ga-select"
            value={kind}
            onChange={(event) => setKind(event.target.value as FidelityEarnKind)}
          >
            {Object.entries(EARN_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      )}

      {kind === "signup_bonus" && (
        <Field label="Punti all'iscrizione">
          <input type="number" name="points" min={1} className="ga-input" defaultValue={(params.points as number) ?? 50} />
        </Field>
      )}
      {kind === "per_euro_spent" && (
        <>
          <Field label="Punti per ogni €">
            <input type="number" name="points_per_euro" min={0} step="0.01" className="ga-input" defaultValue={(params.points_per_euro as number) ?? 1} />
          </Field>
          <Field label="Ordine minimo (€)">
            <input type="number" name="min_order" min={0} step="0.01" className="ga-input" defaultValue={(params.min_order as number) ?? 0} />
          </Field>
        </>
      )}
      {kind === "per_order_count" && (
        <>
          <Field label="Punti per ordine">
            <input type="number" name="points_per_order" min={1} className="ga-input" defaultValue={(params.points_per_order as number) ?? 10} />
          </Field>
          <Field label="Ordine minimo (€)">
            <input type="number" name="min_order" min={0} step="0.01" className="ga-input" defaultValue={(params.min_order as number) ?? 0} />
          </Field>
        </>
      )}
      {kind === "day_of_week_bonus" && (
        <>
          <Field label="Giorno">
            <select name="weekday" className="ga-select" defaultValue={String((params.weekday as number) ?? 1)}>
              {WEEKDAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Moltiplicatore (2 = punti doppi)">
            <input type="number" name="multiplier" min={1} step="0.1" className="ga-input" defaultValue={(params.multiplier as number) ?? 2} />
          </Field>
        </>
      )}
      {kind === "date_range_bonus" && (
        <>
          <Field label="Dal">
            <input type="date" name="from" className="ga-input" defaultValue={(params.from as string) ?? ""} required />
          </Field>
          <Field label="Al">
            <input type="date" name="to" className="ga-input" defaultValue={(params.to as string) ?? ""} required />
          </Field>
          <Field label="Moltiplicatore">
            <input type="number" name="multiplier" min={1} step="0.1" className="ga-input" defaultValue={(params.multiplier as number) ?? 2} />
          </Field>
        </>
      )}
    </>
  );
}
