"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Apple, ArrowRight, Check, ExternalLink, Mail, MessageCircle, Mic2, ShieldCheck, Smartphone, Tv } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, faqSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

// Public iOS beta — add/replace the Google Play link once that beta opens.
const MAC_APP_STORE_URL = "https://apps.apple.com/app/are-you-stupid-party-game/id6809188487?mt=12";
const TESTFLIGHT_URL = "https://testflight.apple.com/join/G8kQkCdt";

const pillars = [
  { title: "Everyone, at the same instant", body: "2 to 16 players get the same instruction at the same moment. The TV shows who blew it. Immediately. The first 8 seats are included." },
  { title: "Under 8 words", body: "Every instruction fits on one line, in caps. Dead easy. Which is exactly why somebody will get it wrong." },
  { title: "Your phone is the controller", body: "No gamepads, nothing to set up: scan the QR on the TV and you're in. iPhone and Android in the same game." },
  { title: "Zero downtime", body: "A round lasts a few seconds, the roast for whoever failed lands live, and off you go again. No loading, no waiting." },
  { title: "The AI invents the challenges", body: "With an Apple Intelligence iPhone in the room, the game creates fresh challenges on the fly. All on-device, no cloud." },
  { title: "And when you're alone", body: "Single-player is always there: offline, one-handed, level after level until you slip. Works in airplane mode too." },
];

const waysToPlay = [
  {
    icon: Tv,
    status: "Party mode · available",
    title: "Turn the living room into a game show",
    body: "Apple TV or Mac runs the board; iPhone and Android become controllers. 2 to 16 people play the same rounds over the local Wi-Fi network, with no accounts or online matchmaking.",
  },
  {
    icon: MessageCircle,
    status: "iMessage · available",
    title: "Stupid Streak, one on one",
    body: "An asynchronous best-of-three inside Messages. Both players face the same deterministic sequence; the longest streak wins. No server, and your opponent does not need to be online at the same time.",
  },
  {
    icon: Mic2,
    status: "AI Presenter · in development",
    title: "A voice that remembers everything. Sadly.",
    body: "An optional voice presenter will react to real results, pronounceable names, rivalries and comebacks. It never judges the game or delays a round: if voice or internet is unavailable, play continues with built-in lines.",
  },
];

const steps = [
  { title: "Turn on the TV", body: "Open Are You Stupid?! on Apple TV, or on a Mac and send it to the TV with AirPlay. The room and its QR code appear on screen." },
  { title: "Join from your phone", body: "Everyone scans the QR (or types the room code), picks a name and an emoji. Just be on the same Wi-Fi network." },
  { title: "Pick a mode", body: "Last Stupid Standing: fail and you're out, last one left wins. Stupid Battle: everyone plays to the end, most points wins." },
  { title: "Don't screw it up", body: "One ridiculously simple instruction, the same for everyone, a few seconds to do it. On the TV, in front of everyone: who didn't make it." },
];

const faq = [
  {
    q: "What do I need to play as a group?",
    a: "An Apple TV, or a Mac mirrored to the TV with AirPlay, as the game board. Then one phone each, iPhone or Android, all on the same Wi-Fi network. 2 to 8 players are included, or up to 16 with Party Pack.",
  },
  {
    q: "Can I try it already?",
    a: "Yes. The Mac version is on the Mac App Store; on iPhone it's in public beta on TestFlight. Links for iPhone, iPad, Apple TV and Android are coming soon.",
  },
  {
    q: "Can I play alone?",
    a: "Yes. Single-player is fully offline: faster and faster levels, until you fail over something stupid.",
  },
  {
    q: "Do I need an internet connection?",
    a: "No. Single-player works in airplane mode, and party mode only uses your home Wi-Fi. Only the optional ads need the internet.",
  },
  {
    q: "What is AI mode?",
    a: "On iPhones and iPads that support Apple Intelligence, the game uses Apple's model right on the device to invent new challenges. Nothing is sent to outside servers, and you can switch it off in Settings. In a group game one compatible iPhone is enough: Android players get the AI challenges too.",
  },
  {
    q: "What is Stupid Streak for iMessage?",
    a: "It is an asynchronous one-on-one best-of-three inside Messages. Play your round and send the challenge; the other person faces the same sequence whenever they want. You both play the same challenge, and the longest streak wins.",
  },
  {
    q: "Is the AI Presenter the same thing as the AI Director?",
    a: "No. The AI Director uses Apple Intelligence on-device to create challenges and text commentary. The voice presenter is a separate optional layer, still in development, that uses the internet to speak its lines; it never controls rules, scores or timing and always has a local fallback.",
  },
  {
    q: "Does Are You Stupid?! collect personal data?",
    a: "We have no account, no backend and no analytics tools. The only data processing is done by our advertising partner, Google AdMob, and only after consent where the law requires it. Full details in the privacy policy.",
  },
  {
    q: "Is it suitable for kids?",
    a: "No. The game uses crude language and rude humor as part of its comedic tone: it isn't aimed at a young audience, and it isn't listed in Apple's Kids Category or Google Play's Families program.",
  },
  {
    q: "How do I contact you for support or a question about my data?",
    a: "Email info@pynkstudio.eu, or use the contact form on our site (in Italian) — either way we answer every request about the game from there.",
  },
];

