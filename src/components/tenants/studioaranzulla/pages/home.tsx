"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  Clock,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Scale,
  ScrollText,
  Shield,
  Star,
  TrendingUp,
} from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";

const practiceAreas = [
  {
    id: "civile",
    icon: Scale,
    kicker: "Diritto Civile",
    title: "Tutela dei diritti",
    desc: "Contratti, responsabilità civile, risarcimenti e recupero crediti. Assistenza dalla diffida al giudizio di merito, con un approccio orientato al risultato concreto.",
  },
  {
    id: "famiglia",
    icon: Heart,
    kicker: "Diritto di Famiglia",
    title: "Separazioni e affidamento",
    desc: "Separazione, divorzio, affidamento e mantenimento. Ogni fase è gestita con rigore tecnico e attenzione alla persona, in sede giudiziale e stragiudiziale.",
  },
  {
    id: "lavoro",
    icon: Briefcase,
    kicker: "Diritto del Lavoro",
    title: "Tutela del lavoratore",
    desc: "Licenziamenti illegittimi, mobbing, mancato pagamento di retribuzioni e accordi sindacali. Difesa in ogni sede, con focus sui diritti effettivi.",
  },
  {
    id: "penale",
    icon: Shield,
    kicker: "Diritto Penale",
    title: "Difesa penale",
    desc: "Assistenza dal primo atto investigativo all'udienza dibattimentale. Garanzia di una difesa tempestiva, preparata e riservata.",
  },
  {
    id: "commerciale",
    icon: TrendingUp,
    kicker: "Diritto Commerciale",
    title: "Contratti e società",
    desc: "Redazione e revisione di contratti, controversie societarie, recupero crediti commerciali. Supporto continuativo per imprese e professionisti.",
  },
  {
    id: "successorio",
    icon: ScrollText,
    kicker: "Diritto Successorio",
    title: "Testamenti ed eredità",
    desc: "Successioni legali e testamentarie, divisioni ereditarie e impugnazioni. Tutela del patrimonio familiare nel lungo periodo.",
  },
];

const processSteps = [
  {
    n: "I",
    title: "Prima consulenza",
    desc: "Ascoltiamo la tua situazione, analizziamo i fatti e rispondiamo alle domande fondamentali. Senza impegni, senza tecnicismi inutili.",
  },
  {
    n: "II",
    title: "Analisi del caso",
    desc: "Studio approfondito degli atti e della documentazione. Valutazione dei rischi, delle tempistiche e della strategia più efficace.",
  },
  {
    n: "III",
    title: "Strategia legale",
    desc: "Ti presentiamo le opzioni disponibili — accordo stragiudiziale, mediazione o contenzioso — con un'analisi chiara di costi e benefici.",
  },
  {
    n: "IV",
    title: "Assistenza attiva",
    desc: "Gestione completa della pratica con aggiornamenti regolari. Rappresentanza in ogni sede giudiziaria e amministrativa.",
  },
];

const mockReviews = [
  {
    id: "r1",
    author: "Marco T.",
    role: "Causa di lavoro",
    text: "Professionalità e chiarezza che non ti aspetti. Mi ha spiegato ogni passo senza tecnicismi. Causa vinta in appello.",
    rating: 5,
  },
  {
    id: "r2",
    author: "Giulia M.",
    role: "Diritto di famiglia",
    text: "Periodo difficile, gestito con sensibilità e competenza rara. I figli sono stati tutelati come meritavano. Non potevo chiedere di meglio.",
    rating: 5,
  },
  {
    id: "r3",
    author: "Claudio F.",
    role: "Contratto commerciale",
    text: "Avevo firmato un contratto con clausole capestro che nessuno aveva rilevato. L'avvocato Aranzulla ha trovato la via d'uscita in pochi giorni.",
    rating: 5,
  },
];

const competencies = [
  "Diritto Civile",
  "Diritto di Famiglia",
  "Diritto del Lavoro",
  "Diritto Penale",
  "Diritto Commerciale",
  "Diritto Successorio",
  "Mediazione",
  "Negoziazione assistita",
];

type FormState = "idle" | "sent";

