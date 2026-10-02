"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, ExternalLink, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, faqSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

// Public iOS beta — add/replace the Google Play link once that beta opens.
const TESTFLIGHT_URL = "https://testflight.apple.com/join/G8kQkCdt";

const pillars = [
  { title: "Everyone, at the same instant", body: "2 to 8 players get the same instruction at the same moment. The TV shows who blew it. Immediately." },
  { title: "Under 8 words", body: "Every instruction fits on one line, in caps. Dead easy. Which is exactly why somebody will get it wrong." },
  { title: "Your phone is the controller", body: "No gamepads, nothing to set up: scan the QR on the TV and you're in. iPhone and Android in the same game." },
  { title: "Zero downtime", body: "A round lasts a few seconds, the roast for whoever failed lands live, and off you go again. No loading, no waiting." },
  { title: "The AI invents the challenges", body: "With an Apple Intelligence iPhone in the room, the game creates fresh challenges on the fly. All on-device, no cloud." },
  { title: "And when you're alone", body: "Single-player is always there: offline, one-handed, level after level until you slip. Works in airplane mode too." },
];

const steps = [
  { title: "Turn on the TV", body: "Open Are You Stupid? on Apple TV, or on a Mac and send it to the TV with AirPlay. The room and its QR code appear on screen." },
  { title: "Join from your phone", body: "Everyone scans the QR (or types the room code), picks a name and an emoji. Just be on the same Wi-Fi network." },
  { title: "Pick a mode", body: "Last Stupid Standing: fail and you're out, last one left wins. Stupid Battle: everyone plays to the end, most points wins." },
  { title: "Don't screw it up", body: "One ridiculously simple instruction, the same for everyone, a few seconds to do it. On the TV, in front of everyone: who didn't make it." },
];

const faq = [
  {
    q: "What do I need to play as a group?",
    a: "An Apple TV, or a Mac mirrored to the TV with AirPlay, as the game board. Then one phone each, iPhone or Android, all on the same Wi-Fi network. 2 to 8 players.",
  },
  {
    q: "Can I try it already?",
    a: "Yes, it's in public beta on TestFlight for iOS. The App Store (iPhone, iPad, Apple TV and Mac) and Google Play launch is coming soon.",
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
    q: "Does Are You Stupid? collect personal data?",
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
      name: "Are You Stupid?",
      applicationCategory: "GameApplication",
      applicationSubCategory: "Party game",
      operatingSystem: "iOS, iPadOS, tvOS, macOS, Android",
      description:
        "The 2-to-8-player party game: one stupidly simple instruction, the same for everyone at the same instant, and the TV shows who failed. Your phone is the controller. Single-player too, offline.",
      author: { "@type": "Organization", name: "PYNK STUDIO" },
      publisher: { "@type": "Organization", name: "PYNK STUDIO" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      inLanguage: "en",
    },
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Lavori", path: "/lavori" },
      { name: "Are You Stupid? (English)", path: "/lavori/are-you-stupid/en" },
    ]),
    faqSchema(faq),
  ];

  return (
    <div className="pynk-page">
      <PynkJsonLd data={jsonLd} />

      <section className="pynk-hero pynk-hero-sub">
        <div className="pynk-glow pynk-glow-tr" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <p className="pynk-eyebrow pynk-eyebrow-chip">Party game · Apple TV, Mac, iPhone &amp; Android · Public beta on TestFlight</p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="pynk-hero-title">
            ARE YOU <span className="pynk-accent">STUPID?</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="pynk-hero-subtitle"
          >
            The party game where everyone gets the same stupidly simple instruction at the same instant — and the TV shows the
            whole room who got it wrong. Your phone is the controller, 2 to 8 players. Looks easy. It isn&apos;t.
          </motion.p>
          <p className="pynk-note pynk-mt-24">
            In-game: <em>&laquo;One job. Don&apos;t fuck it up.&raquo;</em> — crude language used on purpose, see{" "}
            <a href="#content-age">Content &amp; age</a> below.
          </p>
          <p className="pynk-note pynk-mt-12">Public beta on TestFlight (iOS) — App Store (iPhone, iPad, Apple TV, Mac) and Google Play coming soon.</p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="pynk-hero-ctas pynk-mt-24">
            <a href={TESTFLIGHT_URL} target="_blank" rel="noopener noreferrer" className="pynk-btn pynk-btn-primary pynk-btn-lg">
              Try it on TestFlight
              <ExternalLink className="pynk-icon-xs" />
            </a>
            <Link href={href("/lavori/are-you-stupid/privacy")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              <ShieldCheck className="pynk-icon-xs" />
              Privacy Policy
            </Link>
          </motion.div>
          <p className="pynk-note pynk-mt-24">
            <Link href={href("/lavori/are-you-stupid")}>Leggi questa pagina in italiano →</Link>
          </p>
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

      <section className="pynk-section pynk-section-alt" aria-labelledby="how-to-play">
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

      <section className="pynk-section" aria-labelledby="preview">
        <div className="pynk-container pynk-center-col">
          <h2 id="preview" className="pynk-section-title">
            Preview
          </h2>
          <div className="pynk-panel">
            <Sparkles className="pynk-icon-sm" />
            <p className="pynk-panel-desc">
              Screenshots and video of a real game night, TV and phones included, arrive together with the store launch. In the
              meantime, this page already has everything needed for store review: description, privacy policy and support contact.
            </p>
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
