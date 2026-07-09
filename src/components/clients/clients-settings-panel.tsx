"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChangePasswordForm } from "@/components/shared/change-password-form";
import { buildPasskeysUrl } from "@/lib/login-url";

export function ClientsSettingsPanel() {
  const router = useRouter();
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm" | "loading" | "error">("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteAccount() {
    setDeleteStep("loading");
    setDeleteError(null);

    const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
    const json = await res.json();

    if (!res.ok) {
      setDeleteStep("error");
      setDeleteError(
        json.code === "has_active_staff_roles"
          ? "Il tuo account è ancora associato a uno o più locali come membro dello staff. Chiedi ai titolari di rimuoverti prima di poter eliminare l'account."
          : json.error ?? "Si è verificato un errore. Riprova.",
      );
      return;
    }

    // Account eliminato: porta alla home (sessione non più valida)
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-12">

      {/* ── Cambio password ────────────────────────────────────── */}
      <section>
        <h2 className="menuary-display text-xl">Cambia password</h2>
        <p className="mt-1 text-sm text-[var(--menuary-muted)]">
          Scegli una nuova password per il tuo account Menuary.
        </p>
        <div className="mt-6 max-w-md">
          <ChangePasswordForm />
        </div>
      </section>

      <hr className="border-[var(--menuary-line)]" />

      <section>
        <h2 className="menuary-display text-xl">Passkey</h2>
        <p className="mt-1 text-sm text-[var(--menuary-muted)]">
          Crea una passkey per accedere con Face ID, Touch ID, Windows Hello o una chiave di sicurezza.
        </p>
        <a
          href={buildPasskeysUrl({ from: "clienti", next: "/impostazioni" })}
          className="menuary-button menuary-button-accent mt-6 inline-flex"
        >
          Gestisci passkey
        </a>
      </section>

      <hr className="border-[var(--menuary-line)]" />

      {/* ── Eliminazione account ───────────────────────────────── */}
      <section>
        <h2 className="menuary-display text-xl text-red-600">Elimina account</h2>
        <p className="mt-1 text-sm text-[var(--menuary-muted)]">
          Questa azione è irreversibile. Tutti i tuoi dati personali, preferenze e
          cronologia verranno eliminati definitivamente.
        </p>
        <p className="mt-2 text-sm text-[var(--menuary-muted)]">
          Non puoi eliminare l&apos;account se sei ancora membro dello staff di un locale.
          Chiedi prima ai titolari di rimuoverti.
        </p>

        <div className="mt-6 max-w-md">
          {deleteStep === "idle" && (
            <button
              type="button"
              onClick={() => setDeleteStep("confirm")}
              className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
            >
              Elimina il mio account
            </button>
          )}

          {deleteStep === "confirm" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-4">
              <p className="text-sm font-semibold text-red-700">
                Sei sicuro? Questa operazione non può essere annullata.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80"
                >
                  Sì, elimina definitivamente
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteStep("idle")}
                  className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}

          {deleteStep === "loading" && (
            <p className="text-sm text-[var(--menuary-muted)]">
              Eliminazione in corso…
            </p>
          )}

          {deleteStep === "error" && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 space-y-3">
              <p className="text-sm font-semibold text-red-700">{deleteError}</p>
              <button
                type="button"
                onClick={() => { setDeleteStep("idle"); setDeleteError(null); }}
                className="text-sm font-semibold text-red-600 underline-offset-2 hover:underline"
              >
                Chiudi
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
