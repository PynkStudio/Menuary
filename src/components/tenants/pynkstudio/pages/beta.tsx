"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  BellRing,
  Car,
  Check,
  ExternalLink,
  FlaskConical,
  Gamepad2,
  Glasses,
  Globe,
  Headset,
  Hourglass,
  Laptop,
  LogOut,
  Mail,
  MessageSquareWarning,
  Monitor,
  Search,
  Smartphone,
  Sparkles,
  Tablet,
  Terminal,
  Trash2,
  Tv,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import {
  APPLE_DEVICES,
  BETA_CATEGORIES,
  BETA_DEVICE_GROUPS,
  BETA_DEVICES,
  BETA_FEEDBACK_KINDS,
  BETA_KINDS,
  BETA_LANGUAGES,
  GOOGLE_DEVICES,
  betaCategoryLabel,
  betaDeviceLabel,
  betaFeedbackKindLabel,
  betaFeedbackStatusLabel,
  betaKindLabel,
  betaLanguageLabel,
  betaMethodInfo,
  channelsForDevices,
  isValidEmail,
  type BetaChannel,
} from "@/lib/pynkstudio/beta-shared";

type Tester = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  devices: string[];
  apple_id_email: string | null;
  google_account_email: string | null;
  email_verified_at: string | null;
  notify_enabled: boolean;
  notify_categories: string[];
  notify_languages: string[];
  notify_kinds: string[];
};

type Beta = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  icon_url: string | null;
  category: string;
  languages: string[];
  kind: string;
  version: string | null;
  status: string;
  channels: BetaChannel[];
  feedback_url: string | null;
  ends_at: string | null;
};

type JoinRequest = { id: string; beta_id: string; device: string; status: string };

type FeedbackItem = {
  id: string;
  beta_id: string;
  device: string;
  kind: string;
  message: string;
  app_version: string | null;
  status: string;
  created_at: string;
};

type MeResponse = { tester: Tester | null; betas: Beta[]; requests: JoinRequest[]; feedback: FeedbackItem[] };

type Feedback = { kind: "success" | "error"; text: string } | null;

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((v) => v !== id) : [...list, id];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

const DEVICE_ICONS: Record<string, LucideIcon> = {
  iphone: Smartphone,
  ipad: Tablet,
  mac: Laptop,
  apple_watch: Watch,
  apple_tv: Tv,
  vision_pro: Glasses,
  android_phone: Smartphone,
  android_tablet: Tablet,
  android_tv: Tv,
  wear_os: Watch,
  android_auto: Car,
  chromebook: Laptop,
  windows: Monitor,
  linux: Terminal,
  steam_deck: Gamepad2,
  meta_quest: Headset,
  fire_tv: Tv,
  fire_tablet: Tablet,
  huawei: Smartphone,
  web: Globe,
};

function DeviceIcon({ device, className = "pynk-icon-xs" }: { device: string; className?: string }) {
  const Icon = DEVICE_ICONS[device] ?? Smartphone;
  return <Icon className={className} aria-hidden />;
}

function DevicePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="pynk-beta-device-groups">
      {BETA_DEVICE_GROUPS.map((g) => (
        <div key={g.id} className="pynk-beta-device-group">
          <p className="pynk-beta-device-group-label">{g.label}</p>
          <div className="pynk-beta-device-grid">
            {BETA_DEVICES.filter((d) => d.group === g.id).map((d) => {
              const on = value.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  className="pynk-beta-device"
                  aria-pressed={on}
                  onClick={() => onChange(toggle(value, d.id))}
                >
                  <span className="pynk-beta-device-icon"><DeviceIcon device={d.id} className="pynk-beta-device-svg" /></span>
                  <span className="pynk-beta-device-name">{d.label}</span>
                  <span className="pynk-beta-device-tick" aria-hidden>{on && <Check className="pynk-icon-xs" />}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Composizione decorativa dell'hero: un "banco di prova" con i dispositivi attorno alla build. */
function BetaHeroVisual() {
  const v = usePynkCopy().betaPage.visual;
  // Nomi di classe letterali: Tailwind elimina dal layer components quelli costruiti a runtime.
  const orbit: { device: string; label: string; pos: string }[] = [
    { device: "iphone", label: "iPhone", pos: "pynk-beta-visual-device-1" },
    { device: "mac", label: "Mac", pos: "pynk-beta-visual-device-2" },
    { device: "apple_tv", label: "Apple TV", pos: "pynk-beta-visual-device-3" },
    { device: "android_phone", label: "Android", pos: "pynk-beta-visual-device-4" },
    { device: "web", label: "Web", pos: "pynk-beta-visual-device-5" },
  ];
  return (
    <div className="pynk-beta-visual" aria-hidden>
      <div className="pynk-beta-visual-ring" />
      <div className="pynk-beta-visual-ring pynk-beta-visual-ring-2" />
      <div className="pynk-beta-visual-core">
        <span className="pynk-beta-visual-flask"><FlaskConical /></span>
        <span className="pynk-beta-visual-kicker">{v.build}</span>
        <span className="pynk-beta-visual-version">v1.2.0</span>
        <span className="pynk-beta-visual-status"><span className="pynk-beta-visual-dot" /> {v.status}</span>
      </div>
      {orbit.map((o) => (
        <span key={o.device} className={`pynk-beta-visual-device ${o.pos}`}>
          <DeviceIcon device={o.device} />
          {o.label}
        </span>
      ))}
      <span className="pynk-beta-visual-toast">
        <BellRing className="pynk-icon-xs" />
        {v.invite}
      </span>
    </div>
  );
}

function ChipFilter({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  label: string;
}) {
  return (
    <fieldset className="pynk-beta-fieldset">
      <legend className="pynk-beta-device-group-label">{label}</legend>
      <div className="pynk-beta-chips">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className="pynk-beta-chip"
            aria-pressed={value.includes(o.id)}
            onClick={() => onChange(toggle(value, o.id))}
          >
            {value.includes(o.id) && <Check className="pynk-icon-xs" aria-hidden />}
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function BetaMeta({ beta }: { beta: Beta }) {
  const c = usePynkCopy().betaPage.area;
  return (
    <div className="pynk-beta-meta">
      <span className="pynk-beta-tag" data-kind={beta.kind}>{betaKindLabel(beta.kind)}</span>
      <span className="pynk-chip">{betaCategoryLabel(beta.category)}</span>
      {beta.version && <span className="pynk-chip">v{beta.version}</span>}
      {beta.languages.map((l) => <span key={l} className="pynk-chip">{betaLanguageLabel(l)}</span>)}
      {beta.status === "full" && <span className="pynk-beta-tag" data-kind="full">{c.full}</span>}
      {beta.ends_at && <span className="pynk-chip">{c.until} {formatDate(beta.ends_at)}</span>}
    </div>
  );
}

function BetaIcon({ beta }: { beta: Beta }) {
  return beta.icon_url ? (
    // eslint-disable-next-line @next/next/no-img-element -- icone da URL esterni arbitrari (App Store, CDN)
    <img src={beta.icon_url} alt="" className="pynk-beta-icon" width={56} height={56} loading="lazy" />
  ) : (
    <span className="pynk-beta-icon pynk-beta-icon-fallback" aria-hidden><FlaskConical /></span>
  );
}

function PublicBetaList({ betas }: { betas: Beta[] }) {
  const c = usePynkCopy().betaPage;
  if (betas.length === 0) {
    return (
      <div className="pynk-beta-empty-card">
        <span className="pynk-beta-empty-icon"><Hourglass aria-hidden /></span>
        <p>{c.openNowEmpty}</p>
      </div>
    );
  }
  return (
    <div className="pynk-beta-grid">
      {betas.map((b) => (
        <article key={b.id} className="pynk-beta-card">
          <header className="pynk-beta-card-head">
            <BetaIcon beta={b} />
            <div>
              <h3 className="pynk-beta-card-title">{b.name}</h3>
              {b.tagline && <p className="pynk-beta-card-tagline">{b.tagline}</p>}
            </div>
          </header>
          <BetaMeta beta={b} />
          <div className="pynk-beta-chips">
            {b.channels.map((ch) => <span key={ch.device} className="pynk-beta-device-pill"><DeviceIcon device={ch.device} /> {betaDeviceLabel(ch.device)}</span>)}
          </div>
          <p className="pynk-beta-locked">{c.lockedHint}</p>
        </article>
      ))}
    </div>
  );
}

function JoinChannel({
  beta,
  channel,
  tester,
  request,
  onRequested,
  onFeedback,
}: {
  beta: Beta;
  channel: BetaChannel;
  tester: Tester;
  request: JoinRequest | undefined;
  onRequested: (r: JoinRequest) => void;
  onFeedback: (betaId: string) => void;
}) {
  const copy = usePynkCopy().betaPage;
  const c = copy.area;
  const method = betaMethodInfo(channel.method);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const account =
    method.account === "apple" ? tester.apple_id_email ?? tester.email
    : method.account === "google" ? tester.google_account_email ?? tester.email
    : null;

  const ask = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/pynkstudio/beta/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betaId: beta.id, device: channel.device }),
      });
      const data = await res.json();
      if (!res.ok || !data.request) throw new Error(data.error ?? "error");
      onRequested(data.request);
    } catch {
      setError(copy.form.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const canJoin = beta.status === "open";
  const joined = request?.status === "approved";

  // Aprire i link (o voler lasciare un feedback) vale come partecipazione: senza
  // approvazione non c'è altro modo di sapere chi sta usando la beta.
  const markJoined = () => {
    if (method.needsApproval || joined || !canJoin) return;
    onRequested({ id: `local-${beta.id}-${channel.device}`, beta_id: beta.id, device: channel.device, status: "approved" });
    void fetch("/api/pynkstudio/beta/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ betaId: beta.id, device: channel.device }),
      keepalive: true,
    }).catch(() => {});
  };

  return (
    <div className="pynk-beta-channel">
      <p className="pynk-beta-channel-head">
        <span className="pynk-beta-channel-icon"><DeviceIcon device={channel.device} /></span>
        <span>
          <strong>{betaDeviceLabel(channel.device)}</strong>
          <span className="pynk-beta-channel-method">{method.label}</span>
        </span>
      </p>
      <ol className="pynk-beta-steps">
        {method.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
      {(channel.notes || joined || (!method.needsApproval && channel.url)) && (
        <p className="pynk-beta-notes">
          {channel.notes}
          {(joined || (!method.needsApproval && channel.url && canJoin)) && (
            <>
              {channel.notes && " "}
              <button
                type="button"
                className="pynk-beta-inline-link"
                onClick={() => { markJoined(); onFeedback(beta.id); }}
              >
                {c.feedbackLink}
              </button>
            </>
          )}
        </p>
      )}

      {method.needsApproval && request?.status !== "approved" ? (
        request?.status === "pending" ? (
          <p className="pynk-beta-pending"><Hourglass className="pynk-icon-xs" aria-hidden /> {c.requestPending}</p>
        ) : request?.status === "rejected" ? (
          <p className="pynk-feedback pynk-feedback-error">{c.requestRejected}</p>
        ) : canJoin ? (
          <div className="pynk-beta-join-row">
            <button type="button" className="pynk-btn pynk-btn-primary" disabled={busy} onClick={ask}>{method.cta}</button>
            {account && <span className="pynk-muted pynk-beta-account">{c.requestAccount} {account}</span>}
          </div>
        ) : null
      ) : channel.url && canJoin ? (
        <>
          {account && <p className="pynk-muted pynk-beta-account">{c.useAccount} <strong>{account}</strong></p>}
          <div className="pynk-beta-join-row">
            {joinLinks(channel, method.cta, c).map((l, i, all) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`pynk-btn ${i === 0 ? "pynk-btn-primary" : "pynk-btn-outline"} pynk-beta-join`}
                onClick={markJoined}
              >
                {all.length > 1 && <span className="pynk-beta-join-step">{i + 1}</span>}
                {l.label} <ExternalLink className="pynk-icon-xs" aria-hidden />
              </a>
            ))}
          </div>
        </>
      ) : null}
      {error && <p className="pynk-feedback pynk-feedback-error">{error}</p>}
    </div>
  );
}

function joinLinks(channel: BetaChannel, cta: string, c: { joinGroup: string; install: string }) {
  return [
    channel.groupUrl ? { href: channel.groupUrl, label: c.joinGroup } : null,
    { href: channel.url, label: cta },
    channel.installUrl ? { href: channel.installUrl, label: c.install } : null,
  ].filter((l): l is { href: string; label: string } => !!l);
}

function BetaCard({
  beta,
  tester,
  requests,
  onRequested,
  onFeedback,
}: {
  beta: Beta;
  tester: Tester;
  requests: JoinRequest[];
  onRequested: (r: JoinRequest) => void;
  onFeedback: (betaId: string) => void;
}) {
  const c = usePynkCopy().betaPage.area;
  const mine = channelsForDevices(beta.channels, tester.devices);
  return (
    <article className="pynk-beta-card" data-available={mine.length > 0}>
      <header className="pynk-beta-card-head">
        <BetaIcon beta={beta} />
        <div>
          <h3 className="pynk-beta-card-title">{beta.name}</h3>
          {beta.tagline && <p className="pynk-beta-card-tagline">{beta.tagline}</p>}
        </div>
      </header>
      <BetaMeta beta={beta} />
      {beta.description && <p className="pynk-beta-desc">{beta.description}</p>}

      {mine.length === 0 ? (
        <p className="pynk-beta-locked">
          {c.notForYou}: {beta.channels.map((ch) => betaDeviceLabel(ch.device)).join(", ")}
        </p>
      ) : (
        <details className="pynk-beta-join-details" open={mine.length === 1}>
          <summary>{c.howToJoin}</summary>
          {mine.map((ch) => (
            <JoinChannel
              key={ch.device}
              beta={beta}
              channel={ch}
              tester={tester}
              request={requests.find((r) => r.beta_id === beta.id && r.device === ch.device)}
              onRequested={onRequested}
              onFeedback={onFeedback}
            />
          ))}
        </details>
      )}
      {beta.feedback_url && (
        <a href={beta.feedback_url} target="_blank" rel="noopener noreferrer" className="pynk-beta-feedback-link">
          {c.feedback}: {beta.feedback_url.replace(/^mailto:/i, "")} <ExternalLink className="pynk-icon-xs" aria-hidden />
        </a>
      )}
    </article>
  );
}

function SignupForm({ onDone }: { onDone: (status: "created" | "exists") => void }) {
  const copy = usePynkCopy();
  const c = copy.betaPage.form;
  const href = useTenantLocalizedHref();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", appleIdEmail: "", googleAccountEmail: "", website: "" });
  const [devices, setDevices] = useState<string[]>([]);
  const [notify, setNotify] = useState(true);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const hasApple = devices.some((d) => APPLE_DEVICES.has(d));
  const hasGoogle = devices.some((d) => GOOGLE_DEVICES.has(d));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim()) return setFeedback({ kind: "error", text: c.errorRequired });
    if (!isValidEmail(form.email.trim())) return setFeedback({ kind: "error", text: c.errorEmail });
    if (form.phone.replace(/\D/g, "").length < 6) return setFeedback({ kind: "error", text: c.errorPhone });
    if (devices.length === 0) return setFeedback({ kind: "error", text: c.errorDevices });
    if (!consent) return setFeedback({ kind: "error", text: c.errorConsent });

    setSending(true);
    try {
      const res = await fetch("/api/pynkstudio/beta/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          appleIdEmail: hasApple ? form.appleIdEmail : "",
          googleAccountEmail: hasGoogle ? form.googleAccountEmail : "",
          devices,
          notify,
          consent,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const map: Record<string, string> = {
          invalid_phone: c.errorPhone,
          no_devices: c.errorDevices,
          consent_required: c.errorConsent,
          invalid_account_email: c.errorAccountEmail,
          invalid_input: c.errorRequired,
        };
        return setFeedback({ kind: "error", text: map[data.error] ?? c.errorGeneric });
      }
      if (data.status === "exists") {
        setFeedback({ kind: "success", text: c.exists });
        onDone("exists");
      } else {
        onDone("created");
      }
    } catch {
      setFeedback({ kind: "error", text: c.errorGeneric });
    } finally {
      setSending(false);
    }
  };

  return (
    <form id="iscrizione" className="pynk-form pynk-beta-signup" onSubmit={submit} autoComplete="on" noValidate>
      <div className="pynk-beta-form-head">
        <h2 className="pynk-beta-form-title">{c.title}</h2>
        <p className="pynk-muted">{c.lead}</p>
      </div>
      <p className="pynk-beta-step"><span>1</span>{c.stepWho}</p>
      <div className="pynk-form-row">
        <div className="pynk-field">
          <label htmlFor="beta-first">{c.firstName}</label>
          <input id="beta-first" name="given-name" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} required />
        </div>
        <div className="pynk-field">
          <label htmlFor="beta-last">{c.lastName}</label>
          <input id="beta-last" name="family-name" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} required />
        </div>
      </div>
      <div className="pynk-form-row">
        <div className="pynk-field">
          <label htmlFor="beta-email">{c.email}</label>
          <input id="beta-email" name="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder={c.emailPlaceholder} required />
        </div>
        <div className="pynk-field">
          <label htmlFor="beta-phone">{c.phone}</label>
          <input id="beta-phone" name="tel" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder={c.phonePlaceholder} required />
        </div>
      </div>

      <p className="pynk-beta-step">
        <span>2</span>{c.stepDevices}
        {devices.length > 0 && <em className="pynk-beta-step-count">{devices.length} {devices.length === 1 ? c.selectedDevice : c.selectedDevices}</em>}
      </p>
      <div className="pynk-field">
        <span className="pynk-beta-label">{c.devicesLabel}</span>
        <span className="pynk-muted pynk-beta-hint">{c.devicesHint}</span>
        <DevicePicker value={devices} onChange={setDevices} />
      </div>

      {(hasApple || hasGoogle) && (
        <div className="pynk-form-row">
          {hasApple && (
            <div className="pynk-field">
              <label htmlFor="beta-apple">{c.appleIdLabel}</label>
              <input id="beta-apple" type="email" value={form.appleIdEmail} onChange={set("appleIdEmail")} placeholder={form.email || c.emailPlaceholder} />
              <span className="pynk-muted pynk-beta-hint">{c.appleIdHint}</span>
            </div>
          )}
          {hasGoogle && (
            <div className="pynk-field">
              <label htmlFor="beta-google">{c.googleLabel}</label>
              <input id="beta-google" type="email" value={form.googleAccountEmail} onChange={set("googleAccountEmail")} placeholder={form.email || c.emailPlaceholder} />
              <span className="pynk-muted pynk-beta-hint">{c.googleHint}</span>
            </div>
          )}
        </div>
      )}

      {/* Honeypot: invisibile alle persone, compilato dai bot. */}
      <input className="pynk-beta-hp" tabIndex={-1} autoComplete="off" aria-hidden name="website" value={form.website} onChange={set("website")} />

      <p className="pynk-beta-step"><span>3</span>{c.stepAlerts}</p>
      <label className="pynk-beta-check">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
        <span>{c.notify}</span>
      </label>
      <label className="pynk-beta-check">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          {c.consentBefore}<a href={href("/privacy")} className="pynk-accent" target="_blank" rel="noopener noreferrer">{c.consentLink}</a>{c.consentAfter}
        </span>
      </label>

      {feedback && <p className={`pynk-feedback pynk-feedback-${feedback.kind}`} role="status">{feedback.text}</p>}
      <button type="submit" className="pynk-btn pynk-btn-primary pynk-btn-lg pynk-btn-block" disabled={sending}>
        {sending ? c.sending : c.submit} {!sending && <ArrowRight className="pynk-icon-xs" aria-hidden />}
      </button>
    </form>
  );
}

