"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import type { BetaLang } from "@/lib/pynkstudio/beta-shared";

// Bump manuale a ogni revisione sostanziale. Va tenuta allineata a ciò che raccolgono
// il form di iscrizione e le API in src/app/api/pynkstudio/beta.
const COPY = {
  it: {
    eyebrow: "Beta program",
    title: "Informativa privacy",
    updated: "Ultimo aggiornamento: 5 novembre 2026.",
    back: "Torna al beta program",
    sections: [
      {
        title: "Chi tratta i dati",
        body: "PYNK STUDIO (P.IVA 13577530960), Via Gino Severini 1, Milano, è il titolare del trattamento. Contatto: info@pynkstudio.eu.",
      },
      {
        title: "Quali dati",
        body: "Nome, cognome, email, telefono, dispositivi posseduti, lingua; se li indichi, l'Apple ID e l'account Google usati per i test; le preferenze sugli avvisi; le beta a cui partecipi, le richieste di accesso e i feedback che invii, con dispositivo e versione dell'app; la data dell'ultimo accesso.",
      },
      {
        title: "Perché",
        body: "Per gestire la tua partecipazione: mostrarti le beta compatibili, darti accesso ai test, inviarti il link di accesso e gli avvisi che hai scelto, leggere i tuoi feedback e contattarti se serve. La base giuridica è il consenso che dai all'iscrizione (art. 6, par. 1, lett. a GDPR), che puoi revocare in ogni momento.",
      },
      {
        title: "Chi li riceve",
        body: "I fornitori che fanno funzionare il programma: Supabase (database), Vercel (hosting) e Resend (invio email). Se una beta lo richiede, Apple riceve il tuo Apple ID per l'invito TestFlight e Google il tuo account Google per il test su Play o il gruppo dei tester: da quel momento valgono anche le loro informative. Alcuni fornitori possono trattare i dati fuori dallo Spazio economico europeo, con le garanzie previste dal GDPR, come le clausole contrattuali standard.",
      },
      {
        title: "Per quanto tempo",
        body: "Finché mantieni il profilo. Con «Elimina il mio profilo» nell'area beta cancelliamo profilo, richieste, feedback e storico degli avvisi. Gli inviti già accettati su TestFlight o Google Play si gestiscono da quei servizi. Il sito usa un cookie tecnico per tenerti connesso all'area beta e uno per ricordare la lingua; gli altri cookie dipendono dalla tua scelta nel banner.",
      },
      {
        title: "I tuoi diritti",
        body: "Puoi chiedere accesso, rettifica, cancellazione, limitazione e portabilità dei dati, revocare il consenso e spegnere gli avvisi dal link in ogni email. Scrivi a info@pynkstudio.eu. Puoi anche presentare reclamo al Garante per la protezione dei dati personali.",
      },
    ],
  },
  en: {
    eyebrow: "Beta program",
    title: "Privacy notice",
    updated: "Last updated: November 5, 2026.",
    back: "Back to the beta program",
    sections: [
      {
        title: "Who handles your data",
        body: "PYNK STUDIO (VAT no. 13577530960), Via Gino Severini 1, Milan, Italy, is the data controller. Contact: info@pynkstudio.eu.",
      },
      {
        title: "What data",
        body: "Your first and last name, email, phone number, devices and language; if you provide them, the Apple ID and Google account used for testing; your alert preferences; the betas you join, your access requests and the feedback you send, with device and app version; the date you last visited.",
      },
      {
        title: "Why",
        body: "To run your participation: showing you compatible betas, giving you access to tests, sending your login link and the alerts you chose, reading your feedback and contacting you when needed. The legal basis is the consent you give when signing up (Art. 6(1)(a) GDPR), which you can withdraw at any time.",
      },
      {
        title: "Who receives it",
        body: "The providers that run the program: Supabase (database), Vercel (hosting) and Resend (email delivery). When a beta requires it, Apple receives your Apple ID for the TestFlight invite and Google receives your Google account for the Play test or tester group; their own privacy policies then also apply. Some providers may process data outside the European Economic Area, under GDPR safeguards such as Standard Contractual Clauses.",
      },
      {
        title: "How long we keep it",
        body: "For as long as you keep your profile. “Delete my profile” in your beta area erases your profile, requests, feedback and alert history. Invitations you already accepted on TestFlight or Google Play are managed from those services. The site uses one technical cookie to keep you logged in to the beta area and one to remember your language; other cookies depend on your choice in the cookie banner.",
      },
      {
        title: "Your rights",
        body: "You can ask to access, correct, erase, restrict or port your data, withdraw your consent, and turn off alerts from the link in every email. Write to info@pynkstudio.eu. You can also lodge a complaint with a data protection authority; in Italy, the Garante per la protezione dei dati personali.",
      },
    ],
  },
} as const;

function Inner({ lang }: { lang: BetaLang }) {
  const c = COPY[lang];
  const href = useTenantLocalizedHref();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <div className="pynk-page">
      <section className="pynk-hero pynk-hero-sub pynk-hero-compact">
        <div className="pynk-glow pynk-glow-tl" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <p className="pynk-eyebrow">{c.eyebrow}</p>
          <h1 className="pynk-hero-title">{c.title}</h1>
          <p className="pynk-hero-subtitle">{c.updated}</p>
        </div>
      </section>
      <section className="pynk-section">
        <div className="pynk-container">
          {c.sections.map((s) => (
            <div key={s.title} className="pynk-mt-24">
              <h2 className="pynk-section-title pynk-section-title-left">{s.title}</h2>
              <p className="pynk-panel-desc">{s.body}</p>
            </div>
          ))}
          <div className="pynk-hero-ctas pynk-mt-24">
            <Link href={href(lang === "en" ? "/beta/en" : "/beta")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              {c.back}
              <ArrowRight className="pynk-icon-xs" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PynkBetaPrivacyPage({ lang }: { lang: BetaLang }) {
  return (
    <PynkShell lang={lang}>
      <Inner lang={lang} />
    </PynkShell>
  );
}
