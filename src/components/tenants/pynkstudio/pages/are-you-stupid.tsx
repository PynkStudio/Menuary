"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Apple, ArrowRight, Check, ExternalLink, Mail, MessageCircle, Mic2, ShieldCheck, Smartphone, Tv } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, faqSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

// Mac già sul Mac App Store; iPhone/iPad/Apple TV restano su TestFlight finché non escono, Google Play in arrivo.
const MAC_APP_STORE_URL = "https://apps.apple.com/it/app/are-you-stupid-party-game/id6809188487?mt=12";
const TESTFLIGHT_URL = "https://testflight.apple.com/join/G8kQkCdt";

const pillars = [
  { title: "Tutti insieme, nello stesso istante", body: "Da 2 a 16 giocatori ricevono la stessa istruzione nello stesso momento. Sulla TV si vede chi ha sbagliato. Subito. Le prime 8 postazioni sono incluse." },
  { title: "Sotto le 8 parole", body: "Ogni istruzione sta in una riga, in maiuscolo. Facilissima. Ed è proprio per questo che qualcuno la sbaglierà." },
  { title: "Il telefono è il controller", body: "Niente gamepad, niente app da configurare: inquadri il QR sulla TV e sei dentro. iPhone e Android nella stessa partita." },
  { title: "Zero tempi morti", body: "Un round dura pochi secondi, lo sfottò per chi sbaglia arriva in diretta e si riparte. Nessun caricamento, nessuna attesa." },
  { title: "L'AI inventa le sfide", body: "Con un iPhone compatibile con Apple Intelligence nella stanza, il gioco crea sfide nuove al volo. Tutto sul dispositivo, niente cloud." },
  { title: "E quando sei da solo", body: "La modalità singolo è sempre lì: offline, a una mano, livello dopo livello finché non sbagli. Funziona anche in modalità aereo." },
];

const waysToPlay = [
  {
    icon: Tv,
    status: "Party mode · disponibile",
    title: "Il salotto diventa un game show",
    body: "Apple TV o Mac fanno da tabellone; iPhone e Android diventano controller. Da 2 a 16 persone giocano gli stessi round sulla rete Wi-Fi locale, senza account né matchmaking online.",
  },
  {
    icon: MessageCircle,
    status: "iMessage · disponibile",
    title: "Stupid Streak, uno contro uno",
    body: "Una sfida asincrona best-of-three dentro Messaggi. I due giocatori affrontano la stessa sequenza deterministica: vince il filotto più lungo. Nessun server e nessun avversario deve essere online nello stesso momento.",
  },
  {
    icon: Mic2,
    status: "Presentatore IA · in sviluppo",
    title: "Una voce che ricorda tutto. Purtroppo.",
    body: "Un presentatore vocale opzionale reagirà a risultati reali, nomi pronunciabili, rivalità e rimonte. Non giudica mai la partita e non rallenta i round: se internet o la voce mancano, il gioco continua con le battute incluse.",
  },
];

const steps = [
  { title: "Accendi la TV", body: "Apri Are You Stupid?! su Apple TV, oppure sul Mac e mandalo sulla TV con AirPlay. Sullo schermo compare la stanza con il suo QR." },
  { title: "Entrate dal telefono", body: "Ognuno inquadra il QR (o digita il codice della stanza), sceglie un nome e un'emoji. Basta essere sulla stessa rete Wi-Fi." },
  { title: "Scegliete la modalità", body: "Last Stupid Standing: chi sbaglia è fuori, vince l'ultimo rimasto. Stupid Battle: tutti giocano fino alla fine, vince chi fa più punti." },
  { title: "Non sbagliate", body: "Un'istruzione stupidissima, uguale per tutti, pochi secondi per eseguirla. Sulla TV, davanti a tutti, la classifica di chi non ce l'ha fatta." },
];

