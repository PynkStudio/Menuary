"use client";

/**
 * Cromatura di Casa Bramanti.
 *
 * La testata è sottile e non compete con niente: il marchio alla scala della
 * composizione vive nel frontespizio, che si prende una schermata intera.
 * L'indice non è una striscia di otto tab sopra la collezione: è un foglio
 * che si apre quando serve e sparisce quando non serve.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SlabbbyScriptGate } from "@/components/core/slabbby-script-gate";
import { bodyScrollLock, bodyScrollUnlock } from "@/lib/body-scroll-lock";
import {
  CASABRAMANTI_COLLECTION,
  casabramantiCatalog,
  formatCasabramantiPrice,
} from "@/lib/casabramanti-catalog";
import {
  CASABRAMANTI_PREVIEW_SLUG,
  casabramantiI18n,
  useCasabramantiCopy,
  useCasabramantiLanguage,
  type CasaBramantiLanguage,
} from "@/lib/casabramanti-i18n";
import { replaceTenantLocaleInPath } from "@/lib/tenant-localized-path";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { cbBagCount, cbBagTotal, useCbBagStore } from "@/store/casabramanti-bag-store";

export function CbLangSwitch() {
  const language = useCasabramantiLanguage();
  const copy = useCasabramantiCopy();
  const pathname = usePathname() ?? "/";
  const router = useRouter();

  function switchTo(next: CasaBramantiLanguage) {
    if (next === language) return;
    casabramantiI18n.setLanguage(next);
    const previewSlug = pathname.startsWith(`/${CASABRAMANTI_PREVIEW_SLUG}`)
      ? CASABRAMANTI_PREVIEW_SLUG
      : undefined;
    router.push(replaceTenantLocaleInPath({ locale: next, pathname, previewSlug }));
  }

  return (
    <div className="cb-lang" role="group" aria-label={copy.langSwitchLabel}>
      {(casabramantiI18n.languages as CasaBramantiLanguage[]).map((code) => (
        <button
          key={code}
          type="button"
          className="cb-topbar-btn cb-topbar-btn--lang"
          aria-pressed={code === language}
          onClick={() => switchTo(code)}
          lang={code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/**
 * La testata. Un filetto e tre voci: non deve mai togliere la scena ai capi.
 *
 * Resta trasparente finché la pagina non si muove, così il frontespizio si
 * apre pulito; appena si scende prende il fondo della sezione sotto e un
 * filetto, per non perdere il contrasto sopra le fotografie.
 */
/**
 * Dichiara a Slabbby che questo sito decide da sé dove va il bottone.
 *
 * Serve sulle pagine SENZA segnaposto (collezione, ordine): senza questa
 * dichiarazione l'estensione Chrome, che inietta il widget su ogni pagina,
 * tornerebbe a cercarsi un posto da sola e finirebbe accanto al marchio.
 * Sulla scheda oggetto basterebbe il segnaposto, ma l'header è su tutte le
 * pagine ed è il punto giusto per dirlo una volta sola.
 */
function CbSlabbbyManual() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-slabbby-manual", "");
    return () => root.removeAttribute("data-slabbby-manual");
  }, []);
  return null;
}

export function CbHeader() {
  const copy = useCasabramantiCopy();
  const tenantHref = useTenantLocalizedHref();
  const lines = useCbBagStore((state) => state.lines);
  const setBagOpen = useCbBagStore((state) => state.setOpen);
  const count = cbBagCount(lines);
  const [stuck, setStuck] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <CbSlabbbyManual />
      <header className="cb-topbar" data-cb-stuck={stuck ? "true" : "false"}>
        <p className="cb-topbar-mark">
          <Link href={tenantHref("/")}>Casa&nbsp;Bramanti</Link>
        </p>
        <nav className="cb-topbar-nav" aria-label={copy.nav.indexAria}>
          <button
            type="button"
            className="cb-topbar-btn"
            onClick={() => setIndexOpen(true)}
            aria-label={copy.nav.indexOpen}
          >
            {copy.nav.index}
          </button>
          <CbLangSwitch />
          <button
            type="button"
            className="cb-topbar-btn"
            onClick={() => setBagOpen(true)}
            aria-label={copy.nav.cartAria}
          >
            {copy.nav.cart}
            {count > 0 ? <span className="cb-topbar-count">{count}</span> : null}
          </button>
        </nav>
      </header>
      <CbIndexSheet open={indexOpen} onClose={() => setIndexOpen(false)} />
    </>
  );
}

