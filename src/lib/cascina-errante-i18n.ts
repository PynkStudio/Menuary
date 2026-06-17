import { createTenantI18n } from "@/lib/tenant-i18n";

const translations = {
  it: {
    languageLabel: "Lingua",
  },
};

export const cascinaErranteI18n = createTenantI18n({
  tenantId: "cascina-errante",
  previewSlug: "cascina-errante",
  defaultLanguage: "it",
  translations,
});

export const setCascinaErranteLanguage = cascinaErranteI18n.setLanguage;
export const useCascinaErranteCopy = cascinaErranteI18n.useCopy;
export const useCascinaErranteLanguage = cascinaErranteI18n.useLanguage;
