"use client";

import { usePathname, useRouter } from "next/navigation";
import { docaI18n } from "@/lib/doca-i18n";
import { TenantLanguagePicker } from "@/components/tenants/_shared/tenant-language-picker";
import { replaceTenantLocaleInPath } from "@/lib/tenant-localized-path";

export function DocaLanguageSelector() {
  const language = docaI18n.useLanguage();
  const text = docaI18n.useCopy();
  const pathname = usePathname() ?? "/doca/it";
  const router = useRouter();

  const changeLanguage = (nextLanguage: typeof language) => {
    docaI18n.setLanguage(nextLanguage);
    router.push(
      replaceTenantLocaleInPath({
        locale: nextLanguage,
        pathname,
        previewSlug: pathname.startsWith("/doca") ? "doca" : undefined,
      }),
    );
  };

  return (
    <TenantLanguagePicker
      ariaLabel={text.languageLabel}
      className="doca-language-selector"
      language={language}
      languages={docaI18n.languages}
      onChange={changeLanguage}
    />
  );
}