/**
 * L'indice come foglio intero: gli otto oggetti letti uno sotto l'altro, alla
 * scala della carta. Esce in portale sul body per la stessa ragione della
 * borsa: un antenato trasformato romperebbe position: fixed.
 */
function CbIndexSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const copy = useCasabramantiCopy();
  const language = useCasabramantiLanguage();
  const tenantHref = useTenantLocalizedHref();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    bodyScrollLock();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      bodyScrollUnlock();
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div data-tenant-surface="casabramanti" className="cb-root" style={{ display: "contents" }}>
      <div className="cb-sheet" role="dialog" aria-modal="true" aria-label={copy.nav.indexAria}>
        <div className="cb-sheet-head">
          <p className="cb-eyebrow">
            {copy.nav.index} · {CASABRAMANTI_COLLECTION[language]}
          </p>
          <button
            type="button"
            className="cb-topbar-btn"
            onClick={onClose}
            aria-label={copy.nav.indexClose}
          >
            {copy.nav.close}
          </button>
        </div>

        <ol className="cb-sheet-list">
          {casabramantiCatalog.map((piece) => (
            <li key={piece.id}>
              <Link className="cb-sheet-row" href={tenantHref(`/${piece.id}`)} onClick={onClose}>
                <span className="cb-sheet-num">{piece.number}</span>
                <span className="cb-sheet-name">{piece.name[language]}</span>
                <span className="cb-sheet-kind">{piece.kind[language]}</span>
                <span className="cb-sheet-price">{formatCasabramantiPrice(piece.price, language)}</span>
              </Link>
            </li>
          ))}
        </ol>

      </div>
    </div>,
    document.body,
  );
}

/**
 * Frontespizio: la prima schermata è tipografica e basta.
 *
 * Il marchio qui è l'h1 della collezione e ha una schermata tutta sua, che è
 * il modo di dargli aria senza gonfiarlo in testata. Nessun claim, nessun
 * bottone: si dichiarano fatti, e le condizioni che servono per comprare.
 */
export function CbFrontispiece() {
  const copy = useCasabramantiCopy();
  const language = useCasabramantiLanguage();

  return (
    <section className="cb-open" data-cb-ground="bone" aria-labelledby="cb-mark">
      <div className="cb-open-top">
        <span>{copy.home.plate.city}</span>
        <span>{CASABRAMANTI_COLLECTION[language]}</span>
      </div>

      <div className="cb-open-body">
        <h1 className="cb-open-mark" id="cb-mark">
          Casa&nbsp;Bramanti
        </h1>
        <p className="cb-open-house">{copy.home.opening.house}</p>
      </div>

      <div className="cb-open-foot">
        <p className="cb-open-facts">{copy.home.plate.opening}</p>
        <p className="cb-open-terms">{copy.home.opening.terms}</p>
        <span className="cb-open-scroll" aria-hidden="true" />
      </div>
    </section>
  );
}

