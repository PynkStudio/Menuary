"use client";

import { useMemo, useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { HoursWeekEditor } from "@/components/admin/hours-week-editor";
import type { DaySchedule } from "@/lib/venue-hours";
import { hoursWeekEquals } from "@/lib/venue-hours";
import { useDraftPersistence } from "@/lib/hooks/use-draft-persistence";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";

interface Props {
  tenantId: string;
  locationId?: string;
  initialHours: DaySchedule[];
  googleConnected: boolean;
}

type SyncStatus = "idle" | "syncing" | "ok" | "error";

export function HoursSyncPanel({ tenantId, locationId, initialHours, googleConnected }: Props) {
  const draftKey = `draft:${tenantId}:${locationId ?? "global"}:orari-settimana`;
  const draft = useDraftPersistence<DaySchedule[]>(draftKey);

  const [hours, setHours] = useState<DaySchedule[]>(initialHours);

  const isDirty = useMemo(() => !hoursWeekEquals(hours, initialHours), [hours, initialHours]);
  useUnsavedChangesWarning(isDirty);
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  function handleChange(next: DaySchedule[]) {
    setHours(next);
    draft.saveDraft(next);
  }

  function restoreDraft() {
    const saved = draft.readDraft();
    if (saved) {
      setHours(saved);
      draft.clearDraft();
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/gestione/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, locationId, hours }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setSaveMessage("Orari salvati");
        draft.clearDraft();
      } else {
        setSaveMessage(json.error ?? "Errore nel salvataggio");
      }
    } catch {
      setSaveMessage("Errore di rete");
    } finally {
      setSaving(false);
    }
  }

  async function handleSync(mode: "regular" | "special" | "all") {
    setSyncStatus("syncing");
    setSyncError(null);
    try {
      const res = await fetch("/api/gestione/google/sync-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, mode }),
      });
      const json = (await res.json()) as { ok?: boolean; errors?: string[] };
      if (json.ok) {
        setSyncStatus("ok");
        setTimeout(() => setSyncStatus("idle"), 3000);
      } else {
        setSyncStatus("error");
        setSyncError(json.errors?.join(", ") ?? "Errore sconosciuto");
      }
    } catch {
      setSyncStatus("error");
      setSyncError("Errore di rete");
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner bozza non salvata */}
      {draft.draftDate && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            Hai modifiche non salvate del{" "}
            {draft.draftDate.toLocaleDateString("it-IT", {
              day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => draft.clearDraft()}
              className="rounded-full px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
            >
              Ignora
            </button>
            <button
              type="button"
              onClick={restoreDraft}
              className="inline-flex items-center gap-1 rounded-full bg-amber-700 px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
            >
              <RotateCcw size={12} /> Recupera modifiche
            </button>
          </div>
        </div>
      )}

      {/* Editor orari settimanali */}
      <div>
        <HoursWeekEditor value={hours} onChange={handleChange} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {saveMessage && (
            <p className="text-sm font-semibold text-pork-ink/60">{saveMessage}</p>
          )}
          <div className="flex gap-2 ml-auto">
            {googleConnected && (
              <button
                type="button"
                disabled={syncStatus === "syncing"}
                onClick={() => handleSync("regular")}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-pork-ink/15 px-4 py-2 text-sm font-bold transition-colors hover:border-pork-ink/40 disabled:opacity-40"
              >
                <RefreshCw size={14} className={syncStatus === "syncing" ? "animate-spin" : ""} />
                Sync orari su Google
              </button>
            )}
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-full bg-pork-ink px-5 py-2 text-sm font-bold text-pork-cream disabled:opacity-40"
            >
              {saving ? "Salvataggio…" : "Salva"}
            </button>
          </div>
        </div>
      </div>

      {syncStatus === "ok" && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700">
          <CheckCircle size={16} /> Orari sincronizzati su Google Maps
        </div>
      )}
      {syncStatus === "error" && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
          <AlertCircle size={16} /> {syncError}
        </div>
      )}

      {!googleConnected && (
        <p className="text-sm text-pork-ink/40 italic">
          Collega il tuo account Google Business per sincronizzare gli orari su Maps.
        </p>
      )}
    </div>
  );
}
