import type { Metadata } from "next";
import { PYNK_ORIGIN } from "../ai-governance-data";
import { pynkMetadata } from "../pynk-seo";
import type { BetaLang } from "@/lib/pynkstudio/beta-shared";

const COPY = {
  it: {
    title: "Beta program — prova le app di PYNK STUDIO in anteprima",
    description:
      "Iscriviti al beta program di PYNK STUDIO: scegli i tuoi dispositivi (iPhone, iPad, Mac, Apple TV, Android e altri) e unisciti alle beta su TestFlight, Google Play e web. Avvisi via email sulle nuove beta.",
    path: "/beta",
  },
  en: {
    title: "Beta program — try PYNK STUDIO apps early",
    description:
      "Join the PYNK STUDIO beta program: choose your devices (iPhone, iPad, Mac, Apple TV, Android and more) and join betas on TestFlight, Google Play and the web. Email alerts for new betas.",
    path: "/beta/en",
  },
} as const;

/** Il sito è sotto /it anche per la variante inglese: stesso schema di /lavori/are-you-stupid/en. */
export function betaMetadata(lang: BetaLang): Metadata {
  const base = pynkMetadata(COPY[lang]);
  return {
    ...base,
    alternates: {
      ...base.alternates,
      languages: {
        "it-IT": `${PYNK_ORIGIN}/it/beta`,
        en: `${PYNK_ORIGIN}/it/beta/en`,
        "x-default": `${PYNK_ORIGIN}/it/beta`,
      },
    },
    openGraph: { ...base.openGraph, locale: lang === "en" ? "en_GB" : "it_IT" },
  };
}
