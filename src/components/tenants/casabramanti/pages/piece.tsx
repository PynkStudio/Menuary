"use client";

/**
 * Scheda oggetto.
 *
 * Stesso schema di etichetta della collezione, più le due cose che sulla home
 * non servono: la scelta di variante e taglia, e la riga per portarlo via.
 * Il tasto Slabbby sta sotto "aggiungi alla borsa", come prescrive il modulo.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { CbLabel } from "@/components/tenants/casabramanti/cb-acts";
import {
  CbBag,
  CbColophon,
  CbHeader,
  CbSlabbbyGate,
} from "@/components/tenants/casabramanti/cb-shell";
import { CbShot } from "@/components/tenants/casabramanti/cb-shot";
import {
  casabramantiCatalog,
  findCasabramantiPiece,
  formatCasabramantiPrice,
} from "@/lib/casabramanti-catalog";
import { useCasabramantiCopy, useCasabramantiLanguage } from "@/lib/casabramanti-i18n";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { useCbBagStore } from "@/store/casabramanti-bag-store";

export function CasaBramantiPiecePage({ pieceId }: { pieceId: string }) {
  const copy = useCasabramantiCopy();
  const language = useCasabramantiLanguage();
  const tenantHref = useTenantLocalizedHref();
  const add = useCbBagStore((state) => state.add);

  const piece = useMemo(() => findCasabramantiPiece(pieceId), [pieceId]);
  const index = useMemo(
    () => casabramantiCatalog.findIndex((entry) => entry.id === pieceId),
    [pieceId],
  );

  const [variantId, setVariantId] = useState(() => piece?.variants[0]?.id ?? "");
  const [size, setSize] = useState(() => (piece?.sizes.length === 1 ? piece.sizes[0] : ""));

  if (!piece) return null;

  const variant = piece.variants.find((entry) => entry.id === variantId) ?? piece.variants[0];
  const previous = casabramantiCatalog[index - 1];
  const next = casabramantiCatalog[index + 1];
  /*
     URL che Slabbby salva e poi va a leggere per estrarre i dati del prodotto.
     Deve essere quello pubblico e uguale su server e client: con
     window.location.href sarebbe diverso fra le due rese (mismatch di
     idratazione sull'attributo) e in locale salverebbe un localhost che lo
     scraper non può raggiungere.
  */
  const productUrl = `https://demo.bizery.it${tenantHref(`/${piece.id}`)}`;

  return (
    <div className="cb-root">
      <CbHeader />

      <article
        className="cb-piece"
        data-cb-ground={piece.ground}
        style={{ ["--cb-ground" as string]: piece.groundHex } as React.CSSProperties}
      >
        <p style={{ marginBottom: "2rem" }}>
          <Link className="cb-link" href={tenantHref("/")}>
            {copy.piece.back}
          </Link>
        </p>

        <div className="cb-piece-grid">
          <div className="cb-piece-shot">
            <CbShot piece={piece} variant={variant} priority contain />
            <div className="cb-piece-thumbs" role="group" aria-label={copy.piece.chooseVariant}>
              {piece.variants.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="cb-swatch"
                  aria-pressed={entry.id === variant.id}
                  onClick={() => setVariantId(entry.id)}
                  style={{ ["--cb-sw" as string]: entry.hex }}
                >
                  <i />
                  {entry.name[language]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <CbLabel
              piece={piece}
              language={language}
              copy={copy}
              href={tenantHref("/")}
              headingId={`cb-h-${piece.id}`}
              headingLevel="h1"
              foot={false}
            />

            <p className="cb-field-head">
              <span>{copy.piece.chooseSize}</span>
              <b>{piece.sizeReference[language]}</b>
            </p>
            <div className="cb-sizes" role="group" aria-label={copy.piece.chooseSize}>
              {piece.sizes.map((entry) => (
                <button
                  key={entry}
                  type="button"
                  className="cb-size"
                  aria-pressed={entry === size}
                  onClick={() => setSize(entry)}
                >
                  {entry}
                </button>
              ))}
            </div>

            <div className="cb-object-foot" style={{ marginBottom: "1.25rem" }}>
              <span className="cb-price">{formatCasabramantiPrice(piece.price, language)}</span>
              <span className="cb-eyebrow">{copy.cart.shippingFree}</span>
            </div>

            <button
              type="button"
              className="cb-btn"
              disabled={!size}
              onClick={() =>
                add({
                  pieceId: piece.id,
                  variantId: variant.id,
                  size,
                  name: piece.name[language],
                  variantName: variant.name[language],
                  price: piece.price,
                  image: variant.thumb,
                })
              }
            >
              {copy.piece.add}
            </button>

            {/*
              Slabbby, sotto il tasto borsa. È il segnaposto ufficiale del
              widget: dichiarandolo, il widget monta QUI il proprio bottone e
              smette di cercarsi un posto da solo. Un bottone solo, con la
              logica di salvataggio vera; lo stile arriva dai token
              --slabbby-* scritti in casabramanti.css.
            */}
            <div
              className="cb-slabbby-slot"
              data-slabbby
              data-slabbby-label={copy.piece.save}
              data-slabbby-saved-label={copy.piece.saved}
              data-slabbby-url={productUrl}
              data-slabbby-block
              key={`${piece.id}-${variant.id}`}
            />

            <dl className="cb-label cb-label--tight" style={{ marginTop: "2rem" }}>
              <div style={{ display: "contents" }}>
                <dt>{copy.label.care}</dt>
                <dd>{piece.care[language]}</dd>
              </div>
              <div style={{ display: "contents" }}>
                <dt>{copy.piece.shipping}</dt>
                <dd>{copy.piece.shippingBody}</dd>
              </div>
              <div style={{ display: "contents" }}>
                <dt>{copy.piece.returns}</dt>
                <dd>{copy.piece.returnsBody}</dd>
              </div>
            </dl>
          </div>
        </div>

        <nav className="cb-piece-nav" aria-label={copy.nav.indexAria}>
          {previous ? (
            <Link href={tenantHref(`/${previous.id}`)}>
              {copy.piece.prevObject} · {previous.number}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={tenantHref(`/${next.id}`)}>
              {copy.piece.nextObject} · {next.number}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      <section className="cb-inquiry">
        <CbColophon />
      </section>

      <CbBag />
      <CbSlabbbyGate />
    </div>
  );
}