export function CbBag() {
  const copy = useCasabramantiCopy();
  const language = useCasabramantiLanguage();
  const tenantHref = useTenantLocalizedHref();
  const lines = useCbBagStore((state) => state.lines);
  const open = useCbBagStore((state) => state.open);
  const setOpen = useCbBagStore((state) => state.setOpen);
  const step = useCbBagStore((state) => state.step);
  const remove = useCbBagStore((state) => state.remove);
  const total = cbBagTotal(lines);
  const count = cbBagCount(lines);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    bodyScrollLock();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      bodyScrollUnlock();
    };
  }, [open, setOpen]);

  if (!open || !mounted) return null;

  /*
     Il drawer esce in portale sul body: dentro l'albero di pagina un antenato
     trasformato (PageTransitionShell) farebbe risolvere position: fixed sul
     wrapper invece che sul viewport. `display: contents` sul contenitore del
     portale non crea un box, quindi i figli restano fixed sul viewport e i
     token --cb-* continuano a ereditare dal data-tenant-surface.
  */
  return createPortal(
    <div data-tenant-surface="casabramanti" className="cb-root" style={{ display: "contents" }}>
      <button
        type="button"
        className="cb-bag-scrim"
        aria-label={copy.nav.close}
        onClick={() => setOpen(false)}
      />
      <aside className="cb-bag" role="dialog" aria-modal="true" aria-label={copy.cart.title}>
        <div className="cb-bag-head">
          <h2>{copy.cart.title}</h2>
          <button type="button" className="cb-topbar-btn" onClick={() => setOpen(false)}>
            {copy.nav.close}
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="cb-bag-empty">
            <p className="cb-price">{copy.cart.empty}</p>
            <p className="cb-note" style={{ marginTop: "0.75rem" }}>
              {copy.cart.emptyHint}
            </p>
          </div>
        ) : (
          <>
            <div className="cb-bag-lines">
              {lines.map((line) => (
                <div className="cb-bag-line" key={line.lineId}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={line.image} alt="" width={280} height={375} loading="lazy" />
                  <div>
                    <p className="cb-bag-name">{line.name}</p>
                    <p className="cb-bag-meta">
                      {line.variantName} · {line.size} · {formatCasabramantiPrice(line.price, language)}
                    </p>
                    <div className="cb-qty">
                      <button
                        type="button"
                        onClick={() => step(line.lineId, -1)}
                        aria-label={`${copy.cart.quantity} -1`}
                      >
                        –
                      </button>
                      <span>{line.qty}</span>
                      <button
                        type="button"
                        onClick={() => step(line.lineId, 1)}
                        aria-label={`${copy.cart.quantity} +1`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(line.lineId)}
                        aria-label={`${copy.cart.remove}: ${line.name}`}
                        style={{ marginLeft: "0.4rem" }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cb-bag-foot">
              <div className="cb-bag-total">
                <span className="cb-eyebrow">
                  {copy.cart.subtotal} · {count}{" "}
                  {count === 1 ? copy.cart.itemsOne : copy.cart.itemsMany}
                </span>
                <span className="cb-price">{formatCasabramantiPrice(total, language)}</span>
              </div>
              <Link href={tenantHref("/checkout")} className="cb-btn" onClick={() => setOpen(false)}>
                {copy.cart.checkout}
              </Link>
              <p className="cb-slabbby-hint" style={{ textAlign: "center" }}>
                {copy.cart.shippingFree}
              </p>
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
}

export function CbColophon() {
  const copy = useCasabramantiCopy();
  const tenantHref = useTenantLocalizedHref();

  return (
    <div className="cb-colophon">
      <span>{copy.footer.house}</span>
      <span>
        <Link href={tenantHref("/privacy")}>Privacy</Link> ·{" "}
        <Link href={tenantHref("/cookie")}>Cookie</Link>
      </span>
      <span>{copy.footer.demoNote}</span>
    </div>
  );
}

/**
 * Slabbby è un modulo della piattaforma con il proprio feature flag. Il gate
 * viene montato qui perché nel layout globale è impostato con skipInPreview e
 * la preview conosce il tenant esatto dallo slug.
 *
 * Va montato SOLO nella scheda oggetto. widget.js si aggancia da solo accanto
 * al primo heading della pagina: caricato sulla collezione finirebbe dentro il
 * marchio, e la regola del modulo vieta il bottone Slabbby in home/catalogo e
 * sopra il titolo del prodotto.
 */
export function CbSlabbbyGate() {
  return <SlabbbyScriptGate />;
}
