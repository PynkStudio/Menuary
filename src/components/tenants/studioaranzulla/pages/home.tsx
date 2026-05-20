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
    title: "Diritto Civile",
    desc: "Contratti, responsabilità civile, risarcimenti e recupero crediti. Assistenza dalla diffida al giudizio di merito.",
  },
  {
    id: "famiglia",
    icon: Heart,
    title: "Diritto di Famiglia",
    desc: "Separazione, divorzio, affidamento dei figli e mantenimento. Ogni fase seguita con rigore e attenzione alla persona.",
  },
  {
    id: "lavoro",
    icon: Briefcase,
    title: "Diritto del Lavoro",
    desc: "Licenziamenti illegittimi, mobbing, mancato pagamento di retribuzioni. Difesa in sede giudiziale e stragiudiziale.",
  },
  {
    id: "penale",
    icon: Shield,
    title: "Diritto Penale",
    desc: "Assistenza dal primo atto investigativo all'udienza dibattimentale. Difesa tempestiva e riservata in ogni fase.",
  },
  {
    id: "commerciale",
    icon: TrendingUp,
    title: "Diritto Commerciale",
    desc: "Contratti, controversie societarie e recupero crediti commerciali. Supporto continuativo per imprese e professionisti.",
  },
  {
    id: "successorio",
    icon: ScrollText,
    title: "Diritto Successorio",
    desc: "Successioni, divisioni ereditarie e impugnazioni testamentarie. Tutela del patrimonio familiare nel lungo periodo.",
  },
];

const methodSteps = [
  {
    n: "01",
    title: "Prima consulenza",
    desc: "Ascoltiamo la situazione, analizziamo i fatti e rispondiamo alle domande essenziali. Senza impegni.",
  },
  {
    n: "02",
    title: "Analisi della documentazione",
    desc: "Studio degli atti, valutazione dei rischi e individuazione della strategia più efficace in relazione ai tempi e ai costi.",
  },
  {
    n: "03",
    title: "Proposta e accordo",
    desc: "Presentazione delle opzioni: accordo stragiudiziale, mediazione o contenzioso. La scelta spetta al cliente, con piena informazione.",
  },
  {
    n: "04",
    title: "Assistenza e rappresentanza",
    desc: "Gestione completa dell'incarico con aggiornamenti regolari. Rappresentanza in ogni sede giudiziaria e amministrativa.",
  },
];