function LoginForm() {
  const c = usePynkCopy().betaPage;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email.trim())) return setState("error");
    setState("sending");
    try {
      const res = await fetch("/api/pynkstudio/beta/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };
  return (
    <form id="accedi" className="pynk-beta-login" onSubmit={submit}>
      <p className="pynk-beta-login-title"><Mail className="pynk-icon-xs pynk-accent" aria-hidden /> {c.login.title}</p>
      <p className="pynk-muted">{c.login.body}</p>
      <div className="pynk-beta-login-row pynk-field">
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={c.form.emailPlaceholder} aria-label={c.form.email} />
        <button type="submit" className="pynk-btn pynk-btn-outline" disabled={state === "sending"}>{c.login.submit}</button>
      </div>
      {state === "sent" && <p className="pynk-feedback pynk-feedback-success" role="status">{c.login.sent}</p>}
      {state === "error" && <p className="pynk-feedback pynk-feedback-error" role="status">{c.form.errorEmail}</p>}
    </form>
  );
}

function ProfileTab({ tester, onSaved, onDeleted }: { tester: Tester; onSaved: (t: Tester) => void; onDeleted: () => void }) {
  const copy = usePynkCopy().betaPage;
  const c = copy.area;
  const f = copy.form;
  const [form, setForm] = useState({
    firstName: tester.first_name,
    lastName: tester.last_name,
    phone: tester.phone,
    appleIdEmail: tester.apple_id_email ?? "",
    googleAccountEmail: tester.google_account_email ?? "",
  });
  const [devices, setDevices] = useState(tester.devices);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (devices.length === 0) return setFeedback({ kind: "error", text: f.errorDevices });
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/pynkstudio/beta/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, devices }),
      });
      const data = await res.json();
      if (!res.ok) {
        const map: Record<string, string> = { invalid_phone: f.errorPhone, invalid_account_email: f.errorAccountEmail, invalid_input: f.errorRequired };
        return setFeedback({ kind: "error", text: map[data.error] ?? f.errorGeneric });
      }
      onSaved(data.tester);
      setFeedback({ kind: "success", text: c.saved });
    } catch {
      setFeedback({ kind: "error", text: f.errorGeneric });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(c.deleteConfirm)) return;
    const res = await fetch("/api/pynkstudio/beta/me", { method: "DELETE" });
    if (res.ok) onDeleted();
  };

  return (
    <form className="pynk-form" onSubmit={save}>
      <div className="pynk-form-row">
        <div className="pynk-field">
          <label htmlFor="p-first">{f.firstName}</label>
          <input id="p-first" value={form.firstName} onChange={set("firstName")} />
        </div>
        <div className="pynk-field">
          <label htmlFor="p-last">{f.lastName}</label>
          <input id="p-last" value={form.lastName} onChange={set("lastName")} />
        </div>
      </div>
      <div className="pynk-form-row">
        <div className="pynk-field">
          <label htmlFor="p-email">{f.email}</label>
          <input id="p-email" value={tester.email} disabled />
        </div>
        <div className="pynk-field">
          <label htmlFor="p-phone">{f.phone}</label>
          <input id="p-phone" type="tel" value={form.phone} onChange={set("phone")} />
        </div>
      </div>
      <div className="pynk-field">
        <span className="pynk-beta-label">{f.devicesLabel}</span>
        <DevicePicker value={devices} onChange={setDevices} />
      </div>
      <div className="pynk-form-row">
        <div className="pynk-field">
          <label htmlFor="p-apple">{f.appleIdLabel}</label>
          <input id="p-apple" type="email" value={form.appleIdEmail} onChange={set("appleIdEmail")} placeholder={tester.email} />
          <span className="pynk-muted pynk-beta-hint">{f.appleIdHint}</span>
        </div>
        <div className="pynk-field">
          <label htmlFor="p-google">{f.googleLabel}</label>
          <input id="p-google" type="email" value={form.googleAccountEmail} onChange={set("googleAccountEmail")} placeholder={tester.email} />
          <span className="pynk-muted pynk-beta-hint">{f.googleHint}</span>
        </div>
      </div>
      {feedback && <p className={`pynk-feedback pynk-feedback-${feedback.kind}`} role="status">{feedback.text}</p>}
      <div className="pynk-beta-actions">
        <button type="submit" className="pynk-btn pynk-btn-primary" disabled={busy}>{c.save}</button>
        <button type="button" className="pynk-beta-danger" onClick={remove}><Trash2 className="pynk-icon-xs" aria-hidden /> {c.deleteProfile}</button>
      </div>
    </form>
  );
}

