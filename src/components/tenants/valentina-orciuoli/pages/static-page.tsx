"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, ExternalLink, Instagram } from "lucide-react";
import { ValentinaOrciuoliHeader } from "@/components/tenants/valentina-orciuoli/vo-header";
import {
  amazonHref,
  furyHref,
  instagramHref,
  linktreeHref,
  valentinaBasePath,
} from "@/components/tenants/valentina-orciuoli/content";

type ValentinaPageKind = "libri" | "autrice" | "eventi" | "contatti";

export function ValentinaOrciuoliStaticPage({ page }: { page: ValentinaPageKind }) {
  return (
    <main className="vo-site">
      <section className="vo-subpage-hero">
        <div className="vo-subpage-bg" aria-hidden="true" />
        <ValentinaOrciuoliHeader />
        <div className="vo-subpage-intro">
          <span className="vo-dragon-mark">{pageEyebrows[page]}</span>
          {pageTitles[page] && (
            <h1 className={page === "libri" ? "vo-subpage-title-compact" : undefined}>{pageTitles[page]}</h1>
          )}
          {pageLeads[page] &&
            pageLeads[page].split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
        </div>
      </section>

      {page === "libri" && (
        <>
          <section className="vo-book-feature-section vo-book-feature-section-anxiety vo-subpage-section">
            <video
              className="vo-book-feature-video"
              src="/valentina-orciuoli/video-anxiety.webm"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
            <div className="vo-book-feature-panel vo-book-feature-panel-anxiety">
              <h2>Anxiety</h2>
              <p>
                E se l&apos;ansia fosse un potere?
                <br />
                E se questo potere si manifestasse nella forma di un dragone?
              </p>
              <p>
                Quando non è più possibile mentire a sé stessi, quando il vero lo combatte per uscire allo
                scoperto il potere dell&apos;ansia si sprigiona, più feroce che mai.
              </p>
              <a
                className="vo-book-feature-cta"
                href="https://www.amazon.it/Anxiety-Valentina-Orciuoli-ebook/dp/B0F1KVZKFC"
                target="_blank"
                rel="noopener noreferrer"
              >
                Leggilo qui <ArrowRight size={15} />
              </a>
            </div>
          </section>
          <section className="vo-book-feature-section vo-book-feature-section-fury vo-subpage-section">
            <video
              className="vo-book-feature-video"
              src="/valentina-orciuoli/video-fury.webm"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
            <div className="vo-book-feature-panel vo-book-feature-panel-fury">
              <h2>Fury</h2>
              <p>
                E se perdere se stessi fosse l&apos;unico modo per salvare chi ami?
                <br />
                Quando la rabbia prende il sopravvento, cosa resta del proprio lo?
              </p>
              <p>
                Un secolo prima dell&apos;apparizione del Dragone Nero dell&apos;ansia, il Primo Long era
                l&apos;incarnazione della rabbia.
              </p>
              <a
                className="vo-book-feature-cta"
                href="https://www.amazon.it/Fury-Emotion-Dragons-Trilogy-Vol-ebook/dp/B0GKWCS774/?_encoding=UTF8&pd_rd_w=CzMXZ&content-id=amzn1.sym.1eec5ee4-65c7-4941-9685-3f18adf58c9a&pf_rd_p=1eec5ee4-65c7-4941-9685-3f18adf58c9a&pf_rd_r=259-4433171-8421603&pd_rd_wg=5vSf0&pd_rd_r=e0723301-afcb-4ed3-9d1a-a5a3f8f5343e"
                target="_blank"
                rel="noopener noreferrer"
              >
                Leggilo qui <ArrowRight size={15} />
              </a>
            </div>
          </section>
          <section id="tra-fumo-e-ombre" className="vo-book-feature-section vo-book-feature-section-dark vo-subpage-section">
            <div className="vo-book-feature-panel vo-book-feature-panel-dark">
              <h2>Tra fumo e ombre</h2>
              <p>E se il fumo fosse l&apos;unico posto dove poter nascondere la verità?</p>
              <p>
                Nella Milano cupa degli anni &apos;70, tra nebbia, silenzi e ombre che sembrano respirare,
                una donna cerca di dimenticare ciò che ha perduto. Ma ogni sigaretta accesa riporta a galla un
                ricordo, ogni strada bagnata riflette un volto che non vuole più vedere.
              </p>
              <a
                className="vo-book-feature-cta"
                href="https://linktr.ee/valentina.orciuoli"
                target="_blank"
                rel="noopener noreferrer"
              >
                Preordina qui <ArrowRight size={15} />
              </a>
            </div>
          </section>
        </>
      )}

      {page === "autrice" && (
        <section className="vo-section vo-author-section vo-subpage-section">
          <div className="vo-author-copy">
            <a className="vo-text-link" href={linktreeHref} target="_blank" rel="noopener noreferrer">
              Segui l&apos;autrice <ArrowRight size={15} />
            </a>
          </div>
          <div className="vo-author-seal">
            <img src="/valentina-orciuoli/valentina-autrice.webp" alt="Valentina Orciuoli" />
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
            <h2>Canali ufficiali</h2>
            <p>Per seguire aggiornamenti sui libri, eventi e nuove uscite, trovi tutti i link ufficiali qui.</p>
          </div>
          <div className="vo-contact-links">
            <a href={instagramHref} target="_blank" rel="noopener noreferrer">
              <Instagram size={17} /> Instagram
            </a>
            <a href={linktreeHref} target="_blank" rel="noopener noreferrer">
              Linktree <ExternalLink size={16} />
            </a>
            <a href={amazonHref} target="_blank" rel="noopener noreferrer">
              Anxiety su Amazon <ExternalLink size={16} />
            </a>
            <a href={furyHref} target="_blank" rel="noopener noreferrer">
              Fury su Amazon <ExternalLink size={16} />
            </a>
          </div>
        </section>
      )}

      <footer id="contatti" className="vo-footer">
        <div>
          <strong>Valentina Orciuoli</strong>
          <p>Author site demo su piattaforma Bizery.</p>
        </div>
        <div className="vo-footer-links">
          <a href={instagramHref} target="_blank" rel="noopener noreferrer">
            <Instagram size={15} /> Instagram
          </a>
          <a href={linktreeHref} target="_blank" rel="noopener noreferrer">
            Linktree <ExternalLink size={14} />
          </a>
          <a href={amazonHref} target="_blank" rel="noopener noreferrer">
            Amazon <ExternalLink size={14} />
          </a>
        </div>
      </footer>
    </main>
  );
}

const pageTitles: Record<ValentinaPageKind, string> = {
  libri: "Valentina Orciuoli",
  autrice: "Scopri chi è",
  eventi: "",
  contatti: "Contatti",
};

const pageEyebrows: Record<ValentinaPageKind, string> = {
  libri: "Scopri i libri di",
  autrice: "Autrice",
  eventi: "Eventi",
  contatti: "Valentina Orciuoli",
};

const pageLeads: Record<ValentinaPageKind, string> = {
  libri:
    "sei più da fantasy orientale, dove ogni emozione ha il suo drago oppure sei più da noir meneghino, dove il mistero ed il thriller ne dettano il ritmo?",
  autrice:
    "Valentina Orciuoli è un’autrice italiana di fantasy romance e romantasy. Laureata in Relazioni Internazionali e studentessa di Comunicazione e Marketing, coltiva da sempre una grande passione per le storie fantastiche, i mondi popolati da draghi e magia, e le trame romance capaci di intrecciare emozioni intense e avventura.\n\nCon Anxiety, primo volume della saga The Emotion Dragons Trilogy, dà vita a un universo narrativo in cui sentimenti, potere e destino si incontrano. Fury, secondo capitolo della trilogia, amplia questo mondo raccontandone nuove sfumature e radici.\n\nAttraverso la sua scrittura, Valentina unisce immaginazione, introspezione e romanticismo, accompagnando i lettori in viaggi dove le emozioni diventano forza, conflitto e magia.",
  eventi: "",
  contatti: "Link ufficiali, social e canali per seguire Valentina.",
};
