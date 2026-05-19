"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle,
  Clock,
  FileText,
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
  Users,
} from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";

const practiceAreas = [
  {
    id: "civile",
    icon: Scale,
    kicker: "Diritto Civile",
    title: "Tutela dei diritti",
    desc: "Contratti, responsabilità civile, risarcimenti e recupero crediti. Assistenza in ogni fase del procedimento civile, dalla diffida al giudizio di merito.",
  },
  {
    id: "famiglia",
    icon: Heart,
    kicker: "Diritto di Famiglia",
    title: "Separazioni e affidamento",
    desc: "Separazione, divorzio, affidamento dei figli e assegno di mantenimento. Assistenza attenta anche nei momenti più delicati.",
  },
  {
    id: "lavoro",
    icon: Briefcase,
    kicker: "Diritto del Lavoro",
    title: "Tutela del lavoratore",
    desc: "Licenziamenti illegittimi, mobbing, mancato pagamento di retribuzioni. Difesa in sede giudiziale e stragiudiziale.",
  },
  {
    id: "penale",
    icon: Shield,
    kicker: "Diritto Penale",
    title: "Difesa penale",
    desc: "Assistenza dal primo atto investigativo fino all'udienza dibattimentale. Garanzia di una difesa tempestiva e preparata.",
  },
  {
    id: "commerciale",
    icon: TrendingUp,
    kicker: "Diritto Commerciale",
    title: "Contratti e società",
    desc: "Redazione e revisione di contratti, controversie societarie e recupero crediti commerciali. Supporto continuativo per imprese.",
  },
  {
    id: "successorio",
    icon: ScrollText,
    kicker: "Diritto Successorio",
    title: "Testamenti ed eredità",
    desc: "Successioni legali e testamentarie, divisioni ereditarie e impugnazioni. Tutela del patrimonio familiare nel tempo.",
  },
];

const processSteps = [
  {
    n: "01",
    title: "Prima consulenza",
    desc: "Ascoltiamo la tua situazione, analizziamo i fatti e rispondiamo alle domande essenziali. Senza impegni.",
  },
  {
    n: "02",
    title: "Analisi del caso",
    desc: "Studio approfondito della documentazione, valutazione dei rischi e definizione della strategia più efficace.",
  },
  {
    n: "03",
    title: "Strategia legale",
    desc: "Presentazione chiara delle opzioni: stragiudiziale, mediazione o contenzioso. Decidi tu con le informazioni giuste.",
  },
  {
    n: "04",
    title: "Assistenza attiva",
    desc: "Gestione completa della pratica, aggiornamenti costanti e rappresentanza in ogni sede giudiziaria.",
  },
];

