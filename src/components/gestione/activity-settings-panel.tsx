"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  BriefcaseBusiness,
  CalendarClock,
  Facebook,
  Globe2,
  Handshake,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Save,
  Twitter,
  Youtube,
} from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { useHydrated } from "@/components/core/providers";
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
}> = [
  { key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/...", icon: Instagram },
  { key: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/...", icon: Facebook },
  { key: "tiktok", label: "TikTok", placeholder: "https://www.tiktok.com/@...", icon: Music2 },
  { key: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/...", icon: Youtube },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/company/...", icon: Linkedin },
  { key: "x", label: "X", placeholder: "https://x.com/...", icon: Twitter },
  { key: "threads", label: "Threads", placeholder: "https://www.threads.net/@...", icon: MessageCircle },
  { key: "tripadvisor", label: "Tripadvisor", placeholder: "https://www.tripadvisor.it/...", icon: Globe2 },
  { key: "google", label: "Google Business", placeholder: "https://g.page/r/...", icon: MapPin },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/39...", icon: MessageCircle },
];

function normalizeSocialLinks(links: SocialLinks): SocialLinks {
  return SOCIAL_FIELDS.reduce<SocialLinks>(
    (acc, field) => ({
      ...acc,
      [field.key]: links[field.key].trim(),
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

  function updateDay(index: number, patch: Partial<DaySchedule>) {
    setHoursDraft((current) =>
      current.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)),
    );
  }

  function save() {
    const nextHours = sanitizeHoursWeek(hoursDraft);
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

        <div className="grid gap-4 md:grid-cols-2">
          {SOCIAL_FIELDS.map((field) => {
            const Icon = field.icon;
            return (
              <label key={field.key} className="ga-card">
                <span className="ga-card-title">
                  <Icon size={16} /> {field.label}
                </span>
                <input
                  type="url"
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

      <section className="ga-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="ga-card-title" style={{ fontSize: 16 }}>
              <CalendarClock size={17} /> Orari tipici
            </h2>
            <p className="ga-card-hint" style={{ marginTop: 4, fontSize: 12 }}>
              Una o più fasce per giorno, separate da virgola.
            </p>
          </div>
          <Link href={`/gestione/${tenant.id}/google/orari`} className="ga-pill-link">
            Date straordinarie
          </Link>
        </div>

        <div className="mt-5 grid gap-3">
          {hoursDraft.map((day, index) => (
            <div
              key={day.label}
              className="grid gap-3 rounded-xl p-3 sm:grid-cols-[120px_120px_1fr]"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--ga-border-soft)",
              }}
            >
              <strong className="self-center text-sm">{day.label}</strong>
              <label
                className="flex items-center gap-2 text-sm"
                style={{ color: "var(--ga-ink-muted)" }}
              >
                <input
                  type="checkbox"
                  className="ga-checkbox"
                  checked={day.closed}
                  onChange={(event) =>
                    updateDay(index, {
                      closed: event.target.checked,
                      slots: event.target.checked ? [] : day.slots.length ? day.slots : [""],
                    })
                  }
                />
                Chiuso
              </label>
              <input
                disabled={day.closed}
                value={day.slots.join(", ")}
                onChange={(event) =>
                  updateDay(index, {
                    slots: event.target.value.split(",").map((slot) => slot.trimStart()),
                  })
                }
                placeholder="09:00-13:00, 14:30-18:30"
                className="ga-input"
              />
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" disabled={!dirty} onClick={save} className="ga-btn ga-btn-primary">
          <Save size={15} /> Salva dati attività
        </button>
      </div>
    </div>
  );
}
