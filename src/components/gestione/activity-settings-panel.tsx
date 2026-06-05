"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle,
  Facebook,
  Globe2,
  Handshake,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Mic2,
  Music2,
  Phone,
  Save,
  Twitter,
  Youtube,
} from "lucide-react";
import { HelpHint } from "@/components/gestione/help-hint";
import { HoursWeekEditor } from "@/components/admin/hours-week-editor";
import { useTenant } from "@/components/core/tenant-provider";
import { useHydrated } from "@/components/core/providers";
import { SpecialHoursExceptionModal } from "@/components/gestione/google/special-hours-exception-modal";
import { getTenantContent } from "@/lib/tenant-content";
import {
  cloneHoursWeek,
  defaultHoursWeek,
  defaultHoursWeekForTenant,
  hoursWeekEquals,
  sanitizeHoursWeek,
  type DaySchedule,
} from "@/lib/venue-hours";
import { useSettingsStore } from "@/store/settings-store";
import {
  EMPTY_SOCIAL_LINKS,
  type SocialLinkKey,
  type SocialLinks,
} from "@/store/settings-store";

const SOCIAL_FIELDS: Array<{
  key: SocialLinkKey;
  label: string;
  placeholder: string;
  icon: ComponentType<{ size?: number }>;
  primary?: boolean;
  desktopPrimary?: boolean;
}> = [
  { key: "instagram", label: "Instagram", placeholder: "Link o @username", icon: Instagram, primary: true },
  { key: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/...", icon: Facebook, desktopPrimary: true },
  { key: "tiktok", label: "TikTok", placeholder: "Link o @username", icon: Music2, desktopPrimary: true },
  { key: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/...", icon: Youtube },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/company/...", icon: Linkedin },
  { key: "x", label: "X", placeholder: "https://x.com/...", icon: Twitter },
  { key: "threads", label: "Threads", placeholder: "https://www.threads.net/@...", icon: MessageCircle },
  { key: "tripadvisor", label: "Tripadvisor", placeholder: "https://www.tripadvisor.it/...", icon: Globe2 },
  { key: "google", label: "Google Business", placeholder: "https://g.page/r/...", icon: MapPin },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/39...", icon: MessageCircle },
];

function normalizeHandleSocialLink(key: SocialLinkKey, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (key !== "instagram" && key !== "tiktok") return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const withoutProtocol = trimmed.replace(/^www\./i, "");
  if (/^(instagram\.com|tiktok\.com)\//i.test(withoutProtocol)) {
    return `https://${withoutProtocol}`;
  }

  const handle = withoutProtocol.replace(/^@+/, "").replace(/^\/+|\/+$/g, "");
  if (!handle) return "";
  return key === "instagram"
    ? `https://www.instagram.com/${handle}/`
    : `https://www.tiktok.com/@${handle}`;
}

function normalizeSocialLinks(links: SocialLinks): SocialLinks {
  return SOCIAL_FIELDS.reduce<SocialLinks>(
    (acc, field) => ({
      ...acc,
      [field.key]: normalizeHandleSocialLink(field.key, links[field.key]),
    }),
    { ...EMPTY_SOCIAL_LINKS },
  );
}

export function ActivitySettingsPanel() {
  const hydrated = useHydrated();
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const settings = useSettingsStore();
  const setSettings = useSettingsStore((state) => state.set);
  const tenantDefaultHours = useMemo(() => defaultHoursWeekForTenant(tenant.id), [tenant.id]);
  const [addressDraft, setAddressDraft] = useState(settings.addressOverride);
  const [phoneDraft, setPhoneDraft] = useState(settings.phoneOverride);
  const [mainEmailDraft, setMainEmailDraft] = useState(settings.mainEmailOverride);
  const [workWithUsEnabled, setWorkWithUsEnabled] = useState(settings.workWithUsEnabled);
  const [workWithUsEmailDraft, setWorkWithUsEmailDraft] = useState(settings.workWithUsEmailOverride);
  const [collaborationsEnabled, setCollaborationsEnabled] = useState(settings.collaborationsEnabled);
  const [collaborationsEmailDraft, setCollaborationsEmailDraft] = useState(settings.collaborationsEmailOverride);
  const [socialLinksDraft, setSocialLinksDraft] = useState<SocialLinks>(() => ({
    ...EMPTY_SOCIAL_LINKS,
    ...settings.socialLinks,
  }));
  const [hoursDraft, setHoursDraft] = useState<DaySchedule[]>(() => defaultHoursWeekForTenant(tenant.id));
  const [showSpecialHoursModal, setShowSpecialHoursModal] = useState(false);
  const [showAllSocials, setShowAllSocials] = useState(() =>
    SOCIAL_FIELDS.some((f) => !f.primary && !f.desktopPrimary && (settings.socialLinks?.[f.key] ?? "").trim().length > 0),
  );
  const [activitySaving, setActivitySaving] = useState(false);
  const [activitySaveMessage, setActivitySaveMessage] = useState<string | null>(null);
  const [activitySaveError, setActivitySaveError] = useState<string | null>(null);

  // Voce del ristorante
  const [voice, setVoice] = useState({ tone: "", audience: "", keywords: "", do_examples: "", dont_examples: "" });
  const [voiceLoaded, setVoiceLoaded] = useState(false);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [voiceSaved, setVoiceSaved] = useState(false);

  const loadVoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/gestione/ai-voice?tenantId=${tenant.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data) setVoice({ tone: data.tone ?? "", audience: data.audience ?? "", keywords: data.keywords ?? "", do_examples: data.do_examples ?? "", dont_examples: data.dont_examples ?? "" });
      }
    } finally {
      setVoiceLoaded(true);
    }
  }, [tenant.id]);

  useEffect(() => { if (hydrated) loadVoice(); }, [hydrated, loadVoice]);

  async function saveVoice() {
    setVoiceSaving(true);
    try {
      await fetch("/api/gestione/ai-voice", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, ...voice }),
      });
      setVoiceSaved(true);
      setTimeout(() => setVoiceSaved(false), 2500);
    } finally {
      setVoiceSaving(false);
    }
  }

  useEffect(() => {
    if (!hydrated) return;
    const hours =
      tenant.id === "doca" && hoursWeekEquals(settings.hoursWeek, defaultHoursWeek())
        ? tenantDefaultHours
        : settings.hoursWeek;
    setAddressDraft(settings.addressOverride);
    setPhoneDraft(settings.phoneOverride);
    setMainEmailDraft(settings.mainEmailOverride);
    setWorkWithUsEnabled(settings.workWithUsEnabled);
    setWorkWithUsEmailDraft(settings.workWithUsEmailOverride);
    setCollaborationsEnabled(settings.collaborationsEnabled);
    setCollaborationsEmailDraft(settings.collaborationsEmailOverride);
    setSocialLinksDraft({ ...EMPTY_SOCIAL_LINKS, ...settings.socialLinks });
    setHoursDraft(cloneHoursWeek(hours));
  }, [
    hydrated,
    settings.addressOverride,
    settings.collaborationsEmailOverride,
    settings.collaborationsEnabled,
    settings.hoursWeek,
    settings.mainEmailOverride,
    settings.phoneOverride,
    settings.socialLinks,
    settings.workWithUsEmailOverride,
    settings.workWithUsEnabled,
    tenant.id,
    tenantDefaultHours,
  ]);

  const dirty = useMemo(
    () =>
      addressDraft !== settings.addressOverride ||
      phoneDraft !== settings.phoneOverride ||
      mainEmailDraft !== settings.mainEmailOverride ||
      workWithUsEnabled !== settings.workWithUsEnabled ||
      workWithUsEmailDraft !== settings.workWithUsEmailOverride ||
      collaborationsEnabled !== settings.collaborationsEnabled ||
      collaborationsEmailDraft !== settings.collaborationsEmailOverride ||
      JSON.stringify(normalizeSocialLinks(socialLinksDraft)) !==
        JSON.stringify({ ...EMPTY_SOCIAL_LINKS, ...settings.socialLinks }) ||
      !hoursWeekEquals(hoursDraft, settings.hoursWeek),
    [
      addressDraft,
      collaborationsEmailDraft,
      collaborationsEnabled,
      hoursDraft,
      mainEmailDraft,
      phoneDraft,
      settings.addressOverride,
      settings.collaborationsEmailOverride,
      settings.collaborationsEnabled,
      settings.hoursWeek,
      settings.mainEmailOverride,
      settings.phoneOverride,
      settings.socialLinks,
      settings.workWithUsEmailOverride,
      settings.workWithUsEnabled,
      socialLinksDraft,
      workWithUsEmailDraft,
      workWithUsEnabled,
    ],
  );
  const effectiveMainEmail = mainEmailDraft.trim() || content.contact.email || "";

  async function save() {
    const nextHours = sanitizeHoursWeek(hoursDraft);
    const hoursChanged = !hoursWeekEquals(nextHours, settings.hoursWeek);

    setActivitySaving(true);
    setActivitySaveMessage(null);
    setActivitySaveError(null);

    try {
      if (hoursChanged) {
        const res = await fetch("/api/gestione/hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId: tenant.id, hours: nextHours }),
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(json.error ?? "Errore nel salvataggio degli orari");
        }
      }

      setSettings({
        addressOverride: addressDraft,
        phoneOverride: phoneDraft,
        mainEmailOverride: mainEmailDraft,
        workWithUsEnabled,
        workWithUsEmailOverride: workWithUsEmailDraft,
        collaborationsEnabled,
        collaborationsEmailOverride: collaborationsEmailDraft,
        socialLinks: normalizeSocialLinks(socialLinksDraft),
        socialLinksConfigured: true,
        hoursWeek: nextHours,
      });
      setHoursDraft(cloneHoursWeek(nextHours));
      setActivitySaveMessage(hoursChanged ? "Dati salvati. Sync Google avviata." : "Dati salvati.");
      setTimeout(() => setActivitySaveMessage(null), 3000);
    } catch (e) {
      setActivitySaveError((e as Error).message);
    } finally {
      setActivitySaving(false);
    }
  }

  if (!hydrated) {
    return <p style={{ color: "var(--ga-ink-faint)" }}>Caricamento...</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header>
        <span className="ga-eyebrow">Dati attività</span>
        <h1 className="ga-heading">Indirizzo, contatti e orari</h1>
        <p className="ga-lead">
          Questi dati alimentano la pagina pubblica, i blocchi contatto e le informazioni operative del tenant.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <label className="ga-card">
          <span className="ga-card-title">
            <MapPin size={16} /> Indirizzo pubblico
          </span>
          <input
            value={addressDraft}
            onChange={(event) => setAddressDraft(event.target.value)}
            placeholder={content.address.full}
            className="ga-input mt-3"
          />
          <small className="ga-card-hint">
            Lascia vuoto per usare il dato tenant: {content.address.full}
          </small>
        </label>

        <label className="ga-card">
          <span className="ga-card-title">
            <Phone size={16} /> Telefono / WhatsApp
          </span>
          <input
            value={phoneDraft}
            onChange={(event) => setPhoneDraft(event.target.value)}
            placeholder={content.contact.phone}
            className="ga-input mt-3"
          />
          <small className="ga-card-hint">
            Lascia vuoto per usare il dato tenant: {content.contact.phone}
          </small>
        </label>

        <label className="ga-card">
          <span className="ga-card-title">
            <Mail size={16} /> Email principale
          </span>
          <input
            type="email"
            value={mainEmailDraft}
            onChange={(event) => setMainEmailDraft(event.target.value)}
            placeholder={content.contact.email || "info@esempio.it"}
            className="ga-input mt-3"
          />
          <small className="ga-card-hint">
            Usata come destinatario predefinito per i link email del footer.
          </small>
        </label>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="ga-card-title" style={{ fontSize: 16 }}>
            <Instagram size={17} /> Social
          </h2>
          <p className="ga-card-hint" style={{ marginTop: 4, fontSize: 12 }}>
            Compila solo i profili da mostrare nel footer pubblico.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {SOCIAL_FIELDS.filter((f) => f.primary || f.desktopPrimary || showAllSocials).map((field) => {
            const Icon = field.icon;
            const visibleOnMobile = field.primary || showAllSocials;
            return (
              <label
                key={field.key}
                className={`ga-card ${visibleOnMobile ? "" : "hidden lg:block"}`}
              >
                <span className="ga-card-title">
                  <Icon size={16} /> {field.label}
                </span>
                <input
                  type={field.key === "instagram" || field.key === "tiktok" ? "text" : "url"}
                  value={socialLinksDraft[field.key]}
                  onChange={(event) =>
                    setSocialLinksDraft((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  className="ga-input mt-3"
                />
              </label>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setShowAllSocials((v) => !v)}
          className="ga-btn-link"
          style={{ marginTop: 12, fontSize: 13 }}
        >
          {showAllSocials ? "Mostra solo i principali" : "Mostra tutti i social"}
        </button>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="ga-card-title" style={{ fontSize: 16 }}>
            <Mail size={17} /> Link email nel footer
          </h2>
          <p className="ga-card-hint" style={{ marginTop: 4, fontSize: 12 }}>
            Se il destinatario dedicato è vuoto, il link usa l&apos;email principale.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="ga-card">
            <div className="flex items-center justify-between gap-3">
              <span className="ga-card-title">
                <BriefcaseBusiness size={16} /> Lavora con noi
              </span>
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--ga-ink-muted)" }}>
                <input
                  type="checkbox"
                  className="ga-checkbox"
                  checked={workWithUsEnabled}
                  onChange={(event) => setWorkWithUsEnabled(event.target.checked)}
                />
                Attivo
              </label>
            </div>
            <label className="mt-4 block text-sm">
              Destinatario
              <input
                type="email"
                value={workWithUsEmailDraft}
                onChange={(event) => setWorkWithUsEmailDraft(event.target.value)}
                placeholder={effectiveMainEmail || "Email principale tenant"}
                className="ga-input mt-2"
              />
            </label>
          </div>

          <div className="ga-card">
            <div className="flex items-center justify-between gap-3">
              <span className="ga-card-title">
                <Handshake size={16} /> Collaborazioni
              </span>
              <label className="flex items-center gap-2 text-sm" style={{ color: "var(--ga-ink-muted)" }}>
                <input
                  type="checkbox"
                  className="ga-checkbox"
                  checked={collaborationsEnabled}
                  onChange={(event) => setCollaborationsEnabled(event.target.checked)}
                />
                Attivo
              </label>
            </div>
            <label className="mt-4 block text-sm">
              Destinatario
              <input
                type="email"
                value={collaborationsEmailDraft}
                onChange={(event) => setCollaborationsEmailDraft(event.target.value)}
                placeholder={effectiveMainEmail || "Email principale tenant"}
                className="ga-input mt-2"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="impact-title text-xs text-pork-red">Orario tipo</p>
            <h2 className="headline text-xl">Settimana standard</h2>
            <p className="mt-1 text-sm text-pork-ink/50">
              Questi orari compaiono sulla tua scheda Google Maps ogni settimana.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSpecialHoursModal(true)}
            className="ga-pill-link gap-1.5"
          >
            <CalendarClock size={14} /> Orari straordinari
          </button>
        </div>

        <HoursWeekEditor value={hoursDraft} onChange={setHoursDraft} />
      </section>

      {/* Voce del ristorante */}
      <section className="space-y-4">
        <div>
          <h2 className="ga-card-title" style={{ fontSize: 16 }}>
            <Mic2 size={17} /> Voce del ristorante
            <HelpHint className="ml-1" text="Questi campi alimentano le funzioni AI dell'editor piatti (riscrivi descrizione, genera ingredienti, traduzioni). Più informazioni dai, più risultati accurati." />
          </h2>
          <p className="ga-card-hint" style={{ marginTop: 4, fontSize: 12 }}>
            Descrivi lo stile comunicativo del tuo locale per guidare le funzioni AI.
          </p>
        </div>

        {voiceLoaded ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="ga-card">
              <span className="ga-card-title">
                Tono di voce
                <HelpHint className="ml-1" text="Es: informale e caldo, elegante e formale, ironico e giocoso, semplice e diretto." />
              </span>
              <input
                type="text"
                value={voice.tone}
                onChange={(e) => setVoice((v) => ({ ...v, tone: e.target.value }))}
                placeholder="Es: informale, caldo, familiare"
                className="ga-input mt-3"
              />
            </label>
            <label className="ga-card">
              <span className="ga-card-title">
                Pubblico target
                <HelpHint className="ml-1" text="Chi sono i tuoi clienti? Es: famiglie, coppie giovani, turisti, business lunch." />
              </span>
              <input
                type="text"
                value={voice.audience}
                onChange={(e) => setVoice((v) => ({ ...v, audience: e.target.value }))}
                placeholder="Es: famiglie e turisti, millennials foodies"
                className="ga-input mt-3"
              />
            </label>
            <label className="ga-card">
              <span className="ga-card-title">
                Parole chiave del brand
                <HelpHint className="ml-1" text="Termini o concetti che usi spesso e vuoi ritrovare nelle descrizioni AI." />
              </span>
              <input
                type="text"
                value={voice.keywords}
                onChange={(e) => setVoice((v) => ({ ...v, keywords: e.target.value }))}
                placeholder="Es: artigianale, tradizione, brace, km0"
                className="ga-input mt-3"
              />
            </label>
            <div className="ga-card">
              <span className="ga-card-title">Esempi di stile (do / don&apos;t)</span>
              <textarea
                rows={2}
                value={voice.do_examples}
                onChange={(e) => setVoice((v) => ({ ...v, do_examples: e.target.value }))}
                placeholder="✓ Es: «Frollatura lenta di 40 giorni, crosta croccante e cuore rosa»"
                className="ga-input mt-3 resize-none"
              />
              <textarea
                rows={2}
                value={voice.dont_examples}
                onChange={(e) => setVoice((v) => ({ ...v, dont_examples: e.target.value }))}
                placeholder="✗ Evita: «Gustosissimo piatto squisito e delizioso»"
                className="ga-input mt-2 resize-none"
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-pork-ink/40">Caricamento...</p>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveVoice}
            disabled={voiceSaving}
            className="ga-btn ga-btn-primary"
          >
            {voiceSaving ? (
              "Salvataggio..."
            ) : voiceSaved ? (
              "✓ Salvato"
            ) : (
              <><Save size={15} /> Salva voce</>
            )}
          </button>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {activitySaveMessage && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
            <CheckCircle size={15} /> {activitySaveMessage}
          </span>
        )}
        {activitySaveError && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700">
            <AlertCircle size={15} /> {activitySaveError}
          </span>
        )}
        <button type="button" disabled={!dirty || activitySaving} onClick={save} className="ga-btn ga-btn-primary">
          <Save size={15} /> {activitySaving ? "Salvataggio..." : "Salva dati attività"}
        </button>
      </div>

      {showSpecialHoursModal && (
        <SpecialHoursExceptionModal
          tenantId={tenant.id}
          onClose={() => setShowSpecialHoursModal(false)}
          onSaved={() => {
            setActivitySaveMessage("Orario straordinario salvato. Sync Google avviata.");
            setTimeout(() => setActivitySaveMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
}
