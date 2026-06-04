"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  Facebook,
  Globe2,
  Instagram,
  Linkedin,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Music2,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import {
  buildTenantDemoManagementUrl,
  buildTenantManagementUrl,
} from "@/lib/login-url";
import {
  VenueAddressBlock,
  VenueCopyrightAddress,
  VenueHoursList,
  VenuePhoneDisplay,
  VenueWhatsappLink,
  useVenueContactEmail,
} from "@/components/modules/reservations/venue-display";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useDocaCopy } from "@/lib/doca-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { getTenantLocaleConfig, matchTenantLocale } from "@/lib/tenant-locales";
import { useSettingsStore } from "@/store/settings-store";
import {
  EMPTY_SOCIAL_LINKS,
type SocialLinkKey,
  type SocialLinks,
} from "@/store/settings-store";

const SOCIAL_ITEMS: Array<{
  key: SocialLinkKey;
  label: string;
  icon: ComponentType<{ size?: number }>;
}> = [
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "tiktok", label: "TikTok", icon: Music2 },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "x", label: "X", icon: Twitter },
  { key: "threads", label: "Threads", icon: MessageCircle },
  { key: "tripadvisor", label: "Tripadvisor", icon: Globe2 },
  { key: "google", label: "Google Business", icon: MapPin },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
];

function isTenantHomePath(pathname: string | null, tenantId: string, previewSlug?: string) {
  const parts = (pathname ?? "/").split("/").filter(Boolean);
  if (previewSlug && parts[0] === previewSlug) parts.shift();

  const localeConfig = getTenantLocaleConfig(tenantId);
  if (localeConfig && parts[0] && matchTenantLocale(parts[0], localeConfig.locales)) {
    parts.shift();
  }

  return parts.length === 0;
}

