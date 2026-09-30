"use client";

import { useEffect, useState } from "react";
import type { messages as itMessages } from "@/i18n/messages/it";
import { DEFAULT_MARKET, MARKET_COOKIE, normalizeMarketCode } from "@/lib/markets";
import { getAttribution, trackConversion } from "@/lib/tracking/client";
import { trackLandingEvent } from "@/components/marketing/landings/landing-tracker";

type LeadFormT = typeof itMessages["marketing"]["leadForm"];

type FormStatus =
  | { type: "idle" }
  | { type: "sending" }
  | { type: "success" }
  | { type: "error"; message: string };

function currentMarket() {
  if (typeof document === "undefined") return DEFAULT_MARKET;
  const cookieMarket = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${MARKET_COOKIE}=`))
    ?.split("=")[1];
  return normalizeMarketCode(cookieMarket) ?? DEFAULT_MARKET;
}

/** Slug della landing verticale da cui arriva il visitatore (`/contatti?landing=…`). */
function sourceLanding(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("landing")?.trim();
  return value && /^[a-z0-9-]{1,48}$/.test(value) ? value : null;
}

export function MarketingLeadForm({ t, privacyHref }: { t: LeadFormT; privacyHref: string }) {
  const [status, setStatus] = useState<FormStatus>({ type: "idle" });

  useEffect(() => {
    const landing = sourceLanding();
    if (landing) trackLandingEvent("demo_form_open", { landing });
  }, []);

  async function submit(formData: FormData) {
    setStatus({ type: "sending" });
    const landing = sourceLanding();
    const payload = {
      ...Object.fromEntries(formData.entries()),
      vertical: "food",
      country: currentMarket(),
      attribution: getAttribution(),
      ...(landing ? { source: `menuary-landing:${landing}` } : {}),
    };
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
      | { ok?: boolean; code?: string }
      | null;

    if (!response.ok || !data?.ok) {
      const message =
        data?.code === "missing_fields"
          ? t.errorMissing
          : data?.code === "invalid_email"
            ? t.errorInvalidEmail
            : data?.code === "rate_limited"
              ? t.errorRateLimited
              : t.errorDefault;
      setStatus({ type: "error", message });
      return;
    }

    const interest = formData.get("interest");
    trackConversion("lead", {
      label: landing ? `landing:${landing}` : typeof interest === "string" ? interest : undefined,
    });
    if (landing) trackLandingEvent("demo_request_sent", { landing });
    setStatus({ type: "success" });
  }

  return (
    <form
      id="richiesta"
      action={submit}
      className="scroll-mt-28 rounded-[2rem] bg-[var(--menuary-line)] p-px shadow-[0_30px_90px_rgba(48,43,35,0.08)]"
    >
      <div className="rounded-[calc(2rem-1px)] bg-[var(--menuary-ink)] p-5 text-[var(--menuary-paper)] sm:p-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.name}>
            <input name="name" required autoComplete="name" />
          </Field>
          <Field label={t.restaurant}>
            <input name="restaurantName" required autoComplete="organization" />
          </Field>
          <Field label={t.email}>
            <input name="email" type="email" required autoComplete="email" inputMode="email" />
          </Field>
          <Field label={t.phone}>
            <input name="phone" type="tel" autoComplete="tel" inputMode="tel" />
          </Field>
        </div>

        <Field label={t.interest} full>
          <select name="interest" defaultValue="demo">
            <option value="demo">{t.interestDemo}</option>
            <option value="new-site">{t.interestNewSite}</option>
            <option value="migration">{t.interestMigration}</option>
            <option value="modules">{t.interestModules}</option>
          </select>
        </Field>

        <Field label={t.message} full>
          <textarea
            name="message"
            rows={3}
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
          <p className="text-xs leading-5 text-white/58">
            {t.privacyNotice}{" "}
            <a href={privacyHref} className="underline underline-offset-4 hover:text-white">
              {t.privacyLink}
            </a>
          </p>
          <button
            type="submit"
            disabled={status.type === "sending" || status.type === "success"}
            className="menuary-button menuary-button-accent shrink-0 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status.type === "success" ? t.success : t.submit}
          </button>
        </div>

        <div aria-live="polite">
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
      <span className="block [&_input]:w-full [&_input]:rounded-[1.1rem] [&_input]:border-0 [&_input]:bg-white/10 [&_input]:px-4 [&_input]:py-3 [&_input]:text-white [&_input]:outline-none [&_input]:ring-1 [&_input]:ring-white/10 [&_input]:placeholder:text-white/35 [&_input]:focus:ring-[var(--menuary-gold)]/70 [&_select]:w-full [&_select]:rounded-[1.1rem] [&_select]:border-0 [&_select]:bg-white/10 [&_select]:px-4 [&_select]:py-3 [&_select]:text-white [&_select]:outline-none [&_select]:ring-1 [&_select]:ring-white/10 [&_select]:focus:ring-[var(--menuary-gold)]/70 [&_option]:text-[var(--menuary-ink)] [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-[1.1rem] [&_textarea]:border-0 [&_textarea]:bg-white/10 [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-white [&_textarea]:outline-none [&_textarea]:ring-1 [&_textarea]:ring-white/10 [&_textarea]:placeholder:text-white/35 [&_textarea]:focus:ring-[var(--menuary-gold)]/70">
        {children}
      </span>
    </label>
  );
}
