"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Car,
  Check,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Microscope,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { getTenantContent } from "@/lib/tenant-content";
import { officinaKamMenu } from "@/lib/tenant-menu-data";
import { getGoogleRatingForTenant, getReviewsForTenant } from "@/lib/reviews-data";
import { formatNumberIT } from "@/lib/format";
import {
  VenueAddressBlock,
  VenueHoursList,
  VenuePhoneDisplay,
  VenueWhatsappLink,
  useVenueContactPhone,
} from "@/components/modules/reservations/venue-display";

const stages = [
  {
    code: "DGN-INIT",
    label: "00 / Vista totale",
    title: "Ogni moto.\nOgni parte.\nOgni dettaglio.",
    body: "La diagnosi parte da una vista d'insieme: freni, gomme, elettronica, trasmissione e punti critici vengono controllati prima del preventivo.",
    metric: "200+",
    caption: "punti di controllo",
  },
  {
    code: "M-FREN",
    label: "01 / Impianto frenante",
    title: "Freni.",
    body: "Pastiglie, dischi, liquido e usura asimmetrica. Ti diciamo cosa serve davvero prima di ordinare i ricambi.",
    metric: "DOT4",
    caption: "liquido verificato",
  },
  {
    code: "M-TAGL",
    label: "02 / Motore",
    title: "Motore.",
    body: "Olio, filtri, candele e serraggi. Lavoro pulito, ricambi tracciati, foto dell'intervento su richiesta.",
    metric: "Nm",
    caption: "serraggio controllato",
  },
  {
    code: "D-OBD",
    label: "03 / Diagnostica elettronica",
    title: "Elettronica.",
    body: "Lettura centraline, service reset e diagnosi multimarca. Il problema viene isolato prima di smontare.",
    metric: "30'",
    caption: "diagnosi orientativa",
  },
];

const extras = [
  { name: "Ritiro a domicilio", desc: "Organizzato su appuntamento", price: "Da preventivo" },
  { name: "Veicolo sostitutivo", desc: "Per interventi superiori a un giorno", price: "Su richiesta" },
  { name: "Lavaggio finale", desc: "Interno + esterno a fine lavoro", price: "Da €18" },
  { name: "Garanzia estesa", desc: "Su ricambi selezionati", price: "+15%" },
];

const processSteps = [
  {
    n: "01",
    title: "Prenoti",
    desc: "Ci scrivi veicolo, targa e sintomi. Ti proponiamo lo slot più adatto.",
  },
  {
    n: "02",
    title: "Diagnosi",
    desc: "Controllo visivo e strumentale, con priorità a sicurezza e cause reali.",
  },
  {
    n: "03",
    title: "Preventivo",
    desc: "Ricambi, manodopera e tempi vengono confermati prima di procedere.",
  },
  {
    n: "04",
    title: "Consegna",
    desc: "Lavoro completato, prova finale e riepilogo di quello che è stato fatto.",
  },
];

function priceText(item: { price: { kind: string; value?: number } }) {
  if (item.price.kind === "single" && typeof item.price.value === "number") {
    return item.price.value === 0 ? "Gratuito" : `da €${item.price.value}`;
  }
  return "Da preventivo";
}