function NotificationsTab({ tester, onSaved }: { tester: Tester; onSaved: (t: Tester) => void }) {
  const copy = usePynkCopy().betaPage;
  const c = copy.area;
  const [enabled, setEnabled] = useState(tester.notify_enabled);
  const [categories, setCategories] = useState(tester.notify_categories);
  const [languages, setLanguages] = useState(tester.notify_languages);
  const [kinds, setKinds] = useState(tester.notify_kinds);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [resent, setResent] = useState(false);

  const save = async () => {
    setFeedback(null);
    const res = await fetch("/api/pynkstudio/beta/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifyEnabled: enabled, notifyCategories: categories, notifyLanguages: languages, notifyKinds: kinds }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setFeedback({ kind: "error", text: copy.form.errorGeneric });
    onSaved(data.tester);
    setFeedback({ kind: "success", text: c.saved });
  };

  const resend = async () => {
    await fetch("/api/pynkstudio/beta/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: tester.email }),
    });
    setResent(true);
  };

  return (
    <div className="pynk-form">
      <div>
        <h2 className="pynk-beta-form-title"><Bell className="pynk-icon-xs pynk-accent" aria-hidden /> {c.notifyTitle}</h2>
        <p className="pynk-muted">{c.notifyBody}</p>
      </div>
      {!tester.email_verified_at && (
        <div className="pynk-beta-notice">
          <p>{c.notVerified}</p>
          {resent ? <p className="pynk-feedback pynk-feedback-success">{copy.login.sent}</p> : (
            <button type="button" className="pynk-btn pynk-btn-outline" onClick={resend}>{c.resendVerify}</button>
          )}
        </div>
      )}
      <label className="pynk-beta-check">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>{c.notifyEnabled}</span>
      </label>
      <fieldset className="pynk-beta-fieldset" disabled={!enabled}>
        <ChipFilter label={c.notifyKinds} options={BETA_KINDS} value={kinds} onChange={setKinds} />
        <ChipFilter label={c.notifyCategories} options={BETA_CATEGORIES} value={categories} onChange={setCategories} />
        <ChipFilter label={c.notifyLanguages} options={BETA_LANGUAGES} value={languages} onChange={setLanguages} />
      </fieldset>
      {feedback && <p className={`pynk-feedback pynk-feedback-${feedback.kind}`} role="status">{feedback.text}</p>}
      <div className="pynk-beta-actions">
        <button type="button" className="pynk-btn pynk-btn-primary" onClick={save}>{c.save}</button>
      </div>
    </div>
  );
}

