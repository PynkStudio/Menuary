"use client";

import { useState } from "react";
import type { messages as itMessages } from "@/i18n/messages/it";

type LeadFormT = typeof itMessages["marketing"]["leadForm"];

type FormStatus =
  | { type: "idle" }
  | { type: "sending" }
  | { type: "success" }
  | { type: "error"; message: string };

export function MarketingLeadForm({ t }: { t: LeadFormT }) {
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  async function submit(formData: FormData) {
    setStatus({ type: "sending" });
    const payload = { ...Object.fromEntries(formData.entries()), vertical: "food" };
    const response = await fetch("/api/marketing-leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response) {
      setStatus({ type: "error", message: t.errorConnection });
      return;
    }

    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string }
      | null;

    if (!response.ok || !data?.ok) {
      setStatus({
        type: "error",
        message: data?.error ?? t.errorDefault,
      });
      return;
    }

    setStatus({ type: "success" });
  }

  return (
    <form
      action={submit}
      className="rounded-[2rem] bg-[var(--menuary-line)] p-px shadow-[0_30px_90px_rgba(48,43,35,0.08)]"
    >
      <div className="rounded-[calc(2rem-1px)] bg-[var(--menuary-ink)] p-5 text-[var(--menuary-paper)] sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.name}>
            <input name="name" required autoComplete="name" />
          </Field>
          <Field label={t.restaurant}>
            <input name="restaurantName" required />
          </Field>
          <Field label={t.email}>
            <input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label={t.phone}>
            <input name="phone" autoComplete="tel" />
          </Field>
          <Field label={t.city}>
            <input name="city" />
          </Field>
          <Field label={t.interest}>
            <select name="interest" defaultValue="demo">
              <option value="demo">{t.interestDemo}</option>
              <option value="new-site">{t.interestNewSite}</option>
              <option value="migration">{t.interestMigration}</option>
              <option value="modules">{t.interestModules}</option>
            </select>
          </Field>
        </div>

        <Field label={t.message} full>
          <textarea
            name="message"
            rows={5}
            placeholder={t.messagePlaceholder}
          />
        </Field>

        <input
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/58">{t.tagline}</p>
          <button
            type="submit"
            disabled={status.type === "sending" || status.type === "success"}
            className="menuary-button menuary-button-accent disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status.type === "success" ? t.success : t.submit}
          </button>
        </div>

        {status.type === "error" && (
          <p className="mt-4 rounded-2xl bg-[#c86b4f]/20 px-4 py-3 text-sm font-semibold text-[#ffe2d8] ring-1 ring-[#c86b4f]/30">
            {status.message}
          </p>
        )}
        {status.type === "success" && (
          <p className="mt-4 rounded-2xl bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-300/20">
            {t.successMsg}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactElement<{ className?: string }>;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "mt-4" : ""}`}>
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-white/52">
        {label}
      </span>
      <span className="block [&_input]:w-full [&_input]:rounded-[1.1rem] [&_input]:border-0 [&_input]:bg-white/10 [&_input]:px-4 [&_input]:py-3 [&_input]:text-white [&_input]:outline-none [&_input]:ring-1 [&_input]:ring-white/10 [&_input]:placeholder:text-white/35 [&_input]:focus:ring-[var(--menuary-gold)]/70 [&_select]:w-full [&_select]:rounded-[1.1rem] [&_select]:border-0 [&_select]:bg-white/10 [&_select]:px-4 [&_select]:py-3 [&_select]:text-white [&_select]:outline-none [&_select]:ring-1 [&_select]:ring-white/10 [&_select]:focus:ring-[var(--menuary-gold)]/70 [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-[1.1rem] [&_textarea]:border-0 [&_textarea]:bg-white/10 [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-white [&_textarea]:outline-none [&_textarea]:ring-1 [&_textarea]:ring-white/10 [&_textarea]:placeholder:text-white/35 [&_textarea]:focus:ring-[var(--menuary-gold)]/70">
        {children}
      </span>
    </label>
  );
}
