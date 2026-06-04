"use client";

import type { PriceFormat } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

type VolumeVariant = { id: string; label: string; price: number };

const KINDS: Array<{
  value: PriceFormat["kind"];
  label: string;
}> = [
  { value: "single", label: "Singolo" },
  { value: "sized", label: "Small / Big" },
  { value: "persone", label: "2 / 4 persone" },
  { value: "volume", label: "Volume (0,2l / 0,4l…)" },
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
          small: { label: "0,2 L", price: 0.5 },
          large: { label: "0,4 L", price: 0.5 },
          variants: [
            { id: genVolumeId(), label: "0,2 L", price: 0.5 },
            { id: genVolumeId(), label: "0,4 L", price: 0.5 },
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
          {volumeVariants().map((variant, index) => (
            <div
              key={variant.id}
              className="grid gap-2 rounded-xl border border-pork-ink/10 bg-white p-3 sm:grid-cols-[1fr_130px_auto]"
            >
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
                aria-label={`Rimuovi volume ${index + 1}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
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
                { id: genVolumeId(), label: volumeLabelPresets[0] ?? "", price: 0.5 },
              ])
            }
            className="inline-flex items-center gap-1 rounded-full bg-pork-ink/5 px-3 py-1.5 text-xs font-bold text-pork-ink/70 hover:bg-pork-ink hover:text-pork-cream"
          >
            <Plus size={13} /> Aggiungi volume
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
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-pork-ink/60">
        {label}
      </span>
      <input
        type="number"
        step="0.5"
        min={0.5}
        value={value}
        onChange={(e) => onChange(normalizePrice(Number(e.target.value)))}
        className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-2 text-center outline-none transition-colors focus:border-pork-red"
      />
      <div className="mt-1 grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onChange(normalizePrice(value - 0.5))}
          className="rounded-lg bg-pork-ink/5 px-2 py-1 text-xs font-black text-pork-ink/60 hover:bg-pork-ink/10"
        >
          -0,50
        </button>
        <button
          type="button"
          onClick={() => onChange(normalizePrice(value + 0.5))}
          className="rounded-lg bg-pork-ink/5 px-2 py-1 text-xs font-black text-pork-ink/60 hover:bg-pork-ink/10"
        >
          +0,50
        </button>
      </div>
    </label>
  );
}

function normalizePrice(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0.5, Math.round(value * 2) / 2);
}

function genVolumeId(): string {
  return `vol-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