export function StudioAranzullaHomePage() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const [formState, setFormState] = useState<FormState>("idle");

  const studioEmail = "info@studiolegalearanzulla.it";
  const phoneHref = `tel:${content.contact.phone.replace(/\s/g, "")}`;
  const emailHref = `mailto:${studioEmail}`;
  const waHref = `https://wa.me/${content.contact.whatsappDigits}?text=${encodeURIComponent(content.contact.whatsappMessage)}`;

  return (
    <main className="ara-site">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="ara-nav">
        <div className="ara-container ara-nav-inner">
          <a href="#top" className="ara-logo" aria-label="Studio Legale Aranzulla">
            <span className="ara-logo-seal">A</span>
            <span className="ara-logo-text">
              Studio Legale Aranzulla
              <small>Avv. Lara Aranzulla · Iscritta all&apos;Ordine</small>
            </span>
          </a>
          <nav className="ara-nav-links" aria-label="Menu principale">
            <a href="#aree">Aree di pratica</a>
            <a href="#chi-siamo">Chi siamo</a>
            <a href="#processo">Come lavoriamo</a>
            <a href="#recensioni">Recensioni</a>
            <a href="#contatti">Contatti</a>
          </nav>
          <a href="#contatti" className="ara-btn ara-btn-primary">
            Consulenza <ArrowRight size={14} />
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section id="top" className="ara-hero">
        <div className="ara-hero-content">
          <div className="ara-hero-label">
            <span className="ara-eyebrow">{content.hero.eyebrow}</span>
          </div>
          <h1 className="ara-hero-title">
            {content.hero.titleLead}
            <br />
            <em>{content.hero.titleAccent}</em>
          </h1>
          <div className="ara-hero-divider" aria-hidden="true" />
          <p className="ara-hero-body">{content.hero.body}</p>
          <div className="ara-hero-actions">
            <a href="#contatti" className="ara-btn ara-btn-primary">
              {content.hero.ctaLabel} <ArrowRight size={15} />
            </a>
            <a href="#aree" className="ara-btn ara-btn-outline">
              Aree di pratica
            </a>
          </div>
        </div>

        <div className="ara-hero-media">
          <Image
            src={content.hero.backdrop}
            alt="Studio Legale Aranzulla"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="ara-hero-badge" aria-hidden="true">
            <strong>20+</strong>
            <span>anni di<br />esperienza</span>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section className="ara-stats" aria-label="Numeri chiave dello studio">
        <div className="ara-container">
          <div className="ara-stats-inner">
            {[
              ["20+", "Anni di attività"],
              ["6", "Aree di pratica"],
              ["500+", "Pratiche gestite"],
              ["100%", "Riservatezza"],
            ].map(([value, label]) => (
              <div key={label} className="ara-stat">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Aree di pratica ──────────────────────────────────── */}
      <section id="aree" className="ara-section">
        <div className="ara-container">
          <div className="ara-section-head-2col">
            <div>
              <span className="ara-eyebrow">{content.soulsIntro.eyebrow}</span>
              <h2 className="ara-section-title">
                {content.soulsIntro.titleLead}
                <br />
                <em>{content.soulsIntro.titleAccent}</em>
              </h2>
            </div>
            <p className="ara-section-desc">{content.soulsIntro.body}</p>
          </div>

          <div className="ara-areas-list" role="list">
            {practiceAreas.map((area, i) => (
              <div key={area.id} className="ara-area-row" role="listitem">
                <span className="ara-area-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="ara-area-head">
                  <span className="ara-area-kicker">{area.kicker}</span>
                  <h3 className="ara-area-title">{area.title}</h3>
                </div>
                <p className="ara-area-desc">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Chi siamo ─────────────────────────────────────────── */}
      <section id="chi-siamo" className="ara-section ara-section-alt">
        <div className="ara-container">
          <div className="ara-team-grid">
            <div className="ara-team-media">
              <Image
                src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80"
                alt="Studio Legale Aranzulla — libreria legale"
                fill
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover"
              />
              <div className="ara-team-badge">
                <strong>Avv. Lara Aranzulla</strong>
                <span>Fondatrice e titolare dello studio</span>
              </div>
            </div>

            <div className="ara-team-content">
              <div>
                <span className="ara-eyebrow">Chi siamo</span>
                <h2 className="ara-section-title">
                  Una professionista,
                  <br />
                  <em>un impegno concreto.</em>
                </h2>
              </div>

              <div className="ara-pull-quote">
                <p>
                  &ldquo;Un cliente informato è un cliente più tutelato. Per questo ogni consulenza inizia con un ascolto vero, prima ancora di parlare di strategie.&rdquo;
                </p>
              </div>

              <p className="ara-team-bio">
                L&apos;Avvocato Lara Aranzulla ha fondato lo studio con un obiettivo preciso: rendere il diritto accessibile e comprensibile senza rinunciare alla qualità della difesa. Ogni incarico è seguito personalmente, con aggiornamenti puntuali e totale trasparenza.
              </p>

              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ara-faint)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
                  Competenze
                </p>
                <div className="ara-chips">
                  {competencies.map((c) => (
                    <span key={c} className="ara-chip">{c}</span>
                  ))}
                </div>
              </div>

              <div>
                <a href="#contatti" className="ara-btn ara-btn-primary">
                  Prenota una consulenza <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Processo ─────────────────────────────────────────── */}
      <section id="processo" className="ara-section">
        <div className="ara-container">
          <div className="ara-section-head-center">
            <span className="ara-eyebrow">Come lavoriamo</span>
            <h2 className="ara-section-title">
              Nessuna sorpresa.
              <br />
              <em>Nessun passo al buio.</em>
            </h2>
            <p className="ara-section-desc">
              Ogni incarico segue una sequenza chiara. Tu sai sempre dove sei e cosa succede, prima di ogni decisione.
            </p>
          </div>

          <div className="ara-process-list" role="list">
            {processSteps.map((step) => (
              <div key={step.n} className="ara-process-row" role="listitem">
                <span className="ara-process-index" aria-hidden="true">{step.n}</span>
                <div className="ara-process-body">
                  <h3 className="ara-process-title">{step.title}</h3>
                  <p className="ara-process-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recensioni ───────────────────────────────────────── */}
      <section id="recensioni" className="ara-section ara-section-dark">
        <div className="ara-container">
          <div className="ara-section-head-2col">
            <div>
              <span className="ara-eyebrow" style={{ color: "var(--ara-gold-lt)" }}>Recensioni clienti</span>
              <h2 className="ara-section-title ara-section-title-wht">
                Risultati reali.
                <br />
                <em style={{ color: "var(--ara-gold-lt)" }}>Clienti soddisfatti.</em>
              </h2>
            </div>
            <p className="ara-section-desc ara-section-desc-wht">
              La reputazione dello studio si costruisce caso per caso. Ogni cliente è un impegno preso sul serio, senza eccezioni.
            </p>
          </div>

          <div className="ara-reviews-grid">
            {mockReviews.map((review) => (
              <article key={review.id} className="ara-review-card">
                <div className="ara-review-mark" aria-hidden="true">&ldquo;</div>
                <div className="ara-review-stars" aria-label={`${review.rating} stelle su 5`}>
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} size={13} fill="currentColor" />
                  ))}
                </div>
                <p className="ara-review-text">{review.text}</p>
                <div className="ara-review-sep" aria-hidden="true" />
                <div className="ara-review-author">
                  <div className="ara-review-avatar" aria-hidden="true">
                    {review.author.slice(0, 1)}
                  </div>
                  <div>
                    <strong>{review.author}</strong>
                    <small>{review.role}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contatti ─────────────────────────────────────────── */}
      <section id="contatti" className="ara-section">
        <div className="ara-container">
          <div className="ara-section-head-center">
            <span className="ara-eyebrow">{content.findUs.eyebrow}</span>
            <h2 className="ara-section-title">
              {content.findUs.titleLead}
              <br />
              <em>{content.findUs.titleAccent}</em>
            </h2>
            <p className="ara-section-desc">{content.findUs.body}</p>
          </div>

          <div className="ara-contact-layout">
            <div className="ara-contact-details">
              <a href={phoneHref} className="ara-contact-item">
                <div className="ara-contact-item-icon"><Phone size={18} /></div>
                <div>
                  <small>Telefono</small>
                  <span>{content.contact.phone}</span>
                </div>
              </a>

              <a href={emailHref} className="ara-contact-item">
                <div className="ara-contact-item-icon"><Mail size={18} /></div>
                <div>
                  <small>Email</small>
                  <span>{studioEmail}</span>
                </div>
              </a>

              <a href={waHref} target="_blank" rel="noopener noreferrer" className="ara-contact-item">
                <div className="ara-contact-item-icon"><MessageCircle size={18} /></div>
                <div>
                  <small>WhatsApp · risposta rapida</small>
                  <span>{content.contact.phone}</span>
                </div>
              </a>

              <div className="ara-contact-item">
                <div className="ara-contact-item-icon"><MapPin size={18} /></div>
                <div>
                  <small>Indirizzo</small>
                  <strong>{content.address.full}</strong>
                </div>
              </div>

              <div className="ara-contact-item">
                <div className="ara-contact-item-icon"><Clock size={18} /></div>
                <div>
                  <small>Orari ricevimento</small>
                  <strong>Lun–Ven · 9:00–13:00 / 15:00–18:00</strong>
                </div>
              </div>
            </div>

            <div>
              {formState === "sent" ? (
                <div className="ara-form ara-form-success">
                  <div className="ara-form-success-mark">
                    <CheckCircle size={26} />
                  </div>
                  <h3>Richiesta inviata.</h3>
                  <p>
                    Riceverai una risposta entro 24 ore lavorative per confermare disponibilità e modalità della consulenza.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormState("idle")}
                    className="ara-btn ara-btn-outline"
                  >
                    Nuova richiesta
                  </button>
                </div>
              ) : (
                <form
                  className="ara-form"
                  onSubmit={(e) => { e.preventDefault(); setFormState("sent"); }}
                >
                  <div className="ara-form-heading">
                    <h3>Richiedi una consulenza</h3>
                    <p>Compila il modulo. Ti ricontattiamo entro un giorno lavorativo.</p>
                  </div>

                  <div className="ara-form-row">
                    <label>
                      Nome e cognome
                      <input type="text" placeholder="Mario Rossi" required />
                    </label>
                    <label>
                      Telefono
                      <input type="tel" placeholder="+39 333 000 0000" required />
                    </label>
                  </div>

                  <label>
                    Email
                    <input type="email" placeholder="mario@esempio.it" required />
                  </label>

                  <label>
                    Area di interesse
                    <select defaultValue="">
                      <option value="" disabled>Seleziona un&apos;area</option>
                      <option value="civile">Diritto Civile</option>
                      <option value="famiglia">Diritto di Famiglia</option>
                      <option value="lavoro">Diritto del Lavoro</option>
                      <option value="penale">Diritto Penale</option>
                      <option value="commerciale">Diritto Commerciale</option>
                      <option value="successorio">Diritto Successorio</option>
                      <option value="altro">Altro</option>
                    </select>
                  </label>

                  <label>
                    Descrivi brevemente la situazione
                    <textarea
                      rows={4}
                      placeholder="Descrivi la tua situazione in poche righe. Non includere dati sensibili in questa fase."
                    />
                  </label>

                  <button type="submit" className="ara-btn ara-btn-primary">
                    Invia richiesta <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="ara-footer">
        <div className="ara-container">
          <div className="ara-footer-top">
            <div className="ara-footer-brand">
              <a href="#top" className="ara-footer-logo" aria-label="Torna all'inizio">
                <span className="ara-footer-seal">A</span>
                <span className="ara-footer-name">Studio Legale Aranzulla</span>
              </a>
              <p className="ara-footer-desc">{content.footer.body}</p>
            </div>

            <div className="ara-footer-col">
              <h4>Studio</h4>
              <a href="#aree">Aree di pratica</a>
              <a href="#chi-siamo">Chi siamo</a>
              <a href="#processo">Come lavoriamo</a>
              <a href="#recensioni">Recensioni</a>
            </div>

            <div className="ara-footer-col">
              <h4>Contatti</h4>
              <a href={phoneHref}>{content.contact.phone}</a>
              <a href={emailHref}>{studioEmail}</a>
              <a href={waHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>

            <div className="ara-footer-col">
              <h4>Legale</h4>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/cookie">Cookie Policy</Link>
              <Link href="/privacy">Trattamento dati</Link>
            </div>
          </div>

          <div className="ara-footer-bottom">
            <span>
              © {new Date().getFullYear()} Studio Legale Aranzulla · Avv. Lara Aranzulla · {content.footer.tagline}
            </span>
            <span>
              Powered by{" "}
              <a href="https://bizery.it" target="_blank" rel="noopener noreferrer">Bizery</a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
