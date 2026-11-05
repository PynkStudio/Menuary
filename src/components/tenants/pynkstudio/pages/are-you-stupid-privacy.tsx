"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { PynkJsonLd } from "../pynk-json-ld";
import { breadcrumbSchema, organizationSchema } from "../pynk-seo";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";

// Data qui sotto: bump manuale a ogni revisione sostanziale del testo.
const LAST_UPDATED = "November 5, 2026";

function PrivacyInner() {
  const href = useTenantLocalizedHref();

  const jsonLd = [
    organizationSchema(),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Lavori", path: "/lavori" },
      { name: "Are You Stupid?!", path: "/lavori/are-you-stupid" },
      { name: "Privacy Policy", path: "/lavori/are-you-stupid/privacy" },
    ]),
  ];

  return (
    <div className="pynk-page">
      <PynkJsonLd data={jsonLd} />

      <section className="pynk-hero pynk-hero-sub pynk-hero-compact">
        <div className="pynk-glow pynk-glow-tl" aria-hidden />
        <div className="pynk-container pynk-hero-content">
          <p className="pynk-eyebrow">Are You Stupid?! — iPhone, iPad, Apple TV, Mac &amp; Android</p>
          <h1 className="pynk-hero-title">Privacy Policy</h1>
          <p className="pynk-hero-subtitle">
            Last updated: {LAST_UPDATED}.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-summary">
        <div className="pynk-container">
          <div className="pynk-panel">
            <h2 id="pp-summary" className="pynk-panel-title">
              In short
            </h2>
            <p className="pynk-panel-desc">
              Are You Stupid?! has no account, and your scores and settings stay on your devices. Two things can leave them: what our
              advertising partner, Google AdMob, collects to show and measure ads on phones and tablets, within the choices you make in
              the consent message; and, in party mode, the lines the online voice host speaks, which can include a player&apos;s
              spoken name and are turned into audio on our server by an AI voice service. The host can switch the voice off at any time.
            </p>
          </div>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-who">
        <div className="pynk-container">
          <h2 id="pp-who" className="pynk-section-title pynk-section-title-left">
            Who we are
          </h2>
          <p className="pynk-panel-desc">
            Are You Stupid?! is developed and published by <strong>PYNK STUDIO</strong> (P.IVA 13577530960), Via Gino Severini 1,
            Milano, Italy — the data controller for this app. Contact: <a href="mailto:info@pynkstudio.eu">info@pynkstudio.eu</a>,{" "}
            <a href="tel:+393513768607">+39 351 3768607</a>.
          </p>
          <p className="pynk-panel-desc">
            This policy covers the game <em>Are You Stupid?!</em> on iPhone and iPad, its party-mode host apps for Apple TV and Mac
            (all published under the identifier <code>com.ays.areYouStupid</code>), and on Android (identifier{" "}
            <code>com.ays.are_you_stupid</code>), with every feature described below, including the Stupid Streak game in iMessage. It does not cover PYNK STUDIO&apos;s other products or websites, which have their own
            privacy policies.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-not-collected">
        <div className="pynk-container">
          <h2 id="pp-not-collected" className="pynk-section-title pynk-section-title-left">
            What the game does not do
          </h2>
          <ul className="pynk-check-list pynk-mt-24">
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>No account, no sign-up, no login of any kind.</span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>
                No player profiles: our server does not keep your scores, match history or any identifier for you. It only produces
                the host&apos;s voice, as described below.
              </span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>No analytics or crash-reporting SDK of our own.</span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>No chat, no friends list, no leaderboard tied to an identity.</span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>
                No access to your microphone, contacts, photos, or precise location. The camera is used only if you choose to scan a
                multiplayer QR code (see below).
              </span>
            </li>
            <li>
              <Check className="pynk-icon-sm pynk-check" />
              <span>
                No cloud AI for challenges or commentary: the optional Apple Intelligence features run entirely on your device. The only
                AI used online is the speech service that voices the host&apos;s lines.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-local">
        <div className="pynk-container">
          <h2 id="pp-local" className="pynk-section-title pynk-section-title-left">
            Data stored only on your device
          </h2>
          <p className="pynk-panel-desc">
            The app saves a small amount of data locally on your device (using Android/iOS standard preferences storage) to
            remember: your best score and run stats; your settings (sound, haptics, &quot;savage mode&quot;, language, AI mode);
            your purchases; your multiplayer nickname, emoji, spoken name, a random anonymous player identifier and match stats;
            and, on iPhone/iPad, a small anonymous play-style summary of your recent rounds (no identity attached) used by the
            on-device AI. This data is not sent to PYNK STUDIO, and is deleted when you uninstall the app or clear its storage
            (Settings → Reset stats also clears the play-style summary). The exceptions are what you share with the room and the
            spoken lines described in the party mode sections below.
          </p>
          <p className="pynk-panel-desc">
            The Apple TV and Mac host apps remember hosting preferences and the host&apos;s language, voice and intensity settings.
            They also keep, for at most 64 returning players, a title earned in a match (such as &quot;the king&quot;), linked to
            the anonymous player identifier and not to a name, so the host can greet that player next time: positive titles expire
            after 90 days and negative ones after 7. Audio of the host&apos;s lines is cached in the device&apos;s temporary storage,
            which the system can clear at any time. None of this is synced to any account or cloud service of ours.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-multiplayer">
        <div className="pynk-container">
          <h2 id="pp-multiplayer" className="pynk-section-title pynk-section-title-left">
            Party mode: camera and local network
          </h2>
          <p className="pynk-panel-desc">
            In party mode, phones join a game hosted by the Apple TV or Mac app over your <strong>local Wi-Fi network</strong>. The
            app asks for local-network access to find and connect to that host. Between the devices travel: the nickname and emoji
            you pick, your spoken name, the anonymous player identifier, your answers and taps, the scores, and which party features
            your purchases unlock. Other people in the room can see your nickname on the board. This traffic stays on your local
            network, with one exception: the spoken lines described in the next section.
          </p>
          <p className="pynk-panel-desc">
            If your phone cannot work out how to pronounce a nickname, it may ask another phone in the room with on-device AI to do
            it, over the local network. That phone does not display the name.
          </p>
          <p className="pynk-panel-desc">
            The camera is used only if you tap to scan the room&apos;s QR code shown on the TV. Frames are read on your device to
            decode the code and are never stored or transmitted. You can always type the room code instead and leave the camera
            permission off. The QR code contains a link with the room code and the host&apos;s local network address. With the app
            installed, the link opens the app directly. Without it, your browser opens a page on pynkstudio.eu, which receives that
            link along with the standard information any website receives, such as your IP address.
          </p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-voice">
        <div className="pynk-container">
          <h2 id="pp-voice" className="pynk-section-title pynk-section-title-left">
            Party mode: the online voice host
          </h2>
          <p className="pynk-panel-desc">
            On Apple TV and Mac, a game-show host comments on the match out loud. Phones never contact this service: only the Apple
            TV or Mac app does, and the match works exactly the same without it. We write the host&apos;s lines ourselves. They are
            chosen on the Apple TV or Mac from what happens in the match, and our server does not use AI to write them.
          </p>
          <div className="pynk-panel pynk-mt-24">
            <h3 className="pynk-panel-title-sm">What is sent</h3>
            <p className="pynk-panel-desc">
              Most lines are pre-recorded. The app downloads them from our server (<code>pynkstudio.eu</code>), and those requests
              contain no player data. When a line is not already available as audio, the app sends our server its text, its language,
              its intensity and a technical identifier for the line. The text can contain a <strong>player&apos;s spoken name</strong>{" "}
              and a joke about what that player just did: for example &quot;LUCA, YOU FAILED AGAIN&quot;. The spoken name is a
              cleaned-up version of the nickname (&quot;Luca&quot; from &quot;x_$Luca🔥_xX&quot;), so it may be a real first name if
              that is what you typed. Your full nickname, emoji, player identifier, contacts and advertising identifier are not sent.
              Names that cannot be spoken safely are never sent: the host addresses that player without using a name.
            </p>
          </div>
          <div className="pynk-panel pynk-mt-12">
            <h3 className="pynk-panel-title-sm">Who processes it</h3>
            <p className="pynk-panel-desc">
              Our server forwards the text to an AI speech service, <strong>ElevenLabs</strong> or, as a fallback,{" "}
              <strong>OpenAI</strong>, which returns the audio. The server is hosted on <strong>Vercel</strong>, and the audio is
              stored on <strong>Supabase</strong>. These providers act on our behalf.
            </p>
          </div>
          <div className="pynk-panel pynk-mt-12">
            <h3 className="pynk-panel-title-sm">How long it is kept</h3>
            <p className="pynk-panel-desc">
              Generated audio is kept in private storage so the same sentence does not have to be generated twice, and it can be
              reused for any room that needs the same sentence. It is deleted automatically after 30 days without being used. Our
              database stores only a hash of the request, the file location and timestamps, not the name or the sentence as text, but
              the audio itself contains the words spoken. Nothing links the audio to a person, a device or a match. Like any website,
              our server and its hosting provider also process the IP address of each request, to deliver the response and limit abuse.
            </p>
          </div>
          <div className="pynk-panel pynk-mt-12">
            <h3 className="pynk-panel-title-sm">Your choices</h3>
            <p className="pynk-panel-desc">
              Whoever runs the room controls the host from <strong>OPTIONS</strong> in the lobby: <strong>VOICE</strong>,{" "}
              <strong>MUTE</strong> (captions only) or <strong>OFF</strong>. With MUTE or OFF, no line is sent for speech. You can also
              play under a nickname that is not your real name. If you run the room, please let your guests know the host speaks their
              names through an online service.
            </p>
          </div>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-imessage">
        <div className="pynk-container">
          <h2 id="pp-imessage" className="pynk-section-title pynk-section-title-left">
            Stupid Streak in iMessage
          </h2>
          <p className="pynk-panel-desc">
            Stupid Streak is played inside Apple&apos;s Messages app. The state of the game travels inside your conversation as a
            message, through Apple&apos;s service and under Apple&apos;s terms. It does not use a server of ours, and we do not see
            your conversations, your contacts or your results.
          </p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-ai">
        <div className="pynk-container">
          <h2 id="pp-ai" className="pynk-section-title pynk-section-title-left">
            On-device AI (Apple Intelligence, iPhone and iPad only)
          </h2>
          <p className="pynk-panel-desc">
            On iPhone and iPad models that support Apple Intelligence, the game can use Apple&apos;s on-device model to invent new
            challenges and commentary. The model runs entirely on your device: nothing the on-device AI uses or produces is sent to
            PYNK STUDIO, to Apple&apos;s servers or to any other AI service for this purpose. Its input is the anonymous play-style
            summary described above and, in party mode, match facts without names. In party mode,
            the challenges one phone generates are shared with the other players over the local network — they contain game
            content, not personal data. You can switch the AI off at any time in Settings (Classic mode). These features are not
            available on Android.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-ads">
        <div className="pynk-container">
          <h2 id="pp-ads" className="pynk-section-title pynk-section-title-left">
            Advertising (Google AdMob)
          </h2>
          <p className="pynk-panel-desc">
            The app shows ads through <strong>Google AdMob</strong>, provided by Google LLC / Google Ireland Limited (&quot;Google&quot;),
            to fund development. Ads only ever appear when you tap a specific button — an interstitial after you tap TRY AGAIN, or
            a rewarded video if you choose to tap CONTINUE — never automatically, and never during gameplay itself. The Apple TV and
            Mac host apps show no ads.
          </p>
          <div className="pynk-panel pynk-mt-24">
            <h3 className="pynk-panel-title-sm">Your consent comes first</h3>
            <p className="pynk-panel-desc">
              Before any ad is requested, the app shows Google&apos;s consent message where the law requires it (EEA, UK,
              Switzerland and some US states). You can accept, refuse, or choose purpose by purpose; if you refuse, no personalized
              ads are shown and your choices are respected by Google. You can change your mind at any time from the game&apos;s
              Settings → <strong>AD PRIVACY CHOICES</strong>.
            </p>
          </div>
          <p className="pynk-panel-desc">
            To do this, the Google Mobile Ads SDK embedded in the app may collect and process, on Google&apos;s behalf: your
            device&apos;s advertising identifier (IDFA on iOS, Advertising ID on Android), IP address, general device information
            (model, operating system, language, time zone), an approximate location derived from your IP address, diagnostic data
            about the ad SDK, and data about how you interact with ads (impressions, clicks, view time). Google uses this to serve ads, measure and report on their
            performance, prevent fraud, and — where you have consented — show ads personalized to your interests.
          </p>
          <div className="pynk-panel pynk-mt-24">
            <h3 className="pynk-panel-title-sm">On iOS</h3>
            <p className="pynk-panel-desc">
              After the consent message, and before your advertising identifier is used for tracking, the app asks for your
              permission through Apple&apos;s App Tracking Transparency prompt: &quot;This identifier lets us show ads that fund the game and measure whether they
              worked.&quot; If you decline or your device restricts tracking, you still see ads — just non-personalized ones,
              measured through Apple&apos;s SKAdNetwork instead. You can change your answer any time in Settings → Privacy &amp;
              Security → Tracking.
            </p>
          </div>
          <div className="pynk-panel pynk-mt-12">
            <h3 className="pynk-panel-title-sm">On Android</h3>
            <p className="pynk-panel-desc">
              You can reset your Advertising ID or opt out of ads personalization at any time from your device&apos;s Google
              Settings → Ads.
            </p>
          </div>
          <p className="pynk-panel-desc pynk-mt-24">
            We do not receive or see any of this data ourselves — Google processes it directly, under its own privacy policy. See{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              Google&apos;s Privacy Policy
            </a>
            ,{" "}
            <a href="https://support.google.com/admob/answer/6128543" target="_blank" rel="noopener noreferrer">
              how Google uses data in AdMob apps
            </a>
            , and{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
              Google Ad Settings
            </a>{" "}
            for details and controls.
          </p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-share">
        <div className="pynk-container">
          <h2 id="pp-share" className="pynk-section-title pynk-section-title-left">
            Sharing your result
          </h2>
          <p className="pynk-panel-desc">
            If you tap the share button, the app opens your device&apos;s standard share sheet with a short text about your score.
            This only happens when you choose to do it, and only sends data to whichever app or contact you pick from that sheet —
            we don&apos;t see or store what you share.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-iap">
        <div className="pynk-container">
          <h2 id="pp-iap" className="pynk-section-title pynk-section-title-left">
            In-app purchases
          </h2>
          <p className="pynk-panel-desc">
            You can buy one-time upgrades, such as &quot;Remove ads&quot; and the Party Pack. The payment is handled entirely by the App Store or Google Play
            under their own terms and privacy policies: PYNK STUDIO never receives your name, payment details or account. The app
            only learns that the purchase succeeded, and remembers it locally; in party mode it tells the host which features are
            unlocked. &quot;Restore purchase&quot; in Settings asks the store again, for example after a reinstall.
          </p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-children">
        <div className="pynk-container">
          <h2 id="pp-children" className="pynk-section-title pynk-section-title-left">
            Children&apos;s privacy
          </h2>
          <p className="pynk-panel-desc">
            Are You Stupid?! contains crude language and humor and is <strong>not directed at children</strong>. It is not listed
            in Apple&apos;s Kids Category and is not part of Google Play&apos;s Families program. We do not knowingly collect
            personal data from children under 13 (or the minimum age required by your local law). If you believe a child has
            provided data to us or to our partners through the app, please contact us using the details below so we can
            address it.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-rights">
        <div className="pynk-container">
          <h2 id="pp-rights" className="pynk-section-title pynk-section-title-left">
            Your choices and rights
          </h2>
          <p className="pynk-panel-desc">
            Where the GDPR applies, personalized advertising and the use of your advertising identifier rely on your{" "}
            <strong>consent</strong> (Art. 6(1)(a)), collected through the consent message and withdrawable at any time from
            Settings → AD PRIVACY CHOICES; non-personalized ads and fraud prevention rely on our and Google&apos;s legitimate
            interest in funding and protecting a free game (Art. 6(1)(f)). The online voice host relies on our legitimate interest in
            offering the entertainment feature the room has chosen to use (Art. 6(1)(f)): you can object at any time, and the room
            can switch it off from OPTIONS. Because the audio of the host&apos;s lines is not linked to a person, we can usually find
            it only if you tell us the exact name and language; if you ask, we will delete it, and otherwise it expires as described
            above. Requests about advertising data are best handled directly with Google using the links above (Ad Settings, Tracking
            permission, Advertising ID reset). For anything else — a question about this policy, a request under the rights below, or a
            report of a problem — contact us at <a href="mailto:info@pynkstudio.eu">info@pynkstudio.eu</a> and we will respond as soon
            as we can. If
            you are in the EU/EEA, UK, or California, you may have rights of access, correction, erasure, restriction and objection
            under GDPR or CCPA/CPRA; for Google&apos;s processing, Google&apos;s privacy policy explains how to exercise them. You also have the right to lodge a
            complaint with a data protection authority — in Italy, the{" "}
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">
              Garante per la protezione dei dati personali
            </a>
            .
          </p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-transfers">
        <div className="pynk-container">
          <h2 id="pp-transfers" className="pynk-section-title pynk-section-title-left">
            International data transfers
          </h2>
          <p className="pynk-panel-desc">
            Data processed by Google for advertising purposes may be transferred to and processed in countries outside your own,
            including the United States. Google relies on mechanisms such as Standard Contractual Clauses to safeguard this data;
            see Google&apos;s Privacy Policy for details. The providers behind the voice host may also process the text of a line and
            the resulting audio outside the European Economic Area, including in the United States, under the safeguards the GDPR
            requires for such transfers, such as Standard Contractual Clauses.
          </p>
        </div>
      </section>

      <section className="pynk-section" aria-labelledby="pp-changes">
        <div className="pynk-container">
          <h2 id="pp-changes" className="pynk-section-title pynk-section-title-left">
            Changes to this policy
          </h2>
          <p className="pynk-panel-desc">
            If our data practices change — for example if we add a new feature or partner — we will update this page and the
            date at the top. We recommend checking back occasionally, especially before a major app
            update.
          </p>
        </div>
      </section>

      <section className="pynk-section pynk-section-alt" aria-labelledby="pp-contact">
        <div className="pynk-container pynk-center-col">
          <h2 id="pp-contact" className="pynk-section-title">
            Contact
          </h2>
          <p className="pynk-section-lead">
            PYNK STUDIO — Via Gino Severini 1, Milano, Italy — P.IVA 13577530960
            <br />
            <a href="mailto:info@pynkstudio.eu">info@pynkstudio.eu</a> · <a href="tel:+393513768607">+39 351 3768607</a>
          </p>
          <div className="pynk-hero-ctas pynk-mt-24">
            <Link href={href("/lavori/are-you-stupid")} className="pynk-btn pynk-btn-outline pynk-btn-lg">
              Back to Are You Stupid?!
              <ArrowRight className="pynk-icon-xs" />
            </Link>
            <Link href={href("/contattaci")} className="pynk-btn pynk-btn-primary pynk-btn-lg">
              Contact form
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PynkAreYouStupidPrivacyPage() {
  return (
    <PynkShell>
      <PrivacyInner />
    </PynkShell>
  );
}