function BetasTab({
  data,
  setRequests,
  onFeedback,
}: {
  data: MeResponse & { tester: Tester };
  setRequests: (fn: (r: JoinRequest[]) => JoinRequest[]) => void;
  onFeedback: (betaId: string) => void;
}) {
  const c = usePynkCopy().betaPage.area;
  const [query, setQuery] = useState("");
  const [onlyMine, setOnlyMine] = useState(true);
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [kind, setKind] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.betas.filter((b) => {
      if (onlyMine && channelsForDevices(b.channels, data.tester.devices).length === 0) return false;
      if (category && b.category !== category) return false;
      if (kind && b.kind !== kind) return false;
      if (language && b.languages.length > 0 && !b.languages.includes(language)) return false;
      if (q && !`${b.name} ${b.tagline ?? ""} ${b.description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.betas, data.tester.devices, onlyMine, category, language, kind, query]);

  const filtered = !!(query || category || language || kind);

  return (
    <div className="pynk-beta-area-body">
      <div className="pynk-beta-filters">
        <div className="pynk-beta-search pynk-field">
          <Search className="pynk-icon-xs pynk-beta-search-icon" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={c.search} aria-label={c.search} />
        </div>
        <select className="pynk-beta-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label={c.allCategories}>
          <option value="">{c.allCategories}</option>
          {BETA_CATEGORIES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <select className="pynk-beta-select" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label={c.allLanguages}>
          <option value="">{c.allLanguages}</option>
          {BETA_LANGUAGES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <select className="pynk-beta-select" value={kind} onChange={(e) => setKind(e.target.value)} aria-label={c.allKinds}>
          <option value="">{c.allKinds}</option>
          {BETA_KINDS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <label className="pynk-beta-check pynk-beta-check-inline">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} />
          <span>{c.onlyMine}</span>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className="pynk-muted pynk-beta-empty">{filtered || !onlyMine ? c.empty : c.emptyMine}</p>
      ) : (
        <div className="pynk-beta-grid">
          {visible.map((b) => (
            <BetaCard
              key={b.id}
              beta={b}
              tester={data.tester}
              requests={data.requests}
              onRequested={(r) => setRequests((prev) => [...prev.filter((p) => p.id !== r.id && !(p.beta_id === r.beta_id && p.device === r.device)), r])}
              onFeedback={onFeedback}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackTab({
  data,
  preselect,
  onSent,
}: {
  data: MeResponse & { tester: Tester };
  preselect: string;
  onSent: (f: FeedbackItem) => void;
}) {
  const c = usePynkCopy().betaPage.feedback;
  const joinedDevices = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of data.requests) {
      if (r.status !== "approved") continue;
      map.set(r.beta_id, [...(map.get(r.beta_id) ?? []), r.device]);
    }
    return map;
  }, [data.requests]);
  const joinedBetas = data.betas.filter((b) => joinedDevices.has(b.id));

  const [betaId, setBetaId] = useState(() => (joinedDevices.has(preselect) ? preselect : joinedBetas[0]?.id ?? ""));
  const beta = joinedBetas.find((b) => b.id === betaId);
  const devices = joinedDevices.get(betaId) ?? [];
  const [device, setDevice] = useState(devices[0] ?? "");
  const [kind, setKind] = useState("");
  const [message, setMessage] = useState("");
  const [version, setVersion] = useState(beta?.version ?? "");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const errorGeneric = usePynkCopy().betaPage.form.errorGeneric;

  const pickBeta = (id: string) => {
    setBetaId(id);
    setDevice(joinedDevices.get(id)?.[0] ?? "");
    setVersion(joinedBetas.find((b) => b.id === id)?.version ?? "");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!kind) return setFeedback({ kind: "error", text: c.errorKind });
    if (message.trim().length < 3) return setFeedback({ kind: "error", text: c.errorMessage });
    setSending(true);
    try {
      const res = await fetch("/api/pynkstudio/beta/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betaId, device: device || devices[0], kind, message, appVersion: version }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok || !out.feedback) return setFeedback({ kind: "error", text: errorGeneric });
      onSent(out.feedback);
      setKind("");
      setMessage("");
      setFeedback({ kind: "success", text: c.sent });
    } catch {
      setFeedback({ kind: "error", text: errorGeneric });
    } finally {
      setSending(false);
    }
  };

  const betaName = (id: string) => data.betas.find((b) => b.id === id)?.name ?? c.closedBeta;

  return (
    <div className="pynk-beta-feedback-layout">
      {joinedBetas.length === 0 ? (
        <div className="pynk-beta-empty-card">
          <span className="pynk-beta-empty-icon"><MessageSquareWarning aria-hidden /></span>
          <p>{c.emptyJoined}</p>
        </div>
      ) : (
        <form className="pynk-form" onSubmit={submit} noValidate>
          <div className="pynk-beta-form-head">
            <h2 className="pynk-beta-form-title">{c.title}</h2>
            <p className="pynk-muted">{c.lead}</p>
          </div>

          {joinedBetas.length > 1 ? (
            <div className="pynk-field">
              <label htmlFor="fb-beta">{c.beta}</label>
              <select id="fb-beta" className="pynk-beta-select" value={betaId} onChange={(e) => pickBeta(e.target.value)}>
                {joinedBetas.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          ) : beta && (
            <div className="pynk-beta-feedback-target">
              <BetaIcon beta={beta} />
              <div>
                <strong>{beta.name}</strong>
                {beta.version && <span className="pynk-muted"> · v{beta.version}</span>}
              </div>
            </div>
          )}

          {devices.length > 1 && (
            <fieldset className="pynk-beta-fieldset">
              <legend className="pynk-beta-device-group-label">{c.device}</legend>
              <div className="pynk-beta-chips">
                {devices.map((d) => (
                  <button key={d} type="button" className="pynk-beta-chip" aria-pressed={device === d} onClick={() => setDevice(d)}>
                    <DeviceIcon device={d} /> {betaDeviceLabel(d)}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="pynk-beta-fieldset">
            <legend className="pynk-beta-device-group-label">{c.kind}</legend>
            <div className="pynk-beta-kind-grid">
              {BETA_FEEDBACK_KINDS.map((k) => (
                <button key={k.id} type="button" className="pynk-beta-kind" data-kind={k.id} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
                  <strong>{k.label}</strong>
                  <span>{k.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="pynk-field">
            <label htmlFor="fb-message">{c.message}</label>
            <textarea id="fb-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={c.messagePlaceholder} maxLength={5000} />
          </div>
          <div className="pynk-field">
            <label htmlFor="fb-version">{c.version}</label>
            <input id="fb-version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.2.0 (9)" />
            <span className="pynk-muted pynk-beta-hint">{c.versionHint}</span>
          </div>

          {feedback && <p className={`pynk-feedback pynk-feedback-${feedback.kind}`} role="status">{feedback.text}</p>}
          <div className="pynk-beta-actions">
            <button type="submit" className="pynk-btn pynk-btn-primary" disabled={sending}>
              {sending ? c.sending : c.submit} {!sending && <ArrowRight className="pynk-icon-xs" aria-hidden />}
            </button>
          </div>
        </form>
      )}

      <section className="pynk-beta-feedback-history" aria-labelledby="fb-history">
        <h2 id="fb-history" className="pynk-beta-h2">{c.historyTitle}</h2>
        {data.feedback.length === 0 ? (
          <p className="pynk-muted">{c.historyEmpty}</p>
        ) : (
          <ul className="pynk-beta-feedback-list">
            {data.feedback.map((f) => (
              <li key={f.id} className="pynk-beta-feedback-item">
                <div className="pynk-beta-feedback-item-head">
                  <span className="pynk-beta-kind-tag" data-kind={f.kind}>{betaFeedbackKindLabel(f.kind)}</span>
                  <span className="pynk-beta-status-tag" data-status={f.status}>{betaFeedbackStatusLabel(f.status)}</span>
                </div>
                <p className="pynk-beta-feedback-msg">{f.message}</p>
                <p className="pynk-muted pynk-beta-hint">
                  {betaName(f.beta_id)} · {betaDeviceLabel(f.device)}{f.app_version ? ` · v${f.app_version}` : ""} · {formatDate(f.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BetaInner() {
  const copy = usePynkCopy();
  const c = copy.betaPage;
  const [data, setData] = useState<MeResponse | null>(null);
  const [tab, setTab] = useState<"betas" | "feedback" | "devices" | "notifications">("betas");
  const [feedbackBeta, setFeedbackBeta] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const load = useCallback(async () => {
    const res = await fetch("/api/pynkstudio/beta/me", { cache: "no-store" });
    if (res.ok) setData(await res.json());
    else setData({ tester: null, betas: [], requests: [], feedback: [] });
  }, []);

  useEffect(() => {
    void load();
    const params = new URLSearchParams(window.location.search);
    if (params.get("avvisi") === "off") setNotice(c.notices.unsubscribed);
    else if (params.get("link") === "scaduto") setNotice(c.notices.expiredLink);
  }, [load, c.notices.unsubscribed, c.notices.expiredLink]);

  const logout = async () => {
    await fetch("/api/pynkstudio/beta/logout", { method: "POST" });
    setNotice("");
    await load();
  };

  const tester = data?.tester ?? null;

  return (
    <div className="pynk-page">
      <section className="pynk-section pynk-section-top">
        <div className="pynk-container">
          {tester ? (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="pynk-beta-area-head">
              <div>
                <span className="pynk-eyebrow"><FlaskConical className="pynk-icon-xs" aria-hidden /> {c.eyebrow}</span>
                <h1 className="pynk-beta-area-title">
                  {c.area.hello} <span className="pynk-accent">{tester.first_name}</span>
                </h1>
                <p className="pynk-muted">{c.area.lead}</p>
              </div>
              <dl className="pynk-beta-stats">
                <div><dt>{c.area.statBetas}</dt><dd>{data!.betas.filter((b) => channelsForDevices(b.channels, tester.devices).length > 0).length}</dd></div>
                <div><dt>{c.area.statDevices}</dt><dd>{tester.devices.length}</dd></div>
                <div><dt>{c.area.statRequests}</dt><dd>{data!.requests.filter((r) => r.status === "pending").length}</dd></div>
                <div><dt>{c.area.statAlerts}</dt><dd className="pynk-beta-stat-word">{tester.notify_enabled ? c.area.alertsOn : c.area.alertsOff}</dd></div>
              </dl>
            </motion.div>
          ) : (
            <div className="pynk-beta-hero">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="pynk-beta-hero-copy">
                <span className="pynk-eyebrow"><Sparkles className="pynk-icon-xs" aria-hidden /> {c.eyebrow}</span>
                <h1 className="pynk-hero-title pynk-beta-hero-title">
                  <span className="pynk-block">{c.titleLine1}</span>
                  <span className="pynk-accent">{c.titleAccent}</span>
                </h1>
                <p className="pynk-beta-hero-lead">{c.subtitle}</p>
                <div className="pynk-beta-hero-ctas">
                  <a href="#iscrizione" className="pynk-btn pynk-btn-primary pynk-btn-lg">{c.ctaSignup} <ArrowRight className="pynk-icon-xs" aria-hidden /></a>
                  <a href="#accedi" className="pynk-btn pynk-btn-outline pynk-btn-lg">{c.ctaLogin}</a>
                </div>
                <div className="pynk-beta-platforms">
                  <span>{c.platformsLabel}</span>
                  {c.platforms.map((p) => <span key={p} className="pynk-beta-platform">{p}</span>)}
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.15 }}>
                <BetaHeroVisual />
              </motion.div>
            </div>
          )}

          {notice && <p className="pynk-beta-notice" role="status">{notice}</p>}

          {!data ? (
            <div className="pynk-beta-skeleton" aria-busy="true" />
          ) : tester ? (
            <>
              {!tester.email_verified_at && <p className="pynk-beta-notice">{c.notices.verify}</p>}
              <div className="pynk-beta-tabs" role="tablist" aria-label={c.eyebrow}>
                {(["betas", "feedback", "devices", "notifications"] as const).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} className="pynk-beta-tab" onClick={() => setTab(t)}>
                    {c.area.tabs[t]}
                  </button>
                ))}
                <button type="button" className="pynk-beta-tab pynk-beta-logout" onClick={logout}>
                  <LogOut className="pynk-icon-xs" aria-hidden /> {c.area.logout}
                </button>
              </div>
              {tab === "betas" && (
                <BetasTab
                  data={{ ...data, tester }}
                  setRequests={(fn) => setData((d) => (d ? { ...d, requests: fn(d.requests) } : d))}
                  onFeedback={(betaId) => { setFeedbackBeta(betaId); setTab("feedback"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                />
              )}
              {tab === "feedback" && (
                <FeedbackTab
                  data={{ ...data, tester }}
                  preselect={feedbackBeta}
                  onSent={(f) => setData((d) => (d ? { ...d, feedback: [f, ...d.feedback] } : d))}
                />
              )}
              {tab === "devices" && (
                <div className="pynk-narrow">
                  <ProfileTab
                    tester={tester}
                    onSaved={(t) => setData((d) => (d ? { ...d, tester: t } : d))}
                    onDeleted={() => { setTab("betas"); void load(); }}
                  />
                </div>
              )}
              {tab === "notifications" && (
                <div className="pynk-narrow">
                  <NotificationsTab tester={tester} onSaved={(t) => setData((d) => (d ? { ...d, tester: t } : d))} />
                </div>
              )}
            </>
          ) : (
            <>
              <div className="pynk-beta-how">
                <h2 className="pynk-beta-h2">{c.howTitle}</h2>
                <ol className="pynk-beta-how-list">
                  {c.how.map((s, i) => (
                    <li key={s.title} className="pynk-beta-how-item">
                      <span className="pynk-beta-how-num">{i + 1}</span>
                      <strong>{s.title}</strong>
                      <span className="pynk-muted">{s.body}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="pynk-beta-layout">
                <div className="pynk-beta-layout-form">
                  <SignupForm onDone={(status) => { if (status === "created") void load(); }} />
                  <LoginForm />
                </div>
                <div className="pynk-beta-layout-side">
                  <h2 className="pynk-beta-h2"><span className="pynk-beta-live" aria-hidden /> {c.openNowTitle}</h2>
                  <PublicBetaList betas={data.betas} />
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export function PynkStudioBetaPage() {
  return (
    <PynkShell>
      <BetaInner />
    </PynkShell>
  );
}