const faq = [
  {
    q: "Cosa serve per giocare in gruppo?",
    a: "Un'Apple TV, oppure un Mac collegato alla TV con AirPlay, che fa da tabellone. Poi un telefono a testa, iPhone o Android, tutti sulla stessa rete Wi-Fi. Da 2 a 8 giocatori inclusi, fino a 16 con Party Pack.",
  },
  {
    q: "Posso già provarlo?",
    a: "Sì. La versione Mac si scarica dal Mac App Store; su iPhone è in beta pubblica su TestFlight. I link per iPhone, iPad, Apple TV e Android arrivano a breve.",
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
    q: "Cos'è Stupid Streak per iMessage?",
    a: "È una modalità asincrona 1 contro 1, best-of-three, dentro Messaggi. Giochi il tuo round e invii la sfida; l'altra persona affronta la stessa sequenza quando vuole. Entrambi giocate la stessa sfida e vince chi costruisce il filotto più lungo.",
  },
  {
    q: "Il presentatore IA è la stessa cosa dell'AI Director?",
    a: "No. L'AI Director usa Apple Intelligence sul dispositivo per creare sfide e commenti testuali. Il presentatore vocale è uno strato opzionale, ancora in sviluppo, che usa internet per dare voce alle battute; non controlla regole, punteggi o tempi e ha sempre un fallback locale.",
  },
  {
    q: "Are You Stupid?! raccoglie dati personali?",
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
      name: "Are You Stupid?!",
      applicationCategory: "GameApplication",
      applicationSubCategory: "Party game",
      operatingSystem: "iOS, iPadOS, tvOS, macOS, Android",
      description:
        "Il party game da 2 a 16 giocatori: sfide simultanee su Apple TV o Mac, telefoni come controller, modalità offline in singolo e Stupid Streak 1v1 per iMessage.",
      author: { "@type": "Organization", name: "PYNK STUDIO" },
      publisher: { "@type": "Organization", name: "PYNK STUDIO" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      downloadUrl: MAC_APP_STORE_URL,
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Lavori", path: "/lavori" },
      { name: "Are You Stupid?!", path: "/lavori/are-you-stupid" },
    ]),
    faqSchema(faq),
  ];

  return (
    <div className="pynk-page pynk-ays-page">
      <PynkJsonLd data={jsonLd} />

      <section className="pynk-ays-hero">
        <div className="pynk-container pynk-ays-hero-grid">
          <div className="pynk-ays-hero-copy">
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pynk-ays-title">
              ARE YOU{" "}<br /><span>STUPID?!</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="pynk-ays-tagline">
              Un&apos;istruzione. Pochi secondi. Tutti guardano.
            </motion.p>
            <p className="pynk-ays-intro">
              Il party game da 2 a 16 giocatori dove il telefono è il controller e la TV mostra a tutti chi ha sbagliato. Sembra facile. Non lo è.
            </p>
            <p className="pynk-ays-age-note">
              <em>&laquo;One job. Don&apos;t fuck it up.&raquo;</em> Linguaggio scorretto usato di proposito. <a href="#contenuto-eta">Contenuto ed età</a>
            </p>
          </div>

          <motion.div initial={{ opacity: 0, rotate: 2, scale: 0.96 }} animate={{ opacity: 1, rotate: -1, scale: 1 }} transition={{ delay: 0.18, duration: 0.55 }} className="pynk-ays-game-screen" aria-label="Esempio di una sfida del gioco">
            <div className="pynk-ays-screen-top"><span>ROUND 07</span><span>00:04</span></div>
            <div className="pynk-ays-command">NON TOCCARE<br />IL ROSSO</div>
            <div className="pynk-ays-controls" aria-hidden="true"><span /><span /><span /><span /></div>
            <div className="pynk-ays-screen-result"><strong>3</strong> persone hanno già sbagliato.</div>
          </motion.div>
        </div>

        <div className="pynk-container pynk-ays-downloads" aria-label="Download del gioco">
          <a href={MAC_APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="pynk-ays-download-card pynk-ays-download-card-live">
            <Apple aria-hidden="true" /><span><small>Scarica ora</small><strong>Mac</strong></span><ExternalLink aria-hidden="true" />
          </a>
          <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className="pynk-ays-download-card">
            <Smartphone aria-hidden="true" /><span><small>Beta testing</small><strong>iPhone</strong></span><ExternalLink aria-hidden="true" />
          </a>
          <div className="pynk-ays-download-card pynk-ays-download-card-soon" aria-label="Android, in arrivo">
            <Smartphone aria-hidden="true" /><span><small>In arrivo</small><strong>Android</strong></span>
          </div>
        </div>
        <div className="pynk-container pynk-ays-hero-links">
          <Link href={href("/lavori/are-you-stupid/privacy")}><ShieldCheck aria-hidden="true" /> Privacy Policy</Link>
          <Link href={href("/lavori/are-you-stupid/en")}>Read in English <ArrowRight aria-hidden="true" /></Link>
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

      <section className="pynk-section pynk-section-alt" aria-labelledby="tre-modi-di-sbagliare">
        <div className="pynk-container">
          <div className="pynk-section-head">
            <p className="pynk-eyebrow">Da solo, insieme o a distanza</p>
            <h2 id="tre-modi-di-sbagliare" className="pynk-section-title">
              Ora ci sono più modi di fare una figuraccia
            </h2>
            <p className="pynk-section-lead">
              Il multiplayer live, il duello asincrono in iMessage e il presentatore vocale sono esperienze distinte. Ecco cosa è già
              giocabile e cosa stiamo ancora preparando.
            </p>
          </div>
          <div className="pynk-grid-2">
            {waysToPlay.map((mode) => {
              const Icon = mode.icon;
              return (
                <article key={mode.title} className="pynk-panel">
                  <Icon className="pynk-icon-sm" aria-hidden="true" />
                  <p className="pynk-eyebrow pynk-mt-12">{mode.status}</p>
                  <h3 className="pynk-panel-title">{mode.title}</h3>
                  <p className="pynk-panel-desc">{mode.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="come-si-gioca">
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