const mockReviews = [
  {
    id: "r1",
    author: "Marco T.",
    role: "Causa di lavoro",
    text: "Professionalità e chiarezza che non ti aspetti. Mi ha spiegato ogni passo, nessuna sorpresa. Causa vinta in appello.",
    rating: 5,
  },
  {
    id: "r2",
    author: "Giulia M.",
    role: "Diritto di famiglia",
    text: "Periodo difficile, gestito con sensibilità e competenza. I figli sono stati tutelati come meritavano. Non potevo chiedere di meglio.",
    rating: 5,
  },
  {
    id: "r3",
    author: "Claudio F.",
    role: "Contratto commerciale",
    text: "Avevo firmato un contratto con clausole capestro. L'avvocato Aranzulla ha trovato la via d'uscita in pochi giorni.",
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
      {/* ── Nav ──────────────────────────────────────────── */}
      <nav className="ara-nav">
        <div className="ara-container ara-nav-row">
          <a href="#top" className="ara-logo" aria-label="Studio Legale Aranzulla — home">
            <span className="ara-logo-seal">A</span>
            <span>
              Studio Legale Aranzulla
              <small>Avv. Lara Aranzulla · Iscritto all&apos;Ordine</small>
            </span>
          </a>
          <div className="ara-nav-links">
            <a href="#aree">Aree di pratica</a>
            <a href="#chi-siamo">Chi siamo</a>
            <a href="#processo">Come lavoriamo</a>
            <a href="#recensioni">Recensioni</a>
            <a href="#contatti">Contatti</a>
          </div>
          <a href="#contatti" className="ara-btn ara-btn-primary">
            Consulenza <ArrowRight size={15} />
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section id="top" className="ara-hero">
        <div className="ara-container" style={{ display: "contents" }}>
          <div className="ara-hero-content ara-container" style={{ gridColumn: "1", paddingLeft: "24px" }}>
            <span className="ara-eyebrow">{content.hero.eyebrow}</span>
            <h1 className="ara-hero-title">
              {content.hero.titleLead}
              <span className="ara-hero-title-accent">{content.hero.titleAccent}</span>
            </h1>
            <p className="ara-hero-body">{content.hero.body}</p>
            <div className="ara-hero-actions">
              <a href="#contatti" className="ara-btn ara-btn-primary">
                {content.hero.ctaLabel} <ArrowRight size={16} />
              </a>
              <a href="#aree" className="ara-btn ara-btn-outline">
                Aree di pratica
              </a>
            </div>
          </div>

          <div className="ara-hero-image">
            <Image
              src={content.hero.backdrop}
              alt="Studio Legale Aranzulla"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="ara-hero-badge">
              <strong>20+</strong>
              <span>anni di esperienza</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="ara-stats" aria-label="Indicatori Studio Legale Aranzulla">
        <div className="ara-container">
          <div className="ara-stats-grid">
            {[
              ["20+", "anni di attività"],
              ["6", "aree di pratica"],
              ["500+", "pratiche gestite"],
              ["100%", "riservatezza"],
            ].map(([value, label]) => (
              <div key={label} className="ara-stat">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Aree di pratica ──────────────────────────────── */}
      <section id="aree" className="ara-section">
        <div className="ara-container">
          <div className="ara-section-head-split">
            <div>
              <span className="ara-eyebrow">{content.soulsIntro.eyebrow}</span>
              <h2 className="ara-section-title">
                {content.soulsIntro.titleLead}
                <span> {content.soulsIntro.titleAccent}</span>
              </h2>
            </div>
            <p className="ara-section-desc">{content.soulsIntro.body}</p>
          </div>

          <div className="ara-areas-grid">
            {practiceAreas.map((area) => {
              const Icon = area.icon;
              return (
                <div key={area.id} className="ara-area-card">
                  <div className="ara-area-icon">
                    <Icon size={22} />
                  </div>
                  <span className="ara-area-kicker">{area.kicker}</span>
                  <h3 className="ara-area-title">{area.title}</h3>
                  <p className="ara-area-desc">{area.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Chi siamo ────────────────────────────────────── */}
      <section id="chi-siamo" className="ara-section ara-section-alt">
        <div className="ara-container">
          <div className="ara-team-grid">
            <div className="ara-team-photo">
              <Image
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80"
                alt="Avv. Lara Aranzulla"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
              <div className="ara-team-photo-badge">
                <strong>Avv. Lara Aranzulla</strong>
                <span>Fondatrice e titolare dello studio</span>
              </div>
            </div>

            <div className="ara-team-content">
              <span className="ara-eyebrow">Il team</span>
              <h2 className="ara-section-title">
                Una professionista,
                <span> un impegno concreto.</span>
              </h2>
              <p className="ara-team-bio">
                L&apos;Avvocato Lara Aranzulla ha fondato lo studio con un obiettivo preciso: rendere il diritto accessibile e comprensibile, senza rinunciare alla qualità della difesa. Ogni cliente riceve attenzione diretta, non delegata.
              </p>
              <p className="ara-team-bio">
                Il lavoro dello studio si basa su una convinzione semplice: un cliente informato è un cliente più tutelato. Per questo ogni consulenza inizia con un ascolto attento e una spiegazione chiara della situazione, prima ancora di parlare di strategie.
              </p>

              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ara-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                  Competenze
                </p>
                <div className="ara-competencies">
                  {competencies.map((c) => (
                    <span key={c} className="ara-competency-chip">{c}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <a href="#contatti" className="ara-btn ara-btn-primary">
                  Prenota una consulenza <ArrowRight size={15} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Processo ─────────────────────────────────────── */}
      <section id="processo" className="ara-section">
        <div className="ara-container">
          <div className="ara-section-head" style={{ textAlign: "center" }}>
            <span className="ara-eyebrow" style={{ justifyContent: "center" }}>
              Come lavoriamo
            </span>
            <h2 className="ara-section-title" style={{ textAlign: "center" }}>
              Nessuna sorpresa.
              <span> Nessun passo al buio.</span>
            </h2>
            <p className="ara-section-desc" style={{ margin: "16px auto 0", textAlign: "center" }}>
              Ogni incarico segue un percorso chiaro: ascolto, analisi, strategia e assistenza attiva. Tu sai sempre dove sei e cosa succede.
            </p>
          </div>

          <div className="ara-process-grid">
            {processSteps.map((step) => (
              <div key={step.n} className="ara-process-step">
                <div className="ara-process-num">{step.n}</div>
                <h3 className="ara-process-title">{step.title}</h3>
                <p className="ara-process-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────────── */}
      <section id="recensioni" className="ara-section ara-section-dark">
        <div className="ara-container">
          <div className="ara-section-head-split">
            <div>
              <span className="ara-eyebrow">Recensioni clienti</span>
              <h2 className="ara-section-title ara-section-title-dark">
                Risultati reali.
                <span> Clienti soddisfatti.</span>
              </h2>
            </div>
            <p className="ara-section-desc ara-section-desc-dark">
              La reputazione dello studio si costruisce caso per caso. Ogni cliente è un impegno preso sul serio.
            </p>
          </div>

          <div className="ara-reviews-grid">
            {mockReviews.map((review) => (
              <article key={review.id} className="ara-review-card">
                <div className="ara-review-stars">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="ara-review-text">&ldquo;{review.text}&rdquo;</p>
                <div className="ara-review-author">
                  <div className="ara-review-avatar">{review.author.slice(0, 1)}</div>
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

      {/* ── Contatti ─────────────────────────────────────── */}
      <section id="contatti" className="ara-section ara-section-alt">
        <div className="ara-container">
          <div className="ara-section-head" style={{ textAlign: "center" }}>
            <span className="ara-eyebrow" style={{ justifyContent: "center" }}>
              {content.findUs.eyebrow}
            </span>
            <h2 className="ara-section-title" style={{ textAlign: "center" }}>
              {content.findUs.titleLead}
              <span> {content.findUs.titleAccent}</span>
            </h2>
            <p className="ara-section-desc" style={{ margin: "16px auto 0", textAlign: "center" }}>
              {content.findUs.body}
            </p>
          </div>

          <div className="ara-contact-grid">
            <div className="ara-contact-info">
              <a href={phoneHref} className="ara-contact-row">
                <div className="ara-contact-icon">
                  <Phone size={18} />
                </div>
                <div>
                  <small>Telefono</small>
                  <span>{content.contact.phone}</span>
                </div>
              </a>

              <a href={emailHref} className="ara-contact-row">
                <div className="ara-contact-icon">
                  <Mail size={18} />
                </div>
                <div>
                  <small>Email</small>
                  <span>info@studiolegalearanzulla.it</span>
                </div>
              </a>

              <a href={waHref} target="_blank" rel="noopener noreferrer" className="ara-contact-row">
                <div className="ara-contact-icon">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <small>WhatsApp · risposta rapida</small>
                  <span>{content.contact.phone}</span>
                </div>
              </a>

              <div className="ara-contact-row">
                <div className="ara-contact-icon">
                  <MapPin size={18} />
                </div>
                <div>
                  <small>Indirizzo</small>
                  <span>{content.address.full}</span>
                </div>
              </div>

              <div className="ara-contact-row">
                <div className="ara-contact-icon">
                  <Clock size={18} />
                </div>
                <div>
                  <small>Orari ricevimento</small>
                  <span>Lun–Ven · 9:00–13:00 / 15:00–18:00</span>
                </div>
              </div>
            </div>

            <div>
              {formState === "sent" ? (
                <div className="ara-form ara-form-success">
                  <div className="ara-form-success-icon">
                    <CheckCircle size={32} />
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
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFormState("sent");
                  }}
                >
                  <div>
                    <h3 className="ara-form-title">Richiedi una consulenza</h3>
                    <p className="ara-form-subtitle">
                      Compila il modulo. Ti ricontattiamo entro un giorno lavorativo.
                    </p>
                  </div>

                  <div className="ara-form-grid">
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
                    Invia richiesta <ArrowRight size={15} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="ara-footer">
        <div className="ara-container">
          <div className="ara-footer-top">
            <div className="ara-footer-brand">
              <a href="#top" className="ara-footer-logo" aria-label="Torna all'inizio">
                <span className="ara-footer-logo-seal">A</span>
                Studio Legale Aranzulla
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
              <a href={emailHref}>info@studiolegalearanzulla.it</a>
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </div>

            <div className="ara-footer-col">
              <h4>Legale</h4>
              <a href="/privacy">Privacy Policy</a>
              <a href="/cookie">Cookie Policy</a>
              <a href="/privacy">Trattamento dati</a>
            </div>
          </div>

          <div className="ara-footer-bottom">
            <span>
              © {new Date().getFullYear()} Studio Legale Aranzulla · Avv. Lara Aranzulla ·{" "}
              {content.footer.tagline}
            </span>
            <span>
              Powered by{" "}
              <a href="https://bizery.it" target="_blank" rel="noopener noreferrer">
                Bizery
              </a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