export function OfficinaKamHomePage() {
  const tenant = useTenant();
  const content = getTenantContent(tenant.id);
  const { display: phoneDisplay, waHref } = useVenueContactPhone();
  const [activeGroup, setActiveGroup] = useState(0);
  const [stage, setStage] = useState(0);
  const [requestSent, setRequestSent] = useState(false);

  const menuGroups = useMemo(() => officinaKamMenu, []);
  const currentGroup = menuGroups[activeGroup] ?? menuGroups[0];
  const tenantGoogleRating = getGoogleRatingForTenant(tenant.id);
  const reviewSample = getReviewsForTenant(tenant.id).slice(0, 3);

  return (
    <main className="kam-site">
      <nav className="kam-nav">
        <div className="kam-container kam-nav-row">
          <a href="#top" className="kam-logo" aria-label="Torna all'inizio">
            <span className="kam-logo-mark">K</span>
            <span>
              Officina KAM
              <small>EST. 2026 · MILANO</small>
            </span>
          </a>
          <div className="kam-nav-links">
            <a href="#servizi">Servizi</a>
            <a href="#listino">Listino</a>
            <a href="#processo">Processo</a>
            <a href="#recensioni">Recensioni</a>
            <a href="#contatti">Contatti</a>
          </div>
          <VenueWhatsappLink className="kam-btn kam-btn-primary">
            Prenota <CalendarDays size={15} />
          </VenueWhatsappLink>
        </div>
      </nav>

      <section id="top" className="kam-showroom">
        <div className="kam-grid-bg" />
        <div className="kam-showroom-media">
          <div className="kam-bike-frame">
            <Image
              src={content.hero.backdrop}
              alt="Moto in officina Officina KAM"
              fill
              priority
              sizes="(max-width: 768px) 94vw, 1100px"
              className="kam-bike-image"
            />
            <div className="kam-frame-corners" />
          </div>
        </div>

        <div className="kam-container kam-hud">
          <div className="kam-hud-left">
            <span className="kam-eyebrow">{content.hero.eyebrow}</span>
            <h1>
              Meccanica
              <span>di precisione.</span>
            </h1>
            <p>{content.hero.body}</p>
            <div className="kam-hero-actions">
              <VenueWhatsappLink className="kam-btn kam-btn-primary">
                {content.hero.ctaLabel} <ArrowRight size={16} />
              </VenueWhatsappLink>
              <a className="kam-btn kam-btn-ghost" href="#listino">
                Vedi listino <ChevronRight size={16} />
              </a>
            </div>
          </div>

          <aside className="kam-hud-card" aria-label="Diagnostica in evidenza">
            <div className="kam-hud-code">{stages[stage].label}</div>
            <h2>{stages[stage].title}</h2>
            <p>{stages[stage].body}</p>
            <div className="kam-stage-tabs">
              {stages.map((item, index) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setStage(index)}
                  className={index === stage ? "is-active" : ""}
                  aria-label={item.label}
                >
                  {String(index).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="kam-hud-metric">
              <strong>{stages[stage].metric}</strong>
              <span>{stages[stage].caption}</span>
              <em>{stages[stage].code}</em>
            </div>
          </aside>
        </div>
      </section>

      <section className="kam-stats" aria-label="Indicatori Officina KAM">
        <div className="kam-container kam-stats-grid">
          {[
            ["20+", "anni di esperienza tecnica"],
            [tenantGoogleRating.average.toFixed(1).replace(".", ","), `${formatNumberIT(tenantGoogleRating.count)} recensioni`],
            ["200+", "controlli tecnici al mese"],
            ["48h", "tempo medio intervento"],
          ].map(([value, label]) => (
            <div key={label} className="kam-stat">
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="servizi" className="kam-section">
        <div className="kam-container">
          <div className="kam-section-head kam-two-col">
            <div>
              <span className="kam-eyebrow">{content.soulsIntro.eyebrow}</span>
              <h2>
                {content.soulsIntro.titleLead}
                <span>{content.soulsIntro.titleAccent}</span>
              </h2>
              <p>{content.soulsIntro.body}</p>
            </div>
            <div className="kam-big-number">03</div>
          </div>

          <div className="kam-category-grid">
            {content.souls.map((item, index) => {
              const Icon = item.id === "auto" ? Car : item.id === "diagnostica" ? Microscope : Wrench;
              return (
                <a key={item.id} href="#listino" className="kam-category-card">
                  <span className="kam-card-code">{String(index + 1).padStart(2, "0")} - {item.kicker}</span>
                  <span className="kam-icon-box"><Icon size={38} /></span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                  <span className="kam-card-link">Scopri il listino <ArrowRight size={15} /></span>
                  <em>{String(index + 1).padStart(2, "0")}</em>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section id="listino" className="kam-section kam-section-raised">
        <div className="kam-container">
          <div className="kam-section-head kam-listino-head">
            <div>
              <span className="kam-eyebrow">Listino servizi · modulo menu</span>
              <h2>Quello che facciamo più spesso.</h2>
              <p>Prezzi indicativi IVA inclusa. Il preventivo finale dipende dal veicolo, dai ricambi e dalla diagnosi.</p>
            </div>
            <div className="kam-segmented">
              {menuGroups.map((group, index) => (
                <button
                  type="button"
                  key={group.id}
                  className={index === activeGroup ? "is-active" : ""}
                  onClick={() => setActiveGroup(index)}
                >
                  {group.title}
                </button>
              ))}
            </div>
          </div>

          <div className="kam-price-table">
            <div className="kam-price-header">
              <span>Codice</span>
              <span>Intervento</span>
              <span>Dettaglio</span>
              <span>Prezzo IVA inc.</span>
            </div>
            {currentGroup.items.map((item) => (
              <div key={item.id} className="kam-price-row">
                <span>{item.id.toUpperCase().slice(0, 8)}</span>
                <strong>{item.name}</strong>
                <p>{item.description}</p>
                <em>{priceText(item)}</em>
              </div>
            ))}
          </div>

          <div className="kam-extra-grid">
            {extras.map((item) => (
              <article key={item.name}>
                <div>
                  <h3>{item.name}</h3>
                  <strong>{item.price}</strong>
                </div>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="processo" className="kam-section">
        <div className="kam-container">
          <div className="kam-section-head kam-two-col">
            <div>
              <span className="kam-eyebrow">Come lavoriamo</span>
              <h2>
                Niente sorprese,
                <span>niente attese.</span>
              </h2>
            </div>
            <p>
              Ogni intervento segue una sequenza chiara: accettazione, diagnosi,
              preventivo, approvazione e consegna. Nessun lavoro extra parte senza conferma.
            </p>
          </div>
          <div className="kam-process-grid">
            {processSteps.map((step) => (
              <article key={step.n}>
                <span>{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="recensioni" className="kam-section kam-section-raised">
        <div className="kam-container">
          <div className="kam-section-head kam-two-col">
            <div>
              <span className="kam-eyebrow">Recensioni · modulo Google</span>
              <h2>
                I veicoli tornano.
                <span>I clienti pure.</span>
              </h2>
            </div>
            <a href={tenantGoogleRating.profileUrl} target="_blank" rel="noopener noreferrer" className="kam-google-card">
              <span>G</span>
              <div>
                <strong>{tenantGoogleRating.average.toFixed(1).replace(".", ",")}</strong>
                <p>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={15} fill="currentColor" />
                  ))}
                  {formatNumberIT(tenantGoogleRating.count)} recensioni
                </p>
              </div>
            </a>
          </div>
          <div className="kam-review-grid">
            {reviewSample.map((review) => (
              <article key={review.id} className="kam-review-card">
                <div>
                  <span>{review.author.slice(0, 1)}</span>
                  <div>
                    <strong>{review.author}</strong>
                    <small>{review.date}</small>
                  </div>
                </div>
                <p>{review.text}</p>
                <footer>
                  <span>{review.rating}.0</span>
                  <span>{review.isLocalGuide ? "Local Guide" : "Cliente verificato"}</span>
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="prenota" className="kam-section">
        <div className="kam-container kam-booking-grid">
          <div>
            <span className="kam-eyebrow">Modulo appuntamenti</span>
            <h2>
              Lascia il veicolo
              <span>in 2 minuti.</span>
            </h2>
            <p>
              Il modulo prepara la richiesta per il gestionale: veicolo, intervento,
              preferenza temporale e contatto. In produzione può agganciarsi al motore prenotazioni.
            </p>
            <div className="kam-contact-stack">
              <VenueWhatsappLink className="kam-contact-tile kam-contact-whatsapp">
                <MessageCircle size={20} />
                <span>
                  <small>WhatsApp · risposta rapida</small>
                  {phoneDisplay}
                </span>
              </VenueWhatsappLink>
              <a className="kam-contact-tile" href={`tel:${phoneDisplay.replace(/\s/g, "")}`}>
                <Phone size={20} />
                <span>
                  <small>Telefono</small>
                  {phoneDisplay}
                </span>
              </a>
            </div>
          </div>

          <form
            className="kam-form"
            onSubmit={(event) => {
              event.preventDefault();
              setRequestSent(true);
            }}
          >
            {requestSent ? (
              <div className="kam-form-success">
                <Check size={30} />
                <h3>Richiesta ricevuta.</h3>
                <p>Ti ricontattiamo al numero indicato per confermare disponibilità e preventivo.</p>
                <button type="button" onClick={() => setRequestSent(false)} className="kam-btn kam-btn-ghost">
                  Nuova richiesta
                </button>
              </div>
            ) : (
              <>
                <div className="kam-form-grid">
                  <label>
                    <span>Tipo veicolo</span>
                    <select defaultValue="moto">
                      <option value="moto">Moto</option>
                      <option value="auto">Auto</option>
                      <option value="diagnostica">Diagnostica</option>
                    </select>
                  </label>
                  <label>
                    <span>Intervento</span>
                    <input placeholder="Tagliando, freni, spia..." />
                  </label>
                </div>
                <label>
                  <span>Marca, modello e targa</span>
                  <input placeholder="es. Ducati Monster 1200 · AB123CD" />
                </label>
                <div className="kam-form-grid">
                  <label>
                    <span>Quando</span>
                    <select defaultValue="settimana">
                      <option value="settimana">Questa settimana</option>
                      <option value="prossima">Settimana prossima</option>
                      <option value="non-urgente">Non urgente</option>
                    </select>
                  </label>
                  <label>
                    <span>Telefono / WhatsApp</span>
                    <input placeholder="+39 ..." />
                  </label>
                </div>
                <label>
                  <span>Note</span>
                  <textarea rows={3} placeholder="Sintomi, rumori, lavori già fatti..." />
                </label>
                <button type="submit" className="kam-btn kam-btn-primary">
                  Invia richiesta <ArrowRight size={16} />
                </button>
              </>
            )}
          </form>
        </div>
      </section>

      <section id="contatti" className="kam-section kam-section-contact">
        <div className="kam-container">
          <div className="kam-section-head">
            <span className="kam-eyebrow">Dettaglio officina</span>
            <h2>
              Orari, indirizzo
              <span>e contatti.</span>
            </h2>
          </div>
          <div className="kam-contact-grid">
            <div className="kam-detail-list">
              <a href={content.maps.searchUrl} target="_blank" rel="noopener noreferrer">
                <MapPin size={20} />
                <span>
                  <small>Indirizzo</small>
                  <VenueAddressBlock multiline={false} />
                </span>
              </a>
              <VenuePhoneDisplay className="kam-detail-link" />
              <a href={`mailto:info@${content.url.replace(/https?:\/\/(www\.)?/, "")}`}>
                <Mail size={20} />
                <span>
                  <small>Email</small>
                  info@{content.url.replace(/https?:\/\/(www\.)?/, "")}
                </span>
              </a>
              <div>
                <Clock size={20} />
                <span>
                  <small>Orari</small>
                  <VenueHoursList variant="find-us" />
                </span>
              </div>
              <div>
                <ShieldCheck size={20} />
                <span>
                  <small>Garanzia</small>
                  12 mesi sulla manodopera concordata
                </span>
              </div>
            </div>
            <iframe
              title={content.findUs.mapTitle}
              src={content.maps.embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <footer className="kam-footer">
            <p>{tenant.name} · {content.footer.tagline}</p>
            <a href={waHref()} target="_blank" rel="noopener noreferrer">Prenota su WhatsApp</a>
          </footer>
        </div>
      </section>
    </main>
  );
}
