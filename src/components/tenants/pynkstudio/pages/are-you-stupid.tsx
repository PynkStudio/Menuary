"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, ExternalLink, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, faqSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

// Beta pubblica iOS — sostituire/aggiungere il link Google Play quando aperta la chiusa/aperta beta Android.
const TESTFLIGHT_URL = "https://testflight.apple.com/join/G8kQkCdt";

const pillars = [
  { title: "Tutti insieme, nello stesso istante", body: "Da 2 a 8 giocatori ricevono la stessa istruzione nello stesso momento. Sulla TV si vede chi ha sbagliato. Subito." },
  { title: "Sotto le 8 parole", body: "Ogni istruzione sta in una riga, in maiuscolo. Facilissima. Ed è proprio per questo che qualcuno la sbaglierà." },
  { title: "Il telefono è il controller", body: "Niente gamepad, niente app da configurare: inquadri il QR sulla TV e sei dentro. iPhone e Android nella stessa partita." },
  { title: "Zero tempi morti", body: "Un round dura pochi secondi, lo sfottò per chi sbaglia arriva in diretta e si riparte. Nessun caricamento, nessuna attesa." },
  { title: "L'AI inventa le sfide", body: "Con un iPhone compatibile con Apple Intelligence nella stanza, il gioco crea sfide nuove al volo. Tutto sul dispositivo, niente cloud." },
  { title: "E quando sei da solo", body: "La modalità singolo è sempre lì: offline, a una mano, livello dopo livello finché non sbagli. Funziona anche in modalità aereo." },
];

const steps = [
  { title: "Accendi la TV", body: "Apri Are You Stupid? su Apple TV, oppure sul Mac e mandalo sulla TV con AirPlay. Sullo schermo compare la stanza con il suo QR." },
  { title: "Entrate dal telefono", body: "Ognuno inquadra il QR (o digita il codice della stanza), sceglie un nome e un'emoji. Basta essere sulla stessa rete Wi-Fi." },
  { title: "Scegliete la modalità", body: "Last Stupid Standing: chi sbaglia è fuori, vince l'ultimo rimasto. Stupid Battle: tutti giocano fino alla fine, vince chi fa più punti." },
  { title: "Non sbagliate", body: "Un'istruzione stupidissima, uguale per tutti, pochi secondi per eseguirla. Sulla TV, davanti a tutti, la classifica di chi non ce l'ha fatta." },
];

const faq = [
  {
    q: "Cosa serve per giocare in gruppo?",
    a: "Un'Apple TV, oppure un Mac collegato alla TV con AirPlay, che fa da tabellone. Poi un telefono a testa, iPhone o Android, tutti sulla stessa rete Wi-Fi. Da 2 a 8 giocatori.",
  },
  {
    q: "Posso già provarlo?",
    a: "Sì, è in beta pubblica su TestFlight per iOS. Il lancio su App Store (iPhone, iPad, Apple TV e Mac) e Google Play arriva a breve.",
  },
  {
    q: "Si può giocare anche da soli?",
    a: "Sì. La modalità singolo è completamente offline: livelli sempre più veloci, finché non sbagli per un dettaglio stupido.",
  },
  {
    q: "Serve una connessione a internet?",
    a: "No. Il gioco in singolo funziona anche in modalità aereo, e il party mode passa solo sulla rete Wi-Fi di casa. Solo gli annunci pubblicitari facoltativi richiedono internet.",
  },
  {
    q: "Cos'è la modalità AI?",
    a: "Sugli iPhone e iPad compatibili con Apple Intelligence, il gioco usa il modello di Apple direttamente sul dispositivo per inventare sfide nuove. Niente viene inviato a server esterni, e si può spegnere dalle impostazioni. In una partita di gruppo basta un iPhone compatibile: anche chi gioca da Android riceve le sfide AI.",
  },
  {
    q: "Are You Stupid? raccoglie dati personali?",
    a: "Non abbiamo account, backend o strumenti di analisi. L'unico trattamento dati è quello del nostro partner pubblicitario, Google AdMob, e solo dopo il consenso dove la legge lo richiede. Tutti i dettagli nella privacy policy.",
  },
  {
    q: "È adatto ai bambini?",
    a: "No. Il gioco usa un linguaggio scorretto e un umorismo greve come parte del tono comico: non è pensato per un pubblico infantile e non rientra nella categoria Kids di Apple né nel programma Play Families di Google.",
  },
  {
    q: "Come faccio a contattarvi per supporto o domande sui dati?",
    a: "Scrivi a info@pynkstudio.eu oppure usa il modulo contatti del sito: rispondiamo da lì per qualsiasi richiesta legata al gioco.",
  },
];

