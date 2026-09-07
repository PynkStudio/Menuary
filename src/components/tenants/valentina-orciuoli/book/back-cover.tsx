"use client";

/* eslint-disable @next/next/no-img-element */

/**
 * La quarta di copertina. Sta sul fondo del volume, girata di 180°: si vede solo
 * quando il libro si chiude e si rigira, ed è il posto che nell'editoria vera
 * ospita ritratto e biografia dell'autrice.
 */
export function VoBackCover({ hidden }: { hidden: boolean }) {
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

        <div className="vo-back-foot">
          <span className="vo-back-mark">龍</span>
          <span className="vo-back-barcode" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
