"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useMenuStore, selectCategoriesOrdered, selectItemsByCategory } from "@/store/menu-store";
import { useSupabaseMenuSync } from "@/lib/menu-sync-client";
import { getGoogleRatingForTenant, getReviewsForTenant } from "@/lib/reviews-data";
import { formatNumberIT } from "@/lib/format";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import {
  VenueAddressBlock,
  VenueGoogleMapsLink,
  VenueHoursList,
  VenueMapFrame,
  VenuePhoneDisplay,
  VenueWhatsappLink,
  useVenueContactPhone,
} from "@/components/modules/reservations/venue-display";

const stages = [
  {
    code: "Panoramica",
    label: "00 / Vista totale",
    subtitle: "Ispezione completa",
    title: "Ogni moto.\nOgni parte.\nOgni dettaglio.",
    body: "La diagnosi parte da una vista d'insieme: freni, gomme, elettronica, trasmissione e punti critici vengono controllati prima del preventivo.",
    focal: { x: 0.5, y: 0.5, scale: 1 },
    metric: "200+",
    caption: "punti di controllo",
  },
  {
    code: "Freni",
    label: "01 / Impianto frenante",
    subtitle: "Anteriore + posteriore",
    title: "Freni.",
    body: "Pastiglie, dischi, liquido e usura asimmetrica. Ti diciamo cosa serve davvero prima di ordinare i ricambi.",
    focal: { x: 0.22, y: 0.72, scale: 2.4 },
    metric: "DOT4",
    caption: "liquido verificato",
  },
  {
    code: "Motore",
    label: "02 / Motore",
    subtitle: "Tagliando completo",
    title: "Motore.",
    body: "Olio, filtri, candele e serraggi. Lavoro pulito, ricambi tracciati, foto dell'intervento su richiesta.",
    focal: { x: 0.48, y: 0.58, scale: 2.1 },
    metric: "Nm",
    caption: "serraggio controllato",
  },
  {
    code: "Sospensioni",
    label: "03 / Sospensioni",
    subtitle: "Forcelle + mono",
    title: "Sospensioni.",
    body: "Revisione forcelle e mono, paraoli, raschia-polvere e taratura. La ciclistica viene controllata con il peso reale del pilota.",
    focal: { x: 0.26, y: 0.32, scale: 2.3 },
    metric: "Setup",
    caption: "geometria + taratura",
  },
  {
    code: "Centralina",
    label: "04 / Diagnostica elettronica",
    subtitle: "OBD + centraline",
    title: "Elettronica.",
    body: "Lettura centraline, service reset e diagnosi multimarca. Il problema viene isolato prima di smontare.",
    focal: { x: 0.66, y: 0.46, scale: 2.4 },
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

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function getShowroomState(progress: number) {
  const segment = 1 / (stages.length - 1);
  const rawIndex = clamp(progress) / segment;
  const fromIndex = Math.min(stages.length - 2, Math.floor(rawIndex));
  const local = clamp(rawIndex - fromIndex);
  const eased = easeInOutCubic(local);
  const from = stages[fromIndex];
  const to = stages[Math.min(stages.length - 1, fromIndex + 1)];
  const interpolate = (a: number, b: number) => a + (b - a) * eased;
  const x = interpolate(from.focal.x, to.focal.x);
  const y = interpolate(from.focal.y, to.focal.y);
  const scale = interpolate(from.focal.scale, to.focal.scale);
  const index = eased > 0.5 ? Math.min(stages.length - 1, fromIndex + 1) : fromIndex;

  return {
    index,
    progress,
    scale,
    tx: (0.5 - x) * 100,
    ty: (0.5 - y) * 100,
  };
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}) {
  return (
    <div className="kam-footer-column">
      <h3>{title}</h3>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target={link.external ? "_blank" : undefined}
          rel={link.external ? "noopener noreferrer" : undefined}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function OfficinaKamHomePage() {
  const tenant = useTenant();
  const syncStatus = useSupabaseMenuSync(tenant.id).status;
  const content = getTenantContent(tenant.id);
  const staffHref = getTenantGestioneExternalHref(tenant.id);
  const { display: phoneDisplay, waHref } = useVenueContactPhone();
  const [activeGroup, setActiveGroup] = useState(0);
  const [requestSent, setRequestSent] = useState(false);
  const showroomRef = useRef<HTMLElement | null>(null);
  const bikeRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const scrollCueRef = useRef<HTMLDivElement | null>(null);
  const [stageIndex, setStageIndex] = useState(0);

  const categoriesRaw = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);
  const currentTenantId = useMenuStore((s) => s.currentTenantId);
  const menuGroups = useMemo(
    () =>
      currentTenantId !== tenant.id || syncStatus === "loading"
        ? []
        :
      selectCategoriesOrdered({ categories: categoriesRaw } as never).map((category) => ({
        id: category.id,
        title: category.title,
        subtitle: category.subtitle,
        description: category.description,
        items: selectItemsByCategory(items, category.id, true),
      })),
    [categoriesRaw, currentTenantId, items, syncStatus, tenant.id],
  );
  const currentGroup = menuGroups[activeGroup] ?? menuGroups[0];
  const tenantGoogleRating = getGoogleRatingForTenant(tenant.id);
  const reviewSample = getReviewsForTenant(tenant.id).slice(0, 3);
  const currentStage = stages[stageIndex] ?? stages[0];

  useEffect(() => {
    let frame = 0;
    let lastIndex = -1;

    const update = () => {
      frame = 0;
      const el = showroomRef.current;
      const bike = bikeRef.current;
      const bar = progressBarRef.current;
      const sticky = stickyRef.current;
      if (!el || !bike || !bar || !sticky) return;
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const progress = clamp((scrollTop - el.offsetTop) / scrollable);
      const s = getShowroomState(progress);

      bike.style.transform = `scale(${s.scale}) translate3d(${s.tx}%, ${s.ty}%, 0)`;
      bar.style.width = `${progress * 100}%`;
      const cue = scrollCueRef.current;
      if (cue) cue.style.opacity = progress < 0.05 ? "1" : "0";
      if (progress >= 1) {
        sticky.style.position = "absolute";
        sticky.style.top = "auto";
        sticky.style.bottom = "0";
      } else {
        sticky.style.position = "fixed";
        sticky.style.top = "0";
        sticky.style.bottom = "auto";
      }

      if (s.index !== lastIndex) {
        lastIndex = s.index;
        setStageIndex(s.index);
      }
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  const jumpToStage = (index: number) => {
    const el = showroomRef.current;
    if (!el) return;
    const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: el.offsetTop + scrollable * (index / (stages.length - 1)),
      behavior: "smooth",
    });
  };

  if (!currentGroup) {
    return <main className="kam-site" />;
  }

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

      <section id="top" ref={showroomRef} className="kam-showroom">
        <div
          ref={stickyRef}
          className="kam-showroom-sticky"
          style={{ position: "fixed", top: 0 }}
        >
          <div
            ref={progressBarRef}
            className="kam-scroll-progress-top"
            aria-hidden="true"
            style={{ width: "0%" }}
          />
          <div className="kam-grid-bg" />
          <div className="kam-showroom-vignette" />
          <div className="kam-showroom-media">
            <div
              ref={bikeRef}
              className="kam-bike-frame"
              style={{ transform: "scale(1) translate3d(0%, 0%, 0)" }}
            >
              <Image
                src={content.hero.backdrop}
                alt="Moto in officina Officina KAM"
                fill
                priority
                sizes="(max-width: 768px) 94vw, 1400px"
                className="kam-bike-image"
              />
              <div className="kam-hotspots" aria-hidden="true">
                {stages.slice(1).map((item, index) => {
                  const realIndex = index + 1;
                  return (
                    <span
                      key={item.code}
                      className={stageIndex === realIndex ? "is-active" : ""}
                      style={{
                        left: `${item.focal.x * 100}%`,
                        top: `${item.focal.y * 100}%`,
                      }}
                    >
                      <em>{item.code}</em>
                    </span>
                  );
                })}
              </div>
              <div className="kam-frame-corners" />
            </div>
          </div>

          <div className="kam-hud-topbar" aria-hidden="true">
            <div className="kam-hud-chip">
              <small>Sessione</small>
              <strong>{currentStage.code}</strong>
            </div>
            <div className="kam-hud-chip kam-hud-chip-right">
              <small>Operazione</small>
              <strong>{currentStage.subtitle}</strong>
            </div>
          </div>

          <div
            ref={scrollCueRef}
            className="kam-scroll-cue"
            aria-hidden="true"
          >
            ↓ Scorri per ispezionare
          </div>

          <div className="kam-container kam-hud">
            <div className="kam-hud-left">
              <span className="kam-eyebrow">{currentStage.label}</span>
              <h1 className="kam-stage-title">{currentStage.title}</h1>
              <p>{currentStage.body}</p>
              <div className="kam-hero-actions">
                <VenueWhatsappLink className="kam-btn kam-btn-primary">
                  {content.hero.ctaLabel} <ArrowRight size={16} />
                </VenueWhatsappLink>
                <a className="kam-btn kam-btn-ghost" href="#listino">
                  Vedi listino <ChevronRight size={16} />
                </a>
              </div>
            </div>

            <aside className="kam-hud-right" aria-label="Diagnostica in evidenza">
              <div className="kam-stage-counter">
                <strong>{String(stageIndex + 1).padStart(2, "0")}</strong>
                <span>/ {String(stages.length).padStart(2, "0")}</span>
              </div>

              <div className="kam-stage-dots">
                {stages.map((item, index) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => jumpToStage(index)}
                    className={
                      index === stageIndex
                        ? "is-active"
                        : index < stageIndex
                          ? "is-done"
                          : ""
                    }
                    aria-label={item.label}
                  />
                ))}
              </div>

              <div className="kam-hud-metric">
                <strong>{currentStage.metric}</strong>
                <span>{currentStage.caption}</span>
              </div>
            </aside>
          </div>
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
              <VenueGoogleMapsLink>
                <MapPin size={20} />
                <span>
                  <small>Indirizzo</small>
                  <VenueAddressBlock multiline={false} />
                </span>
              </VenueGoogleMapsLink>
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
            <VenueMapFrame
              title={content.findUs.mapTitle}
              dark
            />
          </div>
          <footer className="kam-footer">
            <div className="kam-footer-brand">
              <a href="#top" className="kam-logo" aria-label="Torna all'inizio">
                <span className="kam-logo-mark">K</span>
                <span>
                  Officina KAM
                  <small>MECCANICA · DIAGNOSI · PERFORMANCE</small>
                </span>
              </a>
              <p>{content.footer.body}</p>
              <div className="kam-footer-actions">
                <a href={waHref()} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                <a href={content.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                <a href={staffHref} target="_blank" rel="noopener noreferrer">Staff</a>
              </div>
            </div>
            <FooterColumn
              title="Officina"
              links={[
                { label: "Servizi", href: "#servizi" },
                { label: "Listino prezzi", href: "#listino" },
                { label: "Processo", href: "#processo" },
                { label: "Recensioni", href: "#recensioni" },
              ]}
            />
            <FooterColumn
              title="Gestione"
              links={[
                { label: "Staff", href: staffHref, external: true },
                { label: "Prenota intervento", href: "#prenota" },
                { label: "Orari e indirizzo", href: "#contatti" },
                { label: "Privacy", href: "/privacy" },
              ]}
            />
            <div className="kam-footer-column kam-footer-contact">
              <h3>Contatti</h3>
              <span><VenueAddressBlock multiline={false} /></span>
              <a href={`tel:${phoneDisplay.replace(/\s/g, "")}`}>{phoneDisplay}</a>
              <a href={`mailto:info@${content.url.replace(/https?:\/\/(www\.)?/, "")}`}>
                info@{content.url.replace(/https?:\/\/(www\.)?/, "")}
              </a>
              <small>P.IVA 00000000000</small>
            </div>
            <div className="kam-footer-bottom">
              <span>{tenant.name} · {content.footer.tagline}</span>
              <a href="https://bizery.it" target="_blank" rel="noopener noreferrer">Powered by Bizery</a>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