function AreYouStupidInner() {
  const href = useTenantLocalizedHref();

  const jsonLd = [
    organizationSchema(),
    {
      "@context": "https://schema.org",
      "@type": "MobileApplication",
      name: "Are You Stupid?",
      applicationCategory: "GameApplication",
      applicationSubCategory: "Party game",
      operatingSystem: "iOS, iPadOS, tvOS, macOS, Android",
      description:
        "Il party game da 2 a 8 giocatori: un'istruzione stupidamente semplice, uguale per tutti nello stesso istante, sulla TV la classifica di chi sbaglia. Il telefono è il controller. Anche in singolo, offline.",
      author: { "@type": "Organization", name: "PYNK STUDIO" },
      publisher: { "@type": "Organization", name: "PYNK STUDIO" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Lavori", path: "/lavori" },
      { name: "Are You Stupid?", path: "/lavori/are-you-stupid" },
    ]),
    faqSchema(faq),
  ];

  return (
    <div className="pynk-page">
      <PynkJsonLd data={jsonLd} />

      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-tr" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <p className="pynk-eyebrow pynk-eyebrow-chip">Party game · Apple TV, Mac, iPhone &amp; Android · In beta su TestFlight</p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pynk-hero-title">
            ARE YOU <span className="pynk-accent">STUPID?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="pynk-hero-subtitle"
          >
            Il party game dove tutti ricevono la stessa istruzione stupidissima nello stesso istante, e la TV mostra a tutti chi
            l&apos;ha sbagliata. Il telefono è il controller, da 2 a 8 giocatori. Sembra facile. Non lo è.
          </motion.p>
          <p className="pynk-note pynk-mt-24">
            Dal gioco: <em>&laquo;One job. Don&apos;t fuck it up.&raquo;</em> — linguaggio scorretto usato di proposito, vedi{" "}
            <a href="#contenuto-eta">Contenuto ed età</a> qui sotto.
          </p>
          <p className="pynk-note pynk-mt-12">In beta pubblica su TestFlight (iOS) — App Store (iPhone, iPad, Apple TV, Mac) e Google Play in arrivo.</p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="pynk-hero-ctas pynk-mt-24">
            <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className="pynk-btn pynk-btn-primary pynk-btn-lg">
              Prova su TestFlight
              <ExternalLink className="pynk-icon-xs" />
            </a>
            <Link href={href("/lavori/are-you-stupid/privacy")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              <ShieldCheck className="pynk-icon-xs" />
              Privacy Policy
            </Link>
          </motion.div>
          <p className="pynk-note pynk-mt-24">
            <Link href={href("/lavori/are-you-stupid/en")}>Read this page in English →</Link>
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="il-gioco-in-breve">
        <div className="pynk-container">
          <div className="pynk-section-head">
            <h2 id="il-gioco-in-breve" className="pynk-section-title">
              Il gioco in breve
            </h2>
            <p className="pynk-section-lead">
              Un&apos;istruzione stupidamente semplice, e qualcuno fallisce su qualcosa di stupido. Davanti a tutti. La reazione che
              cerchiamo non è &laquo;questo gioco fa schifo&raquo;, è la stanza che urla &laquo;ma come hai fatto?&raquo;.
            </p>
          </div>
          <div className="pynk-grid-2">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="pynk-panel">
                <h3 className="pynk-panel-title">{pillar.title}</h3>
                <p className="pynk-panel-desc">{pillar.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="come-si-gioca">
        <div className="pynk-container">
          <div className="pynk-section-head">
            <h2 id="come-si-gioca" className="pynk-section-title">
              Come si gioca in compagnia
            </h2>
            <p className="pynk-section-lead">Un minuto dal divano alla prima eliminazione.</p>
          </div>
          <div className="pynk-steps">
            {steps.map((step, index) => (
              <article key={step.title} className="pynk-step">
                <span className="pynk-step-number">{index + 1}</span>
                <div>
                  <h3 className="pynk-step-title pynk-step-title-lg">{step.title}</h3>
                  <p className="pynk-step-desc">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="anteprima">
        <div className="pynk-container pynk-center-col">
          <h2 id="anteprima" className="pynk-section-title">
            Anteprima
          </h2>
          <div className="pynk-panel">
            <Sparkles className="pynk-icon-sm" />
            <p className="pynk-panel-desc">
              Screenshot e video di una partita vera, con la TV e i telefoni, arrivano insieme all&apos;uscita sugli store. Questa scheda intanto ospita
              già tutto il necessario per il controllo di pubblicazione: descrizione, privacy policy e contatti di supporto.
            </p>
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" id="contenuto-eta" aria-labelledby="contenuto-eta-title">
        <div className="pynk-container pynk-ai-split">
          <div>
            <p className="pynk-eyebrow">Trasparenza</p>
            <h2 id="contenuto-eta-title" className="pynk-section-title pynk-section-title-left">
              Contenuto ed età
            </h2>
            <p className="pynk-panel-desc">
              Il gioco usa un linguaggio scorretto e un umorismo greve (parolacce, sfottò) come parte del tono comico. Non è pensato
              per un pubblico infantile: non rientra nella categoria Kids di Apple né nel programma Play Families di Google. La
              fascia d&apos;età definitiva viene assegnata dal questionario di ciascuno store al momento della pubblicazione.
            </p>
          </div>
          <div className="pynk-panel">
            <h3 className="pynk-panel-title">Dati e privacy, in breve</h3>
            <ul className="pynk-check-list pynk-mt-24">
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>Nessun account, nessuna registrazione.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>Nessun backend nostro e nessuno strumento di analisi.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>Il party mode passa solo sulla tua rete Wi-Fi: niente esce di casa.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>L&apos;AI gira sul dispositivo, senza cloud.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>
                  Gli unici dati che escono dal telefono sono quelli del nostro partner pubblicitario, Google AdMob, con il tuo consenso
                  dove la legge lo richiede.
                </span>
              </li>
            </ul>
            <Link href={href("/lavori/are-you-stupid/privacy")} className="pynk-btn pynk-btn-outline pynk-mt-24">
              Leggi l&apos;informativa completa
              <ArrowRight className="pynk-icon-xs" />
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="supporto">
        <div className="pynk-container pynk-center-col">
          <h2 id="supporto" className="pynk-section-title">
            Supporto
          </h2>
          <p className="pynk-section-lead">
            Per domande, segnalazioni o richieste sui tuoi dati, scrivici. Rispondiamo da qui a tutte le richieste legate al gioco.
          </p>
          <div className="pynk-hero-ctas pynk-mt-24">
            <a href="mailto:info@pynkstudio.eu" className="pynk-btn pynk-btn-primary pynk-btn-lg">
              <Mail className="pynk-icon-xs" />
              info@pynkstudio.eu
            </a>
            <Link href={href("/contattaci")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              Modulo di contatto
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="faq-are-you-stupid">
        <div className="pynk-container">
          <h2 id="faq-are-you-stupid" className="pynk-section-title">
            Domande frequenti
          </h2>
          <div className="pynk-ai-faq-list">
            {faq.map((item) => (
              <article key={item.q} className="pynk-panel pynk-panel-sm">
                <h3 className="pynk-panel-title-sm">{item.q}</h3>
                <p className="pynk-panel-desc">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pynk-section">
        <div className="pynk-container pynk-center-col">
          <h2 className="pynk-section-title">Altri lavori</h2>
          <p className="pynk-section-lead">Dal gestionale al sito vetrina, dal coordinamento sul territorio al gioco per telefono.</p>
          <Link href={href("/lavori")} className="pynk-btn pynk-btn-outline pynk-btn-lg pynk-mt-24">
            Torna a Lavori
          </Link>
        </div>
      </section>
    </div>
  );
}

export function PynkAreYouStupidPage() {
  return (
    <PynkShell>
      <AreYouStupidInner />
    </PynkShell>
  );
}