function mailtoHref(email: string, subject: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

function defaultSocialLinks(content: ReturnType<typeof getTenantContent>): SocialLinks {
  return {
    ...EMPTY_SOCIAL_LINKS,
    instagram: content.social.instagram,
    facebook: content.social.facebook,
  };
}

function socialHref(key: SocialLinkKey, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (key === "whatsapp" && !trimmed.startsWith("http")) {
    const digits = trimmed.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : "";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export function Footer() {
  const tenant = useTenant();
  const pathname = usePathname();
  const mode = usePlatformMode();
  const content = getTenantContent(tenant.id);
  const features = useEffectiveFeatures();
  const mainEmail = useVenueContactEmail();
  const workWithUsEnabled = useSettingsStore((state) => state.workWithUsEnabled);
  const workWithUsEmail = useSettingsStore((state) => state.workWithUsEmailOverride.trim());
  const collaborationsEnabled = useSettingsStore((state) => state.collaborationsEnabled);
  const collaborationsEmail = useSettingsStore((state) => state.collaborationsEmailOverride.trim());
  const socialLinks = useSettingsStore((state) => state.socialLinks);
  const socialLinksConfigured = useSettingsStore((state) => state.socialLinksConfigured);
  const isDemo = mode === "preview" || mode === "preview-bizery";
  const isDoca = tenant.id === "doca";
  const hideVenueDetails = isTenantHomePath(pathname, tenant.id, tenant.previewSlug);
  const docaCopy = useDocaCopy();
  const tenantHref = useTenantLocalizedHref();
  const workWithUsRecipient = workWithUsEmail || mainEmail;
  const collaborationsRecipient = collaborationsEmail || mainEmail;
  const effectiveSocialLinks = socialLinksConfigured
    ? { ...EMPTY_SOCIAL_LINKS, ...socialLinks }
    : defaultSocialLinks(content);
  const visibleSocialLinks = SOCIAL_ITEMS.map((item) => ({
    ...item,
    href: socialHref(item.key, effectiveSocialLinks[item.key]),
  })).filter((item) => item.href);
  const footerGridClass = visibleSocialLinks.length > 0
    ? hideVenueDetails
      ? "md:grid-cols-4"
      : "md:grid-cols-5"
    : hideVenueDetails
      ? "md:grid-cols-3"
      : "md:grid-cols-4";
  const staffHref = isDemo
    ? `/${tenant.id}/gestione`
    : buildTenantManagementUrl(tenant.id) ?? buildTenantDemoManagementUrl(tenant.id);

  return (
    <footer className="tenant-site-footer relative mt-16 bg-pork-ink pb-[env(safe-area-inset-bottom)] text-pork-cream">
      <div className={`container-wide grid gap-12 pt-16 pb-8 ${footerGridClass}`}>
        <div className="md:col-span-2">
          <div className="flex items-center gap-4">
            <Image
              src={content.logoSrc}
              alt={content.logoAlt}
              width={72}
              height={72}
              unoptimized
              className="h-16 w-16 object-contain"
            />
            <div className={isDoca ? "doca-footer-logo-stack" : ""}>
              <p className="impact-title text-3xl text-pork-mustard">{isDoca ? "DOCA" : tenant.name}</p>
              <p className={`text-sm text-pork-cream/70 ${isDoca ? "doca-footer-tagline" : ""}`}>
                {isDoca ? docaCopy.footerTagline : content.footer.tagline}
              </p>
            </div>
          </div>
          <p className="mt-6 max-w-md text-pork-cream/70">
            {isDoca ? docaCopy.footerBody : content.footer.body}
          </p>
        </div>

        {visibleSocialLinks.length > 0 && (
          <div>
            <p className="impact-title text-xl text-pork-mustard">SOCIAL</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {visibleSocialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.key}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-pork-cream/20 text-pork-cream transition-colors hover:border-pork-mustard hover:text-pork-mustard"
                    aria-label={`${item.label} ${tenant.name}`}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="impact-title text-xl text-pork-mustard">CONTATTI</p>
          {!hideVenueDetails && (
            <address className="mt-4 flex items-start gap-3 not-italic text-pork-cream/80">
              <MapPin size={18} className="mt-1 shrink-0" />
              <VenueAddressBlock />
            </address>
          )}
          <div className="mt-4 flex items-center gap-3">
            <Phone size={18} className="shrink-0 text-pork-cream/80" />
            <VenuePhoneDisplay className="text-pork-cream/80 transition-colors hover:text-pork-mustard" />
          </div>
          {mainEmail && (
            <div className="mt-3 flex items-center gap-3">
              <Mail size={18} className="shrink-0 text-pork-cream/80" />
              <a
                href={mailtoHref(mainEmail, `Contatto da ${tenant.name}`)}
                className="break-all text-pork-cream/80 transition-colors hover:text-pork-mustard"
              >
                {mainEmail}
              </a>
            </div>
          )}
          {isDoca ? (
            <Link
              href={tenantHref("/prenota")}
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-pork-mustard hover:underline"
            >
              {docaCopy.whatsappFooter}
            </Link>
          ) : (
            <VenueWhatsappLink className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-pork-mustard hover:underline">
              Scrivici su WhatsApp -&gt;
            </VenueWhatsappLink>
          )}
        </div>

        {!hideVenueDetails && (
          <div>
            <p className="impact-title text-xl text-pork-mustard">{isDoca ? docaCopy.footerHours : "Orari"}</p>
            <VenueHoursList variant="footer" />
          </div>
        )}
      </div>

      <div className="border-t border-pork-cream/10">
        <div className="container-wide flex flex-col gap-4 py-6 text-xs text-pork-cream/50 md:flex-row md:items-center md:justify-between">
          <p className="flex flex-wrap items-center gap-2">
            <span>
              © {new Date().getFullYear()} {tenant.name}
              {!hideVenueDetails && <> — <VenueCopyrightAddress /></>}
            </span>
            <a
              href={staffHref}
              className="inline-flex items-center gap-1 text-pork-cream/30 hover:text-pork-mustard"
              aria-label="Area riservata"
            >
              <Lock size={10} /> Staff
            </a>
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {tenant.id === "bepork" && (
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-pork-cream/55">
                {features.modules.onlineMenu && (
                  <Link
                    href="/assistant-menu"
                    className="transition-colors hover:text-pork-mustard hover:underline"
                  >
                    Consigli menu
                  </Link>
                )}
                {features.modules.tableOrders && (
                  <Link
                    href="/tavolo"
                    className="transition-colors hover:text-pork-mustard hover:underline"
                  >
                    Tavolo QR
                  </Link>
                )}
                {features.modules.staffRoles && (
                  <Link
                    href="/staff"
                    className="transition-colors hover:text-pork-mustard hover:underline"
                  >
                    Turni staff
                  </Link>
                )}
                {features.modules.kitchenDisplay && (
                  <Link
                    href="/cucina"
                    className="transition-colors hover:text-pork-mustard hover:underline"
                  >
                    Cucina
                  </Link>
                )}
              </span>
            )}
            <span className="flex flex-wrap gap-x-4 gap-y-1">
              <Link
                href={tenantHref("/privacy")}
                className="text-pork-cream/55 transition-colors hover:text-pork-mustard hover:underline"
              >
                Privacy
              </Link>
              <Link
                href={tenantHref("/cookie")}
                className="text-pork-cream/55 transition-colors hover:text-pork-mustard hover:underline"
              >
                Cookie
              </Link>
              {workWithUsEnabled && workWithUsRecipient && (
                <a
                  href={mailtoHref(workWithUsRecipient, `Lavora con noi - ${tenant.name}`)}
                  className="text-pork-cream/55 transition-colors hover:text-pork-mustard hover:underline"
                >
                  Lavora con noi
                </a>
              )}
              {collaborationsEnabled && collaborationsRecipient && (
                <a
                  href={mailtoHref(collaborationsRecipient, `Proposta di collaborazione - ${tenant.name}`)}
                  className="text-pork-cream/55 transition-colors hover:text-pork-mustard hover:underline"
                >
                  Collaborazioni
                </a>
              )}
            </span>
            <span className="hidden text-pork-cream/25 sm:inline" aria-hidden>
              ·
            </span>
            <span>
              Realizzato da{" "}
              <a
                href="https://pynkstudio.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pork-cream/70 transition-colors hover:text-pork-mustard hover:underline"
              >
                PynkStudio
              </a>
              {" · "}
              <a
                href="https://menuary.it"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pork-cream/70 transition-colors hover:text-pork-mustard hover:underline"
              >
                Powered by Menuary
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
