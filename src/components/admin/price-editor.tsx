"use client";

import type { PriceFormat } from "@/lib/types";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type VolumeVariant = { id: string; label: string; price: number };

const KINDS: Array<{
  value: PriceFormat["kind"];
  label: string;
}> = [
  { value: "single", label: "Singolo" },
  { value: "sized", label: "Small / Big" },
  { value: "persone", label: "2 / 4 persone" },
  { value: "volume", label: "Personalizzato" },
];

export function PriceEditor({
  value,
  onChange,
  volumeLabelPresets = [],
  onAddVolumeLabelPreset,
}: {
  value: PriceFormat;
  onChange: (p: PriceFormat) => void;
  volumeLabelPresets?: string[];
  onAddVolumeLabelPreset?: (label: string) => void;
}) {
  function setKind(kind: PriceFormat["kind"]) {
    if (kind === value.kind) return;
    switch (kind) {
      case "single":
        onChange({ kind: "single", value: 0.5 });
        break;
      case "sized":
        onChange({ kind: "sized", small: 0.5, big: 0.5 });
        break;
      case "persone":
        onChange({ kind: "persone", per2: 0.5, per4: 0.5 });
        break;
      case "volume":
        onChange({
          kind: "volume",
          small: { label: "Variante 1", price: 0.5 },
          large: { label: "Variante 2", price: 0.5 },
          variants: [
            { id: genVolumeId(), label: "Variante 1", price: 0.5 },
            { id: genVolumeId(), label: "Variante 2", price: 0.5 },
          ],
        });
        break;
    }
  }

  function volumeVariants(): VolumeVariant[] {
    if (value.kind !== "volume") return [];
    return value.variants?.length
      ? value.variants
      : [
          { id: "small", label: value.small.label, price: value.small.price },
          { id: "large", label: value.large.label, price: value.large.price },
        ];
  }

  function setVolumeVariants(variants: VolumeVariant[]) {
    if (value.kind !== "volume") return;
    const normalized = variants.length
      ? variants
      : [{ id: genVolumeId(), label: "0,2 L", price: 0.5 }];
    onChange({
      ...value,
      small: {
        label: normalized[0]?.label ?? value.small.label,
        price: normalized[0]?.price ?? value.small.price,
      },
      large: {
        label: normalized[1]?.label ?? normalized[0]?.label ?? value.large.label,
        price: normalized[1]?.price ?? normalized[0]?.price ?? value.large.price,
      },
      variants: normalized,
    });
  }

  function patchVolumeVariant(id: string, patch: Partial<VolumeVariant>) {
    setVolumeVariants(
      volumeVariants().map((variant) =>
        variant.id === id ? { ...variant, ...patch } : variant,
      ),
    );
  }

  function moveVariant(id: string, direction: -1 | 1) {
    const current = volumeVariants();
    const index = current.findIndex((v) => v.id === id);
    if (index < 0) return;
    const target = index + direction;
    if (target < 0 || target >= current.length) return;
    const next = current.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setVolumeVariants(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => setKind(k.value)}
            className={
              "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors " +
              (value.kind === k.value
                ? "bg-pork-ink text-pork-cream"
                : "bg-pork-ink/5 text-pork-ink/60 hover:bg-pork-ink/10")
            }
          >
            {k.label}
          </button>
        ))}
      </div>

      {value.kind === "single" && (
        <NumberField
          label="Prezzo (€)"
          value={value.value}
          onChange={(v) => onChange({ kind: "single", value: v })}
        />
      )}

      {value.kind === "sized" && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Small (€)"
            value={value.small}
            onChange={(v) => onChange({ ...value, small: v })}
          />
          <NumberField
            label="Big (€)"
            value={value.big}
            onChange={(v) => onChange({ ...value, big: v })}
          />
        </div>
      )}

      {value.kind === "persone" && (
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="2 persone (€)"
            value={value.per2}
            onChange={(v) => onChange({ ...value, per2: v })}
          />
          <NumberField
            label="4 persone (€)"
            value={value.per4}
            onChange={(v) => onChange({ ...value, per4: v })}
          />
        </div>
      )}

      {value.kind === "volume" && (
        <div className="space-y-2">
          {volumeVariants().map((variant, index) => {
            const variants = volumeVariants();
            return (
            <div
              key={variant.id}
              className="grid gap-2 rounded-xl border border-pork-ink/10 bg-white p-3 sm:grid-cols-[auto_1fr_130px_auto]"
            >
              <div className="flex flex-col gap-1 self-end pb-2">
                <button
                  type="button"
                  onClick={() => moveVariant(variant.id, -1)}
                  disabled={index === 0}
                  className="rounded-md p-1 text-pork-ink/40 hover:bg-pork-ink/5 hover:text-pork-ink disabled:opacity-20"
                  aria-label={`Sposta su variante ${index + 1}`}
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => moveVariant(variant.id, 1)}
                  disabled={index === variants.length - 1}
                  className="rounded-md p-1 text-pork-ink/40 hover:bg-pork-ink/5 hover:text-pork-ink disabled:opacity-20"
                  aria-label={`Sposta giù variante ${index + 1}`}
                >
                  <ArrowDown size={12} />
                </button>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
                  Etichetta
                </span>
                <input
                  type="text"
                  value={variant.label}
                  list="volume-label-presets"
                  onChange={(e) => {
                    const next = e.target.value;
                    patchVolumeVariant(variant.id, { label: next });
                    if (next.trim()) onAddVolumeLabelPreset?.(next.trim());
                  }}
                  className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 outline-none transition-colors focus:border-pork-red"
                />
              </label>
              <NumberField
                label="Prezzo (€)"
                value={variant.price}
                onChange={(price) => patchVolumeVariant(variant.id, { price })}
              />
              <button
                type="button"
                onClick={() =>
                  setVolumeVariants(volumeVariants().filter((item) => item.id !== variant.id))
                }
                disabled={volumeVariants().length <= 1}
                className="self-end rounded-xl border border-pork-ink/10 p-2 text-pork-ink/45 hover:border-pork-red hover:text-pork-red disabled:opacity-30"
                aria-label={`Rimuovi variante ${index + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
            );
          })}
          <datalist id="volume-label-presets">
            {volumeLabelPresets.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>
          <button
            type="button"
            onClick={() =>
              setVolumeVariants([
                ...volumeVariants(),
                { id: genVolumeId(), label: volumeLabelPresets[0] ?? `Variante ${volumeVariants().length + 1}`, price: 0.5 },
              ])
            }
            className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1.5 text-xs font-bold text-pork-ink/70 hover:bg-pork-ink hover:text-pork-cream"
          >
            <Plus size={13} /> Aggiungi variante
          </button>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  const [draft, setDraft] = useState(() => formatPriceInput(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(formatPriceInput(value));
  }, [focused, value]);

  function commit(next: string) {
    const parsed = parsePriceInput(next);
    if (parsed == null) return;
    onChange(normalizePrice(parsed));
  }

  function setFromButton(next: number) {
    const normalized = normalizePrice(next);
    setDraft(formatPriceInput(normalized));
    onChange(normalized);
  }

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        {label}
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(e) => {
          const next = sanitizePriceInput(e.target.value);
          setDraft(next);
          commit(next);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          const parsed = parsePriceInput(draft);
          setDraft(formatPriceInput(parsed == null ? value : normalizePrice(parsed)));
        }}
        className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-center outline-none transition-colors focus:border-pork-red"
      />
      <div className="mt-1 grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => setFromButton(value - 1)}
          className="rounded-lg bg-pork-ink/5 px-1 py-1 text-[10px] font-black text-pork-ink/60 hover:bg-pork-ink/10"
          aria-label="Diminuisci di 1 euro"
        >
          «&nbsp;-1
        </button>
        <button
          type="button"
          onClick={() => setFromButton(value - 0.5)}
          className="rounded-lg bg-pork-ink/5 px-1 py-1 text-[10px] font-black text-pork-ink/60 hover:bg-pork-ink/10"
          aria-label="Diminuisci di 50 centesimi"
        >
          ‹&nbsp;-0,50
        </button>
        <button
          type="button"
          onClick={() => setFromButton(value + 0.5)}
          className="rounded-lg bg-pork-ink/5 px-1 py-1 text-[10px] font-black text-pork-ink/60 hover:bg-pork-ink/10"
          aria-label="Aumenta di 50 centesimi"
        >
          +0,50&nbsp;›
        </button>
        <button
          type="button"
          onClick={() => setFromButton(value + 1)}
          className="rounded-lg bg-pork-ink/5 px-1 py-1 text-[10px] font-black text-pork-ink/60 hover:bg-pork-ink/10"
          aria-label="Aumenta di 1 euro"
        >
          +1&nbsp;»
        </button>
      </div>
    </label>
  );
}

function sanitizePriceInput(value: string): string {
  const normalized = value.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const [euros, ...centsParts] = normalized.split(",");
  if (centsParts.length === 0) return euros;
  return `${euros},${centsParts.join("").slice(0, 2)}`;
}

function parsePriceInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized || normalized === ".") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPriceInput(value: number): string {
  return normalizePrice(value).toFixed(2).replace(".", ",");
}

function normalizePrice(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

function genVolumeId(): string {
  return `vol-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