function AreYouStupidEnInner() {
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
        "The 2-to-16-player party game: simultaneous challenges on Apple TV or Mac, phones as controllers, offline single-player and Stupid Streak one-on-one in iMessage.",
      author: { "@type": "Organization", name: "PYNK STUDIO" },
      publisher: { "@type": "Organization", name: "PYNK STUDIO" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      downloadUrl: MAC_APP_STORE_URL,
      inLanguage: "en",
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Lavori", path: "/lavori" },
      { name: "Are You Stupid?! (English)", path: "/lavori/are-you-stupid/en" },
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
              One instruction. A few seconds. Everyone is watching.
            </motion.p>
            <p className="pynk-ays-intro">
              The 2-to-16-player party game where your phone is the controller and the TV shows the whole room who got it wrong. Looks easy. It isn&apos;t.
            </p>
            <p className="pynk-ays-age-note">
              <em>&laquo;One job. Don&apos;t fuck it up.&raquo;</em> Crude language used on purpose. <a href="#content-age">Content &amp; age</a>
            </p>
          </div>

          <motion.div initial={{ opacity: 0, rotate: 2, scale: 0.96 }} animate={{ opacity: 1, rotate: -1, scale: 1 }} transition={{ delay: 0.18, duration: 0.55 }} className="pynk-ays-game-screen" aria-label="Example challenge from the game">
            <div className="pynk-ays-screen-top"><span>ROUND 07</span><span>00:04</span></div>
            <div className="pynk-ays-command">DON&apos;T TOUCH<br />THE RED ONE</div>
            <div className="pynk-ays-controls" aria-hidden="true"><span /><span /><span /><span /></div>
            <div className="pynk-ays-screen-result"><strong>3</strong> people already got it wrong.</div>
          </motion.div>
        </div>

        <div className="pynk-container pynk-ays-downloads" aria-label="Download the game">
          <a href={MAC_APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="pynk-ays-download-card pynk-ays-download-card-live">
            <Apple aria-hidden="true" /><span><small>Download now</small><strong>Mac</strong></span><ExternalLink aria-hidden="true" />
          </a>
          <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className="pynk-ays-download-card">
            <Smartphone aria-hidden="true" /><span><small>Beta testing</small><strong>iPhone</strong></span><ExternalLink aria-hidden="true" />
          </a>
          <div className="pynk-ays-download-card pynk-ays-download-card-soon" aria-label="Android, coming soon">
            <Smartphone aria-hidden="true" /><span><small>Coming soon</small><strong>Android</strong></span>
          </div>
        </div>
        <div className="pynk-container pynk-ays-hero-links">
          <Link href={href("/lavori/are-you-stupid/privacy")}><ShieldCheck aria-hidden="true" /> Privacy Policy</Link>
          <Link href={href("/lavori/are-you-stupid")}>Leggi in italiano <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="the-game-in-short">
        <div className="pynk-container">
          <div className="pynk-section-head">
            <h2 id="the-game-in-short" className="pynk-section-title">
              The game in short
            </h2>
            <p className="pynk-section-lead">
              A stupidly simple instruction, and somebody fails at something stupid. In front of everyone. The reaction we&apos;re
              after isn&apos;t &laquo;this game sucks&raquo;, it&apos;s the whole room yelling &laquo;how did you even do that?&raquo;.
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

      <section className="pynk-section pynk-section-alt" aria-labelledby="three-ways-to-fail">
        <div className="pynk-container">
          <div className="pynk-section-head">
            <p className="pynk-eyebrow">Solo, together, or from afar</p>
            <h2 id="three-ways-to-fail" className="pynk-section-title">
              More ways to embarrass yourself
            </h2>
            <p className="pynk-section-lead">
              Live multiplayer, the asynchronous iMessage duel and the voice presenter are separate experiences. Here is what you
              can play now and what we are still preparing.
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

      <section className="pynk-section" aria-labelledby="how-to-play">
        <div className="pynk-container">
          <div className="pynk-section-head">
            <h2 id="how-to-play" className="pynk-section-title">
              How a party game works
            </h2>
            <p className="pynk-section-lead">One minute from the couch to the first elimination.</p>
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

      <section className="pynk-section pynk-section-alt" id="content-age" aria-labelledby="content-age-title">
        <div className="pynk-container pynk-ai-split">
          <div>
            <p className="pynk-eyebrow">Transparency</p>
            <h2 id="content-age-title" className="pynk-section-title pynk-section-title-left">
              Content &amp; age
            </h2>
            <p className="pynk-panel-desc">
              The game uses crude language and rude humor (swearing, roasts) as part of its comedic tone. It isn&apos;t aimed at
              children: it isn&apos;t listed in Apple&apos;s Kids Category or Google Play&apos;s Families program. The final age
              rating is assigned by each store&apos;s own questionnaire at publishing time.
            </p>
          </div>
          <div className="pynk-panel">
            <h3 className="pynk-panel-title">Data &amp; privacy, in short</h3>
            <ul className="pynk-check-list pynk-mt-24">
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>No account, no sign-up.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>No backend of our own, and no analytics tools.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>Party mode only travels over your own Wi-Fi: nothing leaves the house.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>The AI runs on your device, no cloud.</span>
              </li>
              <li>
                <Check className="pynk-icon-sm pynk-check" />
                <span>
                  The only data that leaves your phone is what our advertising partner, Google AdMob, collects — with your consent
                  where the law requires it.
                </span>
              </li>
            </ul>
            <Link href={href("/lavori/are-you-stupid/privacy")} className="pynk-btn pynk-btn-outline pynk-mt-24">
              Read the full policy
              <ArrowRight className="pynk-icon-xs" />
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="support">
        <div className="pynk-container pynk-center-col">
          <h2 id="support" className="pynk-section-title">
            Support
          </h2>
          <p className="pynk-section-lead">
            Questions, bug reports, or requests about your data — get in touch. We answer everything about the game from here.
          </p>
          <div className="pynk-hero-ctas pynk-mt-24">
            <a href="mailto:info@pynkstudio.eu" className="pynk-btn pynk-btn-primary pynk-btn-lg">
              <Mail className="pynk-icon-xs" />
              info@pynkstudio.eu
            </a>
            <Link href={href("/contattaci")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              Contact form
            </Link>
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="faq-are-you-stupid-en">
        <div className="pynk-container">
          <h2 id="faq-are-you-stupid-en" className="pynk-section-title">
            Frequently asked questions
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
          <h2 className="pynk-section-title">More by PYNK STUDIO</h2>
          <p className="pynk-section-lead">
            From back-office software to storefront sites, from field coordination to a game for your phone — see the full
            portfolio (in Italian).
          </p>
          <Link href={href("/lavori")} className="pynk-btn pynk-btn-outline pynk-btn-lg pynk-mt-24">
            Back to Lavori
          </Link>
        </div>
      </section>
    </div>
  );
}

export function PynkAreYouStupidEnPage() {
  return (
    <PynkShell>
      <AreYouStupidEnInner />
    </PynkShell>
  );
}