const mockReviews = [
  {
    id: "r1",
    author: "Marco T.",
    role: "Diritto del lavoro",
    text: "Ha seguito la mia causa con una chiarezza e una competenza che non mi aspettavo. Ogni passo era spiegato prima di farlo. Causa vinta in appello.",
    rating: 5,
  },
  {
    id: "r2",
    author: "Giulia M.",
    role: "Diritto di famiglia",
    text: "In un momento molto difficile ha gestito tutto con sensibilità e rigore. I figli sono stati tutelati come meritavano. Non potevo chiedere di più.",
    rating: 5,
  },
  {
    id: "r3",
    author: "Claudio F.",
    role: "Diritto commerciale",
    text: "Avevo firmato un contratto con clausole che nessuno aveva rilevato. L'avvocato Aranzulla ha trovato la soluzione in pochi giorni.",
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
            <a href="#chi-siamo">Lo studio</a>
            <a href="#come-lavoriamo">Metodologia</a>
            {tenant.features.reviews && <a href="#recensioni">Referenze</a>}
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
          <p className="ara-hero-overline">Studio Legale · Assistenza Legale</p>
          <h1 className="ara-hero-title">
            Il diritto,
            <br />
            <em>spiegato chiaro.</em>
          </h1>
          <p className="ara-hero-lead">
            Avvocato Lara Aranzulla. Assistenza legale in diritto civile, famiglia, lavoro e penale. Prima consulenza per capire dove sei e cosa puoi fare.
          </p>
          <div className="ara-hero-actions">
            <a href="#contatti" className="ara-btn ara-btn-primary">
              Richiedi una consulenza <ArrowRight size={14} />
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
        </div>
      </section>

      {/* ── Studio strip ─────────────────────────────────────── */}
      <div className="ara-strip">
        <div className="ara-container">
          <div className="ara-strip-inner">
            <div className="ara-strip-item">
              <strong>Studio Legale Aranzulla</strong>
            </div>
            <div className="ara-strip-item">
              Avv. Lara Aranzulla · Iscritta all&apos;Ordine degli Avvocati
            </div>
            <div className="ara-strip-item">
              6 aree di pratica
            </div>
            <div className="ara-strip-item">
              Prima consulenza su appuntamento
            </div>
          </div>
        </div>
      </div>

      {/* ── Aree di pratica ──────────────────────────────────── */}
      <section id="aree" className="ara-section">
        <div className="ara-container">
          <div className="ara-section-head-2col">
            <div>
              <span className="ara-label">{content.soulsIntro.eyebrow}</span>
              <h2 className="ara-section-title">
                {content.soulsIntro.titleLead}
                <br />
                <em>{content.soulsIntro.titleAccent}</em>
              </h2>
            </div>
            <p className="ara-section-body">{content.soulsIntro.body}</p>
          </div>

          <div className="ara-areas-list" role="list">
            {practiceAreas.map((area, i) => (
              <div key={area.id} className="ara-area-row" role="listitem">
                <span className="ara-area-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="ara-area-title">{area.title}</h3>
                <p className="ara-area-desc">{area.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lo studio / Chi siamo ─────────────────────────────── */}
      <section id="chi-siamo" className="ara-section ara-section-alt">
        <div className="ara-container">
          <div className="ara-team-grid">
            <div>
              <div className="ara-team-media">
                <Image
                  src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=800&q=80"
                  alt="Studio Legale Aranzulla — biblioteca"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
              <div className="ara-team-caption">
                <strong>Avv. Lara Aranzulla</strong>
                <span>Fondatrice e titolare dello studio</span>
              </div>
            </div>

            <div className="ara-team-content">
              <div>
                <span className="ara-label">Lo studio</span>
                <h2 className="ara-section-title">
                  Una professionista.
                  <br />
                  <em>Un impegno diretto.</em>
                </h2>
              </div>

              <p className="ara-team-bio">
                L&apos;Avvocato Lara Aranzulla ha fondato lo studio con un obiettivo preciso: rendere il diritto accessibile senza rinunciare alla qualità della difesa. Ogni incarico è <strong>seguito personalmente</strong>, con aggiornamenti puntuali e totale trasparenza sulle scelte strategiche.
              </p>

              <p className="ara-team-bio">
                Lo studio lavora con privati e piccole imprese. Il colloquio iniziale serve a inquadrare la situazione con chiarezza, prima di qualsiasi impegno formale.
              </p>

              <div>
                <span className="ara-label" style={{ marginBottom: 10 }}>Competenze</span>
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

      {/* ── Metodologia ──────────────────────────────────────── */}
      <section id="come-lavoriamo" className="ara-section">
        <div className="ara-container">
          <div className="ara-section-head-2col">
            <div>
              <span className="ara-label">Metodologia</span>
              <h2 className="ara-section-title">
                Come si svolge
                <br />
                <em>un incarico.</em>
              </h2>
            </div>
            <p className="ara-section-body">
              Ogni pratica segue una sequenza precisa. Il cliente sa sempre a che punto è il suo caso e perché si sta procedendo in un determinato modo.
            </p>
          </div>

          <div className="ara-method-list" role="list">
            {methodSteps.map((step) => (
              <div key={step.n} className="ara-method-row" role="listitem">
                <span className="ara-method-n">{step.n}</span>
                <div className="ara-method-text">
                  <h3 className="ara-method-title">{step.title}</h3>
                  <p className="ara-method-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Referenze (recensioni) — visibile solo se il modulo è attivo ── */}
      {tenant.features.reviews && (
        <section id="recensioni" className="ara-section ara-section-dark">
          <div className="ara-container">
            <div className="ara-section-head-2col">
              <div>
                <span className="ara-label" style={{ color: "var(--ara-gold-lt)" }}>Referenze</span>
                <h2 className="ara-section-title ara-section-title-wht">
                  Cosa dicono
                  <br />
                  <em>i clienti.</em>
                </h2>
              </div>
              <p className="ara-section-body ara-section-body-wht">
                Ogni parere è quello di chi ha affrontato una situazione concreta e ne ha visto l&apos;esito.
              </p>
            </div>

            <div className="ara-reviews-list">
              {mockReviews.map((review) => (
                <article key={review.id} className="ara-review-row">
                  <p className="ara-review-quote">&ldquo;{review.text}&rdquo;</p>
                  <div className="ara-review-meta">
                    <strong>{review.author}</strong>
                    <small>{review.role}</small>
                    <div className="ara-review-stars" aria-label={`${review.rating} stelle`}>
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} size={12} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Contatti ─────────────────────────────────────────── */}
      <section id="contatti" className="ara-section ara-section-alt">
        <div className="ara-container">
          <div className="ara-section-head-2col">
            <div>
              <span className="ara-label">{content.findUs.eyebrow}</span>
              <h2 className="ara-section-title">
                {content.findUs.titleLead}
                <br />
                <em>{content.findUs.titleAccent}</em>
              </h2>
            </div>
            <p className="ara-section-body">{content.findUs.body}</p>
          </div>

          <div className="ara-contact-layout">
            <div className="ara-contact-list">
              <a href={phoneHref} className="ara-contact-item">
                <div className="ara-contact-icon"><Phone size={16} /></div>
                <div>
                  <small>Telefono</small>
                  <span>{content.contact.phone}</span>
                </div>
              </a>

              <a href={emailHref} className="ara-contact-item">
                <div className="ara-contact-icon"><Mail size={16} /></div>
                <div>
                  <small>Email</small>
                  <span>{studioEmail}</span>
                </div>
              </a>

              {tenant.features.reservations && (
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="ara-contact-item">
                  <div className="ara-contact-icon"><MessageCircle size={16} /></div>
                  <div>
                    <small>WhatsApp</small>
                    <span>{content.contact.phone}</span>
                  </div>
                </a>
              )}

              <div className="ara-contact-item">
                <div className="ara-contact-icon"><MapPin size={16} /></div>
                <div>
                  <small>Sede</small>
                  <strong>{content.address.full}</strong>
                </div>
              </div>

              <div className="ara-contact-item">
                <div className="ara-contact-icon"><Clock size={16} /></div>
                <div>
                  <small>Ricevimento</small>
                  <strong>Lun–Ven · 9:00–13:00 / 15:00–18:00</strong>
                </div>
              </div>
            </div>

            <div>
              {formState === "sent" ? (
                <div className="ara-form ara-form-success">
                  <CheckCircle size={28} color="var(--ara-gold)" strokeWidth={1.5} />
                  <h3>Richiesta inviata.</h3>
                  <p>Riceverai una risposta entro un giorno lavorativo per fissare l&apos;appuntamento.</p>
                  <button type="button" onClick={() => setFormState("idle")} className="ara-btn ara-btn-outline">
                    Nuova richiesta
                  </button>
                </div>
              ) : (
                <form
                  className="ara-form"
                  onSubmit={(e) => { e.preventDefault(); setFormState("sent"); }}
                >
                  <h3>Richiedi una consulenza</h3>
                  <p>Compila il modulo. Risposta entro un giorno lavorativo.</p>

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
                    Situazione (facoltativo)
                    <textarea
                      rows={3}
                      placeholder="Descrivi brevemente il caso. Non includere dati sensibili in questa fase."
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
              <a href="#chi-siamo">Lo studio</a>
              <a href="#come-lavoriamo">Metodologia</a>
              {tenant.features.reviews && <a href="#recensioni">Referenze</a>}
            </div>

            <div className="ara-footer-col">
              <h4>Contatti</h4>
              <a href={phoneHref}>{content.contact.phone}</a>
              <a href={emailHref}>{studioEmail}</a>
              {tenant.features.reservations && (
                <a href={waHref} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              )}
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
