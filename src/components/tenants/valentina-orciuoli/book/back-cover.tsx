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

        {/* La firma dell'edizione: chi ha fatto il sito e su cosa gira, come lo
            stampatore in fondo a un volume. Si vede solo su schermo stretto —
            su schermo largo gli stessi crediti stanno nel piede, e il CSS
            nasconde questo blocco. Le note legali stanno nel piede sempre: qui
            sarebbero raggiungibili solo rigirando il libro. */}
        <div className="vo-back-colophon">
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
