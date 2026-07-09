"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, RefreshCw, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Passkey = {
  id: string;
  friendly_name?: string;
  created_at: string;
  last_used_at?: string;
};

function passkeyErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("passkey_disabled")) {
    return "Le passkey non sono abilitate per questo progetto Supabase.";
  }
  if (normalized.includes("too_many_passkeys")) {
    return "Hai raggiunto il numero massimo di passkey per questo account.";
  }
  if (normalized.includes("webauthn_credential_exists")) {
    return "Questa passkey è già associata al tuo account.";
  }
  if (normalized.includes("notallowederror") || normalized.includes("not allowed")) {
    return "Operazione annullata o non consentita dal browser.";
  }
  if (normalized.includes("securityerror")) {
    return "La passkey può essere creata solo dal dominio di accesso autorizzato.";
  }
  return "Non è stato possibile completare l'operazione. Riprova.";
}

function formatDate(value: string | undefined) {
  if (!value) return "Mai usata";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function PasskeySettingsPanel({ returnHref }: { returnHref?: string }) {
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supported =
    typeof window === "undefined" ||
    ("PublicKeyCredential" in window && typeof navigator.credentials !== "undefined");

  async function loadPasskeys() {
    setLoading(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: listError } = await supabase.auth.passkey.list();
    if (listError) {
      setError(passkeyErrorMessage(listError.message));
      setLoading(false);
      return;
    }
    setPasskeys(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadPasskeys();
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    setSuccess(null);
    const supabase = createSupabaseBrowserClient();
    const { data, error: createError } = await supabase.auth.registerPasskey();
    if (createError) {
      setError(passkeyErrorMessage(createError.message));
      setCreating(false);
      return;
    }
    setSuccess(`Passkey creata${data?.friendly_name ? `: ${data.friendly_name}` : ""}.`);
    await loadPasskeys();
    setCreating(false);
  }

  async function handleDelete(passkeyId: string) {
    setDeletingId(passkeyId);
    setError(null);
    setSuccess(null);
    const supabase = createSupabaseBrowserClient();
    const { error: deleteError } = await supabase.auth.passkey.delete({ passkeyId });
    if (deleteError) {
      setError(passkeyErrorMessage(deleteError.message));
      setDeletingId(null);
      return;
    }
    setSuccess("Passkey rimossa.");
    await loadPasskeys();
    setDeletingId(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 text-xl font-bold">
            <KeyRound size={18} /> Passkey
          </h2>
          <p className="mt-1 max-w-2xl text-sm opacity-70">
            Accedi senza password usando Face ID, Touch ID, Windows Hello o una chiave di sicurezza.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          disabled={!supported || creating}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--menuary-ink,var(--ga-accent,#1A1A1A))] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={15} />
          {creating ? "Creazione..." : "Crea passkey"}
        </button>
      </div>

      {!supported && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Questo browser non supporta WebAuthn/passkey.
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </p>
      )}

      <div className="rounded-2xl border border-[var(--menuary-line,rgba(0,0,0,0.12))] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--menuary-line,rgba(0,0,0,0.12))] px-4 py-3">
          <p className="text-sm font-bold">Passkey registrate</p>
          <button
            type="button"
            onClick={loadPasskeys}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold opacity-70 hover:bg-black/5 hover:opacity-100 disabled:opacity-40"
          >
            <RefreshCw size={13} />
            Aggiorna
          </button>
        </div>

        {loading ? (
          <p className="px-4 py-5 text-sm opacity-60">Caricamento passkey...</p>
        ) : passkeys.length === 0 ? (
          <p className="px-4 py-5 text-sm opacity-60">
            Nessuna passkey associata a questo account.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--menuary-line,rgba(0,0,0,0.12))]">
            {passkeys.map((passkey) => (
              <li key={passkey.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">{passkey.friendly_name || "Passkey"}</p>
                  <p className="mt-1 text-xs opacity-60">
                    Creata: {formatDate(passkey.created_at)} · Ultimo uso: {formatDate(passkey.last_used_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(passkey.id)}
                  disabled={deletingId === passkey.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {deletingId === passkey.id ? "Rimozione..." : "Rimuovi"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {returnHref && (
        <a href={returnHref} className="inline-flex text-sm font-semibold underline-offset-2 opacity-70 hover:underline hover:opacity-100">
          Torna al pannello
        </a>
      )}
    </div>
  );
}
