"use client";

/* eslint-disable @next/next/no-img-element */

/**
 * La quarta di copertina. Sta sul fondo del volume, girata di 180°: si vede solo
 * quando il libro si chiude e si rigira, ed è il posto che nell'editoria vera
 * ospita ritratto e biografia dell'autrice.
 */
export function VoBackCover({
  hidden,
  privacyHref,
  cookieHref,
  gestioneHref,
}: {
  hidden: boolean;
  privacyHref: string;
  cookieHref: string;
  gestioneHref: string;
}) {
  return (
    <div className="vo-back-board" aria-hidden={hidden || undefined} inert={hidden || undefined}>
      <div className="vo-back-face">
        <div className="vo-back-frame" aria-hidden="true" />

        <figure className="vo-back-portrait">
          <img src="/valentina-orciuoli/valentina-autrice.webp" alt="Valentina Orciuoli" />
        </figure>

        <div className="vo-back-copy">
          <span className="vo-back-kicker">L&apos;autrice</span>
          <h2>Valentina Orciuoli</h2>
          <p className="vo-back-blurb">
            «Credo che le storie non servano solo a fuggire dalla realtà, ma a capirla
            davvero.»
          </p>
          <p>
            Nei miei libri ogni simbolo, ogni figura e ogni ombra sono metafore della nostra
            società e dell&apos;intricato universo delle emozioni umane. Scrivo per
            trasformare ciò che non riusciamo a spiegare a voce in viaggi indimenticabili.
          </p>
        </div>

        {/* Il colophon: dove su un libro vero stanno editore, stampatore e
            l'anno. Qui ci stanno le note legali e chi ha fatto il sito —
            informazioni di servizio, che in un volume si mettono in fondo e non
            in mezzo alla lettura. */}
        <div className="vo-back-colophon">
          <span className="vo-back-imprint">
            <a href={privacyHref}>Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a href={cookieHref}>Cookie Policy</a>
          </span>
          <span className="vo-back-imprint">
            © {new Date().getFullYear()} Valentina Orciuoli
            <span aria-hidden="true">·</span>
            <a href={gestioneHref} target="_blank" rel="noopener noreferrer">
              Gestione
            </a>
          </span>
          <span className="vo-back-imprint">
            Realizzato da{" "}
            <a href="https://pynkstudio.eu" target="_blank" rel="noopener noreferrer">
              PynkStudio
            </a>
            <span aria-hidden="true">·</span>
            <a href="https://weuseorpheo.com" target="_blank" rel="noopener noreferrer">
              Powered by Orpheo
            </a>
          </span>
        </div>

        <div className="vo-back-foot">
          <span className="vo-back-mark">龍</span>
          <span className="vo-back-barcode" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
