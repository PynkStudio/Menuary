"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Instagram, Mail, Music2, Send } from "lucide-react";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import { ValentinaOrciuoliHeader } from "@/components/tenants/valentina-orciuoli/vo-header";
import { TenantLinktreeView, type TenantLinktreeItem } from "@/components/modules/linktree/linktree-view";
import {
  amazonHref,
  instagramHref,
  tiktokHref,
  valentinaEmail,
  valentinaLinks,
  linktreeHref,
  valentinaBasePath,
  valentinaCreativeWorks,
  type ValentinaCreativeWork,
} from "@/components/tenants/valentina-orciuoli/content";

type ValentinaPageKind = "libri" | "autrice" | "eventi" | "contatti" | "link";

export function ValentinaOrciuoliStaticPage({ page }: { page: ValentinaPageKind }) {
  const gestioneHref = getTenantGestioneExternalHref("valentina-orciuoli");
  const [linktreeItems, setLinktreeItems] = useState<TenantLinktreeItem[]>(
    () => valentinaLinks.map((item) => ({
      label: item.label,
      href: item.href,
      description: item.desc,
      kind: item.kind,
    })),
  );
  const [creativeWorks, setCreativeWorks] = useState<ValentinaCreativeWork[]>(valentinaCreativeWorks);

  useEffect(() => {
    if (page !== "link") return;
    let alive = true;
    fetch("/api/tenant/valentina-orciuoli/linktree")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.links) && data.links.length) setLinktreeItems(data.links);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [page]);

  useEffect(() => {
    if (page !== "libri") return;
    let alive = true;
    fetch("/api/tenant/valentina-orciuoli/creative-works")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.works) && data.works.length) setCreativeWorks(data.works);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [page]);

  return (
    <main className="vo-site">
      {page !== "link" && (
        <>
        <ValentinaOrciuoliHeader />
        <section className="vo-subpage-intro vo-subpage-intro-plain">
          <span className="vo-dragon-mark">{pageEyebrows[page]}</span>
          {pageTitles[page] && (
            <h1 className={page === "libri" ? "vo-subpage-title-compact" : undefined}>{pageTitles[page]}</h1>
          )}
          {pageLeads[page] &&
            pageLeads[page].split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
        </section>
        </>
      )}

      {page === "libri" && (
        <>
          {creativeWorks.filter((work) => work.enabled).map((work, index) => {
            const tone = index % 3 === 0 ? "anxiety" : index % 3 === 1 ? "fury" : "dark";
            const isVideo = /\.(mp4|webm)(\?|$)/i.test(work.backgroundMediaUrl);
            return (
              <section
                id={work.slug}
                className={`vo-book-feature-section vo-book-feature-section-${tone} vo-subpage-section`}
                key={work.id}
              >
                {work.backgroundMediaUrl && (
                  isVideo ? (
                    <video
                      className="vo-book-feature-video"
                      src={work.backgroundMediaUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      aria-hidden="true"
                    />
                  ) : (
                    <img className="vo-book-feature-video" src={work.backgroundMediaUrl} alt="" aria-hidden="true" />
                  )
                )}
                <div className={`vo-book-feature-panel vo-book-feature-panel-${tone}`}>
                  {work.coverImageUrl && (
                    <img className="vo-book-feature-cover" src={work.coverImageUrl} alt={`Copertina di ${work.title}`} />
                  )}
                  <div className="vo-book-feature-copy">
                    <h2>{work.title}</h2>
                    {work.description && <p>{work.description}</p>}
                    {work.secondaryText && <p>{work.secondaryText}</p>}
                    {work.ctaHref && (
                      <a
                        className="vo-book-feature-cta"
                        href={work.ctaHref}
                        target={work.ctaHref.startsWith("http") ? "_blank" : undefined}
                        rel={work.ctaHref.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {work.ctaLabel} <ArrowRight size={15} />
                      </a>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </>
      )}

      {page === "autrice" && (
        <section className="vo-section vo-author-section vo-author-section-full vo-subpage-section">
          <div className="vo-author-copy vo-author-copy-long">
            <span className="vo-dragon-mark">Profilo</span>
            <h2>Tra magia e sentimento</h2>
            <p>
              Valentina costruisce mondi in cui l&apos;emozione non resta sottotraccia: diventa creatura,
              scelta, ferita e potere. Il suo immaginario parte dal fantasy orientale e incontra il romance,
              con protagonisti chiamati a dare un nome a cio che li attraversa.
            </p>
            <p>
              Dopo la laurea in Relazioni Internazionali e gli studi in Comunicazione e Marketing, porta nella
              scrittura uno sguardo attento ai legami, ai conflitti interiori e alla forza simbolica delle storie.
            </p>
            <div className="vo-author-pillars">
              <article>
                <span>01</span>
                <strong>Fantasy orientale</strong>
                <p>Draghi, corti imperiali, magia e atmosfere luminose ma taglienti.</p>
              </article>
              <article>
                <span>02</span>
                <strong>Romantasy emotivo</strong>
                <p>Relazioni intense, introspezione e sentimenti che diventano destino narrativo.</p>
              </article>
              <article>
                <span>03</span>
                <strong>Nuove ombre</strong>
                <p>Con Tra fumo e ombre apre anche una venatura dark-noir, piu urbana e psicologica.</p>
              </article>
            </div>
            <Link className="vo-text-link" href={`${valentinaBasePath}/libri`}>
              Scopri i libri <ArrowRight size={15} />
            </Link>
          </div>
          <div className="vo-author-seal">
            <img src="/valentina-orciuoli/valentina-autrice.webp" alt="Valentina Orciuoli" />
            <p>Author · Romantasy · Dark-noir</p>
          </div>
        </section>
      )}

      {page === "eventi" && (
        <section className="vo-section vo-events-section vo-subpage-section">
          <div className="vo-event-list" aria-label="Eventi in programma">
            <article>
              <span>In aggiornamento</span>
              <h3>Nuove date in arrivo</h3>
              <p>
                Presentazioni, firmacopie e incontri con i lettori verranno pubblicati qui appena confermati.
                Per inviti, festival e collaborazioni editoriali puoi contattare Valentina{" "}
                <Link href={`${valentinaBasePath}/contatti`}>qui</Link>.
              </p>
            </article>
          </div>
        </section>
      )}

      {page === "contatti" && (
        <section className="vo-section vo-contact-section vo-subpage-section">
          <div>
            <span className="vo-dragon-mark">Contatti</span>
            <h2>Scrivi a Valentina</h2>
            <p>Per richieste editoriali, presentazioni, collaborazioni o messaggi legati ai libri puoi usare il form oppure i canali ufficiali.</p>
            <div className="vo-contact-visible">
              <a href={instagramHref} target="_blank" rel="noopener noreferrer">
                <Instagram size={17} /> Instagram
              </a>
              <a href={tiktokHref} target="_blank" rel="noopener noreferrer">
                <Music2 size={17} /> TikTok
              </a>
              <a href={`mailto:${valentinaEmail}`}>
                <Mail size={17} /> {valentinaEmail}
              </a>
            </div>
          </div>
          <ValentinaContactForm />
        </section>
      )}

      {page === "link" && (
        <section className="vo-linktree-section vo-subpage-section">
          <div className="vo-linktree-card">
            <img src="/valentina-orciuoli/logo.png" alt="" aria-hidden="true" />
            <span className="vo-dragon-mark">Link ufficiali</span>
            <h2>Valentina Orciuoli</h2>
            <p>Libri, social, contatti ed eventi dell&apos;autrice.</p>
            <TenantLinktreeView items={linktreeItems} className="vo-linktree-list" />
          </div>
        </section>
      )}

      {page !== "link" && (
      <footer id="contatti" className="vo-footer">
        <div>
          <strong>Valentina Orciuoli</strong>
          <p>Author site ufficiale · fantasy, draghi ed emozioni.</p>
        </div>
        <div className="vo-footer-links">
          <a href={instagramHref} target="_blank" rel="noopener noreferrer">
            <Instagram size={15} /> Instagram
          </a>
          <a href={amazonHref} target="_blank" rel="noopener noreferrer">
            Amazon <ExternalLink size={14} />
          </a>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/cookie">Cookie Policy</Link>
          <a className="vo-footer-staff-link" href={gestioneHref} target="_blank" rel="noopener noreferrer">
            Gestione
          </a>
        </div>
      </footer>
      )}
    </main>
  );
}

function ValentinaContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setStatus("sending");
    setError(null);
    const res = await fetch("/api/tenant/valentina-orciuoli/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        subject: formData.get("subject"),
        message: formData.get("message"),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setError(data.error ?? "Non sono riuscito a inviare il messaggio.");
      return;
    }
    form.reset();
    setStatus("sent");
  }

  return (
    <form className="vo-contact-form" onSubmit={handleSubmit}>
      <label>
        Nome
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Oggetto
        <input name="subject" />
      </label>
      <label>
        Messaggio
        <textarea name="message" required rows={6} />
      </label>
      <button type="submit" disabled={status === "sending"}>
        <Send size={16} /> {status === "sending" ? "Invio..." : "Invia messaggio"}
      </button>
      {status === "sent" && <small>Messaggio inviato. Ti risponderemo via email.</small>}
      {status === "error" && <small>{error}</small>}
    </form>
  );
}

const pageTitles: Record<ValentinaPageKind, string> = {
  libri: "Valentina Orciuoli",
  autrice: "Scopri chi è",
  eventi: "",
  contatti: "Contatti",
  link: "Link",
};

const pageEyebrows: Record<ValentinaPageKind, string> = {
  libri: "Scopri i libri di",
  autrice: "Autrice",
  eventi: "Eventi",
  contatti: "Valentina Orciuoli",
  link: "Valentina Orciuoli",
};

const pageLeads: Record<ValentinaPageKind, string> = {
  libri:
    "sei più da fantasy orientale, dove ogni emozione ha il suo drago oppure sei più da noir meneghino, dove il mistero ed il thriller ne dettano il ritmo?",
  autrice:
    "Valentina Orciuoli è un’autrice italiana di fantasy romance e romantasy. Laureata in Relazioni Internazionali e studentessa di Comunicazione e Marketing, coltiva da sempre una grande passione per le storie fantastiche, i mondi popolati da draghi e magia, e le trame romance capaci di intrecciare emozioni intense e avventura.\n\nCon Anxiety, primo volume della saga The Emotion Dragons Trilogy, dà vita a un universo narrativo in cui sentimenti, potere e destino si incontrano. Fury, secondo capitolo della trilogia, amplia questo mondo raccontandone nuove sfumature e radici.\n\nAttraverso la sua scrittura, Valentina unisce immaginazione, introspezione e romanticismo, accompagnando i lettori in viaggi dove le emozioni diventano forza, conflitto e magia.",
  eventi: "",
  contatti: "Form diretto, Instagram e email ufficiale.",
  link: "Un unico posto, brandizzato Valentina Orciuoli, per raggiungere libri, social e aggiornamenti.",
};
