"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { getTenantGestioneExternalHref } from "@/lib/gestione-routing";
import {
  voNotesFromPosts,
  type VoNote,
} from "@/components/tenants/valentina-orciuoli/book/notes";
import type { BlogPost } from "@/lib/blog/types";
import {
  VoBookShell,
  WHEEL_LINE_PX,
  WHEEL_MAX_STEP,
} from "@/components/tenants/valentina-orciuoli/book/book-shell";
import { VoBackCover } from "@/components/tenants/valentina-orciuoli/book/back-cover";
import {
  voHandleLinkClick,
  voPushUrl,
} from "@/components/tenants/valentina-orciuoli/book/book-navigation";
import { VoCover } from "@/components/tenants/valentina-orciuoli/book/cover";
import { VoDesk } from "@/components/tenants/valentina-orciuoli/book/desk";

import {
  renderVoAppendixFace,
  renderVoFace,
  type VoBookContext,
} from "@/components/tenants/valentina-orciuoli/book/pages";
import {
  voBookMemory,
  voBookMemoryAvailable,
} from "@/components/tenants/valentina-orciuoli/book/book-memory";
import {
  appendixByPathname,
  appendixHref,
  isBookPathname,
  voErrata,
  articleHref as voArticleHref,
  articleSlugFromPathname,
  backCoverHref,
  hasSpread,
  isBackCoverPathname,
  spreadHref,
  spreadIndexById,
  spreadIndexByPathname,
  voAppendix,
  voBackCover,
  voSpreads,
  type VoAppendix,
  type VoSpread,
} from "@/components/tenants/valentina-orciuoli/book/book-map";
import {
  voLocalizeInternalHref,
  voRoute,
} from "@/components/tenants/valentina-orciuoli/routes";
import { useValentinaNewsletter } from "@/components/tenants/valentina-orciuoli/newsletter";
import {
  VoNewsletterInsert,
  VoNewsletterTab,
} from "@/components/tenants/valentina-orciuoli/book/newsletter-insert";
import {
  valentinaCreativeWorks,
  type ValentinaCreativeWork,
} from "@/components/tenants/valentina-orciuoli/content";

/** La panoramica fra il volume e la scrivania: lenta, come girare la testa. */
const PAN_TRANSITION = { duration: 1.05, ease: [0.5, 0.02, 0.16, 1] } as const;
/**
 * Dove si posa il volume quando si guarda dall'altra parte del tavolo.
 *
 * Non esce di scena: resta in alto a sinistra, tagliato dal bordo alto, così di
 * lui si vede il bordo inferiore con l'angolo sinistro — l'orecchio. È l'appiglio
 * per tornare indietro, e soprattutto è ciò che dice che il libro *è ancora lì*:
 * non si è cambiata pagina, si è girata la testa.
 *
 * I numeri stanno qui perché sono da guardare, non da dedurre: il taglio giusto
 * si trova a occhio, e cambiarlo dev'essere una riga sola.
 */
const BOOK_PARKED = {
  scale: 0.22,
  x: "-42%",
  y: "-50%",
  rotateY: 26,
  rotateZ: -6,
} as const;
const COVER_OPEN_AT = 0.95;
const CLOSE_TRANSITION = { duration: 0.75, ease: [0.5, 0.05, 0.2, 1] } as const;
const TURN_TRANSITION = { duration: 0.95, ease: [0.55, 0.06, 0.24, 1] } as const;

/**
 * Quanta rotella serve per spalancare la copertina, in pixel di delta. Con il
 * tetto per evento qui sotto sono circa sette scatti: abbastanza da farne un
 * gesto deliberato, non tanti da diventare una manovella.
 */
const CEREMONY_TRAVEL = 700;
/**
 * Quanto conta un pixel di pollice sulla corsa della copertina. A 2.2 servivano
 * più di trecento pixel di trascinamento: su un telefono è quasi tutto lo schermo,
 * e il gesto finiva prima del libro.
 */
const TOUCH_CEREMONY_GAIN = 3.1;
/**
 * Pixel di dito, in un tocco solo, oltre i quali la scorsa vale "apri il libro"
 * invece di "sbircia sotto la copertina". Quarantaquattro sono meno di un
 * pollice svogliato e più di un tremolio: sopra questa soglia il volume si apre
 * fino in fondo da sé.
 */
const TOUCH_OPEN_TRAVEL = 44;
/** La copertina insegue il bersaglio con una molla, non salta di scatto in scatto. */
const CEREMONY_FOLLOW = { type: "spring", stiffness: 210, damping: 30, mass: 0.7 } as const;
const CEREMONY_OPEN_TRANSITION = { duration: 0.85, ease: [0.42, 0.02, 0.18, 1] } as const;
/**
 * Un link che *sfoglia* invece di navigare. Resta un `<a href>` vero — i crawler
 * lo seguono, "apri in nuova scheda" funziona — ma il clic normale aggiorna solo
 * la cronologia: il libro insegue l'URL girando le pagine, senza rimontarsi.
 */
function VoBookLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">) {
  return (
    <a
      {...rest}
      className={className}
      href={href}
      onClick={(event) => {
        voHandleLinkClick(event, href);
      }}
    >
      {children}
    </a>
  );
}

export function ValentinaOrciuoliBookSite({
  initialSpread,
  initialNotes,
  notFound = false,
}: {
  initialSpread: number;
  /** Gli appunti già letti dal server, quando la route li conosce. */
  initialNotes?: VoNote[];
  /**
   * La route richiesta non esiste. Il volume si apre sull'errata invece di
   * lasciare il posto a una schermata di sistema: un indirizzo sbagliato resta
   * dentro il libro, e da lì si riprende la lettura.
   */
  notFound?: boolean;
}) {
  const pathname = usePathname();
  // Prefisso host (preview vs dominio custom) e lingua: entrambi si leggono
  // dall'URL corrente, così ogni href generato qui resta sull'indirizzo giusto.
  // Memoizzato: `ctx` e mezza dozzina di callback lo hanno fra le dipendenze, e
  // un oggetto nuovo a ogni render le invaliderebbe tutte a ogni fotogramma.
  const route = useMemo(() => voRoute(pathname), [pathname]);
  /** La lingua che si sta leggendo: serve a scegliere la traduzione dell'appunto. */
  const locale = route.localePrefix.replace("/", "") || "it";
  const newsletter = useValentinaNewsletter();
  const gestioneHref = getTenantGestioneExternalHref("valentina-orciuoli");

  const showsBackCover = isBackCoverPathname(pathname);
  // L'errata vale finché l'URL non torna a nominare una pagina vera: appena si
  // riprende la lettura, la posizione virtuale in fondo al volume deve sparire,
  // o il libro continuerebbe a ripescarla.
  const appendix =
    notFound && !isBookPathname(pathname) ? voErrata : appendixByPathname(pathname);
  // Il singolo appunto non è una pagina del volume: è un foglio sulla scrivania.
  const articleSlug = articleSlugFromPathname(pathname);
  // Gli appunti arrivano dal server quando la route li conosce già, così stanno
  // nell'HTML; altrove si leggono dall'API al montaggio.
  const [posts, setPosts] = useState<VoNote[]>(initialNotes ?? []);
  const [postsLoaded, setPostsLoaded] = useState((initialNotes?.length ?? 0) > 0);
  const article = articleSlug
    ? (posts.find((post) => post.slug === articleSlug) ?? null)
    : null;
  const onDesk = articleSlug !== null;

  // Da dove parte il volume in questo montaggio: se la scheda ha già visto il
  // libro si riprende il suo stato, altrimenti è un ingresso vero e lo stato lo
  // detta l'URL.
  /** Lo stato con cui il volume entra in scena, congelato al montaggio. */
  const [entry] = useState(() => {
    // In SSR la memoria non si legge: si rende l'ingresso pulito, che è anche
    // ciò che il client produce al primo render, così l'idratazione torna.
    const alreadyOpened = voBookMemoryAvailable && voBookMemory.opened;
    return {
      // Un richiamo alle note legali non è un ingresso dalla home: chi ci arriva
      // da un link deve trovare il volume già aperto sull'appendice.
      ceremony: !alreadyOpened && initialSpread === 0 && !showsBackCover && !appendix,
      back: alreadyOpened ? voBookMemory.back : showsBackCover,
    };
  });

  // La cerimonia di apertura è un evento d'ingresso: si gioca solo arrivando sulla
  // home a volume mai aperto. Chi apre un link diretto su /libri trova il libro
  // già aperto a quella pagina, e chi torna in home sfogliando non se la rivede.
  const [opened, setOpened] = useState(() => !entry.ceremony && !entry.back);

  // Il volume chiuso accetta il gesto d'apertura sempre, non solo all'ingresso:
  // dopo un "chiudi il libro" si deve poter riaprire allo stesso modo.
  const closed = !opened && !showsBackCover && !appendix;

  const [works, setWorks] = useState<ValentinaCreativeWork[]>(valentinaCreativeWorks);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const ceremonyAccRef = useRef(0);
  const coverProgress = useMotionValue(entry.ceremony || entry.back ? 0 : 1);
  const turn = useMotionValue(entry.back ? 1 : 0);
  const openedRef = useRef(opened);
  openedRef.current = opened;

  /**
   * Il carrello. La traslazione da sola sarebbe un carosello: una panoramica
   * vera stringe l'inquadratura su ciò che lascia e la apre su ciò che
   * raggiunge, e gli oggetti restano illuminati — cambia l'inquadratura, non la
   * luce. Entra già a destinazione se la scheda ci era arrivata da un link.
   */
  const [cameraEntry] = useState(() =>
    voBookMemoryAvailable && voBookMemory.opened ? voBookMemory.desk : onDesk,
  );
  const pan = useMotionValue(cameraEntry ? 1 : 0);
  // Il volume si allontana verso l'alto a destra e si rimpicciolisce; la
  // scrivania entra da destra e si raddrizza. Le due cose insieme sono la testa
  // che gira: se il libro sparisse e basta, sarebbe un cambio di schermata.
  const bookScale = useTransform(pan, [0, 1], [1, BOOK_PARKED.scale]);
  const bookTurn = useTransform(pan, [0, 1], [0, BOOK_PARKED.rotateY]);
  const bookTilt = useTransform(pan, [0, 1], [0, BOOK_PARKED.rotateZ]);
  const bookX = useTransform(pan, [0, 1], ["0%", BOOK_PARKED.x]);
  const bookY = useTransform(pan, [0, 1], ["0%", BOOK_PARKED.y]);
  // Resta leggibile: è un appiglio, non un fondale.
  const bookFade = useTransform(pan, [0, 1], [1, 0.88]);
  const deskScale = useTransform(pan, [0, 1], [0.9, 1]);
  const deskTurn = useTransform(pan, [0, 1], [18, 0]);
  const deskFade = useTransform(pan, [0, 0.55], [0, 1]);
  const deskDrift = useTransform(pan, [0, 1], ["42%", "0%"]);

  useEffect(() => {
    const controls = animate(pan, onDesk ? 1 : 0, PAN_TRANSITION);
    controls.then(() => {
      voBookMemory.desk = onDesk;
    });
    return () => controls.stop();
  }, [onDesk, pan]);

  /**
   * Le copertine delle opere si scaldano appena il libro entra in scena.
   *
   * Sono l'unica immagine pesante del volume e vivono su facciate che, sfogliando
   * in avanti, si montano solo a giro già cominciato: senza questo il browser le
   * scopriva mentre il foglio era in volo, e la pagina atterrava su un rettangolo
   * scuro. Qui non si costruisce nulla nel DOM — si riempie solo la cache, così
   * quando la facciata arriva l'immagine c'è già.
   */
  useEffect(() => {
    const warmed = new Set<string>();
    for (const work of works) {
      const url = work.coverImageUrl;
      if (!url || warmed.has(url)) continue;
      warmed.add(url);
      const warm = new Image();
      warm.decoding = "async";
      warm.src = url;
    }
  }, [works]);

  const [insertOpen, setInsertOpen] = useState(false);
  /**
   * Una volta infilata, la cedola resta. Prima spariva appena il volume si
   * chiudeva o si rigirava sulla quarta — e un segnalibro che si smaterializza
   * quando chiudi il libro è l'unica cosa che un segnalibro non fa.
   */
  const [bookmarked, setBookmarked] = useState(() => !entry.ceremony);
  useEffect(() => {
    if (opened) setBookmarked(true);
  }, [opened]);
  // Il modo lo decide lo shell, ma il flag serve alla radice: da lì il foglio di
  // stile veste testatina, comandi e piede oltre al libro.
  const [compact, setCompact] = useState(false);

  // Il suggerimento "sfoglia di lato": compare una volta sola per scheda, la
  // prima volta che il libro si trova aperto su schermo stretto, e si spegne
  // da sé. Il ref-cancello, non le dipendenze dell'effetto, decide se è già
  // partito — altrimenti un ricalcolo di `compact` a metà mostra (il
  // `ResizeObserver` dello shell) cancellerebbe il timeout e il suggerimento
  // resterebbe appeso finché qualcos'altro non lo smonta.
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const swipeHintTriggeredRef = useRef(false);
  const swipeHintTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (swipeHintTriggeredRef.current) return;
    if (!compact || !opened || showsBackCover || appendix || onDesk) return;
    if (voBookMemoryAvailable && voBookMemory.swipeHintSeen) return;
    swipeHintTriggeredRef.current = true;
    voBookMemory.swipeHintSeen = true;
    setShowSwipeHint(true);
    swipeHintTimeoutRef.current = window.setTimeout(() => setShowSwipeHint(false), 3200);
  }, [compact, opened, showsBackCover, appendix, onDesk]);
  useEffect(
    () => () => {
      if (swipeHintTimeoutRef.current) window.clearTimeout(swipeHintTimeoutRef.current);
    },
    [],
  );

  // Si segna *quando il libro si apre davvero*, non al montaggio: un flag scritto
  // al montaggio verrebbe consumato dal doppio montaggio di StrictMode e la
  // cerimonia non si vedrebbe mai.
  useEffect(() => {
    if (opened) voBookMemory.opened = true;
  }, [opened]);

  /**
   * Porta a termine l'apertura. Sta qui e non dentro l'ascoltatore di
   * `coverProgress`: lanciare un'animazione dall'interno della callback del
   * valore che quell'animazione muove è rientrante, e framer finisce per non
   * applicarla — la copertina restava socchiusa a un passo dalla fine.
   */
  const completeOpening = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    ceremonyAccRef.current = CEREMONY_TRAVEL;
    animate(coverProgress, 1, CEREMONY_OPEN_TRANSITION);
    setOpened(true);
  }, [coverProgress]);

  // La pagina non scorre mai: il documento è alto esattamente un viewport, con
  // testatina e piede ancorati. La cerimonia consuma la rotella come se fosse
  // scroll, ma è un valore virtuale — così non esiste una barra di scorrimento da
  // cui il libro possa sfuggire, ed è la stessa rotella che poi gira le pagine.
  useEffect(() => {
    if (!closed) return;
    const element = stageRef.current;
    if (!element) return;

    let follow: { stop: () => void } | null = null;

    /**
     * `direct` distingue i due gesti. La rotella manda impulsi staccati e ha
     * bisogno di una molla che li unisca; il dito è già una posizione continua, e
     * inseguirlo con una molla nuova a ogni evento — sessanta al secondo — voleva
     * dire una rincorsa che parte da ferma sessanta volte: il cartoncino restava
     * indietro rispetto al pollice e scattava.
     */
    const advance = (delta: number, direct: boolean) => {
      if (openedRef.current) return;
      const next = Math.min(Math.max(ceremonyAccRef.current + delta, 0), CEREMONY_TRAVEL);
      if (next / CEREMONY_TRAVEL >= COVER_OPEN_AT) {
        follow?.stop();
        completeOpening();
        return;
      }
      ceremonyAccRef.current = next;
      follow?.stop();
      follow = direct ? null : animate(coverProgress, next / CEREMONY_TRAVEL, CEREMONY_FOLLOW);
      if (direct) coverProgress.set(next / CEREMONY_TRAVEL);
    };

    const onWheel = (event: WheelEvent) => {
      if (openedRef.current) return;
      event.preventDefault();
      const unit =
        event.deltaMode === 1 ? WHEEL_LINE_PX : event.deltaMode === 2 ? window.innerHeight : 1;
      const step = event.deltaY * unit;
      advance(Math.max(-WHEEL_MAX_STEP, Math.min(WHEEL_MAX_STEP, step)), false);
    };

    let lastY: number | null = null;
    let lastX = 0;
    /** Quanto il dito ha tirato nel verso che apre, in *questo* tocco. */
    let pulled = 0;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      lastY = touch?.clientY ?? null;
      lastX = touch?.clientX ?? 0;
      pulled = 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (openedRef.current || lastY === null) return;
      const touch = event.touches[0];
      const y = touch?.clientY ?? lastY;
      const x = touch?.clientX ?? lastX;
      event.preventDefault();
      /*
       * Aprire un libro è tirare la copertina, e la si tira **in su o di lato**:
       * chiedere solo il verticale lasciava senza risposta metà dei gesti che uno
       * prova davanti a una copertina chiusa — in particolare quello di sfogliare,
       * che è poi il gesto che il libro insegna in ogni altra sua pagina.
       */
      const pull = lastY - y + (lastX - x);
      pulled += pull;
      advance(pull * TOUCH_CEREMONY_GAIN, true);
      lastY = y;
      lastX = x;
    };
    const onTouchEnd = () => {
      const travelled = pulled;
      lastY = null;
      pulled = 0;
      if (openedRef.current) return;
      follow?.stop();
      /*
       * Una scorsa decisa **apre**, non lascia il volume socchiuso.
       *
       * Prima la copertina si posava dove il gesto l'aveva lasciata, e per aprire
       * davvero servivano duecento e passa pixel di dito in un tocco solo: un
       * pollice normale ne fa un centinaio, vedeva il cartoncino muoversi di
       * mezzo e concludeva che scorrere non funziona. Il piede promette "scorri
       * o tocca per aprire il libro": devono essere vere tutte e due.
       *
       * Il trascinamento lento per sbirciare resta — è il *dito che si ferma* a
       * dirlo, non la distanza.
       */
      if (travelled >= TOUCH_OPEN_TRAVEL) {
        completeOpening();
        return;
      }
      follow = animate(coverProgress, ceremonyAccRef.current / CEREMONY_TRAVEL, CEREMONY_FOLLOW);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("touchstart", onTouchStart, { passive: true });
    element.addEventListener("touchmove", onTouchMove, { passive: false });
    element.addEventListener("touchend", onTouchEnd, { passive: true });
    element.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      follow?.stop();
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("touchstart", onTouchStart);
      element.removeEventListener("touchmove", onTouchMove);
      element.removeEventListener("touchend", onTouchEnd);
      element.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [closed, completeOpening, coverProgress]);

  /** Scorciatoia: un clic sulla copertina chiusa vale l'intera cerimonia. */
  const openBook = completeOpening;

  // Per mostrare la quarta il volume deve prima chiudersi e poi rigirarsi: sono due
  // movimenti in sequenza, non uno solo, altrimenti si vedrebbero le pagine aperte
  // ruotare su se stesse — che è la cosa che i libri non fanno.
  //
  // L'effetto non tiene un latch di "già fatto": punta sempre allo stato che l'URL
  // chiede e salta i tratti già a posto. Un latch su ref verrebbe consumato dalla
  // doppia invocazione di StrictMode — che rigioca l'effetto sulla *stessa*
  // istanza, quindi con il ref già scritto — e il giro non partirebbe mai.
  useEffect(() => {
    let cancelled = false;

    // Lo stato di verità è `turn`, non un flag: dice dove il volume *è*. Così
    // l'effetto non fa nulla quando è già a posto — in particolare non spalanca
    // un libro che l'utente ha appena chiuso.
    const alreadyThere = showsBackCover ? turn.get() === 1 : turn.get() === 0;
    if (alreadyThere) {
      voBookMemory.back = showsBackCover;
      return;
    }

    const run = async () => {
      if (showsBackCover) {
        if (coverProgress.get() !== 0) await animate(coverProgress, 0, CLOSE_TRANSITION);
        if (cancelled) return;
        await animate(turn, 1, TURN_TRANSITION);
      } else {
        await animate(turn, 0, TURN_TRANSITION);
        if (cancelled) return;
        // Si torna nel libro: la quarta implica volume chiuso, quindi si riapre.
        await animate(coverProgress, 1, CLOSE_TRANSITION);
        if (cancelled) return;
        // Senza questo il volume tornava aperto *nell'aspetto* ma non nello stato:
        // rotella, tagli e tastiera restavano morti finché non si ricaricava.
        openedRef.current = true;
        setOpened(true);
      }
      if (!cancelled) voBookMemory.back = showsBackCover;
    };
    run();

    return () => {
      cancelled = true;
    };
  }, [coverProgress, showsBackCover, turn]);

  // Gli appunti si leggono una volta e vivono nello store: il contesto delle
  // facciate deve restare stabile, o la ricerca butterebbe la cache del libro.
  useEffect(() => {
    let alive = true;
    // Solo se il server non li ha già dati: chi arriva sfogliando non ha mai
    // fatto una richiesta per la route del taccuino.
    if ((initialNotes?.length ?? 0) > 0) return;
    fetch("/api/tenant/valentina-orciuoli/blog/notes")
      .then((res) => res.json())
      .then((data) => {
        if (!alive || !Array.isArray(data.posts)) return;
        setPosts(voNotesFromPosts(data.posts as BlogPost[], locale));
        setPostsLoaded(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [initialNotes, locale]);

  useEffect(() => {
    let alive = true;
    fetch("/api/tenant/valentina-orciuoli/creative-works")
      .then((res) => res.json())
      .then((data) => {
        if (alive && Array.isArray(data.works) && data.works.length) setWorks(data.works);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // `spreadIndexByPathname` ripiega sul frontespizio per ogni URL che non sia
  // una pagina sfogliabile: la quarta di copertina e l'appendice finivano così
  // per accendere anche "Home" nel menu. Qui la sezione corrente può non
  // esistere, ed è esattamente quello che serve alla testatina.
  const currentSpreadId =
    showsBackCover || appendix || onDesk
      ? null
      : (voSpreads[spreadIndexByPathname(pathname)]?.id ?? null);

  // Il segnalibro ricorda dov'eri: sulla quarta di copertina serve a rientrare
  // esattamente alla pagina che si stava leggendo.
  const resumeSpread =
    (voBookMemoryAvailable ? voSpreads[voBookMemory.spread] : undefined) ?? voSpreads[0];

  const hrefFor = useCallback(
    (id: string) => spreadHref(voSpreads[spreadIndexById(id)], route),
    [route],
  );


  // Il folio stampato: la pagina destra di uno spread porta sempre un numero dispari.
  const folioFor = useCallback((id: string) => spreadIndexById(id) * 2 + 1, []);

  const articleHref = useCallback(
    (slug: string) => voArticleHref(slug, route),
    [route],
  );
  /** Gli href scritti in gestione (CTA delle opere, linktree) vanno riportati all'host corrente. */
  const internalHref = useCallback(
    (href: string) => voLocalizeInternalHref(href, route),
    [route],
  );
  /** Aprire un appunto non gira una pagina: sposta lo sguardo sulla scrivania. */
  const openArticle = useCallback(
    (slug: string) => voPushUrl(articleHref(slug)),
    [articleHref],
  );

  // La navigazione interna passa sempre dall'URL: il libro insegue il pathname,
  // così link, nav e back del browser producono tutti lo stesso sfogliare.
  const goTo = useCallback(
    (id: string) => {
      voPushUrl(hrefFor(id));
    },
    [hrefFor],
  );

  const ctx: VoBookContext = useMemo(
    () => ({
      works,
      newsletter: {
        sent: newsletter.newsletterSent,
        pending: newsletter.newsletterPending,
        error: newsletter.newsletterError,
        onSubmit: newsletter.handleNewsletterSubmit,
      },
      hrefFor,
      goTo,
      folioFor,
      hasPage: hasSpread,
      posts,
      postsLoaded,
      articleHref,
      internalHref,
      openArticle,
    }),
    [
      articleHref,
      folioFor,
      internalHref,
      goTo,
      hrefFor,
      openArticle,
      newsletter.handleNewsletterSubmit,
      newsletter.newsletterError,
      newsletter.newsletterPending,
      newsletter.newsletterSent,
      posts,
      postsLoaded,
      works,
    ],
  );

  const renderFace = useCallback(
    (spread: VoSpread, side: "left" | "right") => renderVoFace(spread, side, ctx),
    [ctx],
  );

  // L'errata ha due richiami che sfogliano: come le facciate del volume, anche
  // l'appendice ha bisogno del contesto per farlo.
  const renderAppendix = useCallback(
    (entry: VoAppendix, side: "left" | "right") => renderVoAppendixFace(entry, side, ctx),
    [ctx],
  );

  // Sulla quarta il libro è chiuso e nessuno dei due gestori della rotella è
  // attivo. Senza questo, chi naviga scorrendo ci resterebbe intrappolato.
  // Il ref segue la pagina da riprendere: il gestore della rotella vive in un
  // effetto con dipendenze stabili e non deve richiudersi su un valore vecchio.
  const resumeHrefRef = useRef("");
  resumeHrefRef.current = spreadHref(resumeSpread, route);
  useEffect(() => {
    if (!showsBackCover) return;
    const element = stageRef.current;
    if (!element) return;

    let lock = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY >= 0) return;
      const now = performance.now();
      if (now < lock) return;
      lock = now + 900;
      voPushUrl(resumeHrefRef.current);
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [showsBackCover]);

  /** Sfogliare oltre l'ultima pagina porta alla quarta: è lì che il volume finisce. */
  const goToBackCover = useCallback(() => {
    voPushUrl(backCoverHref(route));
  }, [route]);

  const closeBook = useCallback(() => {
    setOpened(false);
    openedRef.current = false;
    ceremonyAccRef.current = 0;
    animate(coverProgress, 0, CEREMONY_OPEN_TRANSITION);
  }, [coverProgress]);

  /** Lascia la scrivania e riporta lo sguardo sul volume, dove l'ha lasciato. */
  const goBackToBook = useCallback(() => {
    voPushUrl(hrefFor("blog"));
  }, [hrefFor]);

  return (
    <main
      className="vo-site vo-book-site"
      data-opened={opened || undefined}
      data-compact={compact || undefined}
    >
      <header className="vo-book-nav" aria-label="Sezioni del libro">
        <VoBookLink className="vo-book-nav-mark" href={hrefFor("home")}>
          v.o.
        </VoBookLink>
        <nav>
          {voSpreads
            .filter((entry) => entry.inNav)
            .map((entry) => (
              <VoBookLink
                key={entry.id}
                data-vo-nav={entry.id}
                href={spreadHref(entry, route)}
                aria-current={currentSpreadId === entry.id ? "page" : undefined}
              >
                {entry.navLabel}
              </VoBookLink>
            ))}
          <VoBookLink
            href={backCoverHref(route)}
            aria-current={showsBackCover ? "page" : undefined}
          >
            {voBackCover.navLabel}
          </VoBookLink>
        </nav>
      </header>

      <div className="vo-world">
      <motion.div
        className="vo-book-viewport"
        ref={stageRef}
        data-ceremony={closed || undefined}
        // Sulla scrivania il volume torna un oggetto cliccabile: è l'orecchio
        // di carta nell'angolo, non un bottone a parte, quello che riporta lo
        // sguardo su di lui — com'è un libro vero sul tavolo.
        data-desk={onDesk || undefined}
        onClick={closed ? openBook : onDesk ? goBackToBook : undefined}
        style={{
          transformPerspective: 1500,
          opacity: bookFade,
          scale: bookScale,
          rotateY: bookTurn,
          rotateZ: bookTilt,
          x: bookX,
          y: bookY,
        }}
      >
        {/* `inert` mentre si legge un appunto: le pagine e i comandi restano
            fuori fuoco e non rubano tocchi né tabulazioni. Sta sul volume e sui
            comandi, non sul contenitore — quel clic è ora del contenitore. */}
        <div className="vo-volume" inert={onDesk || undefined}>
            <VoBookShell
              initialSpread={initialSpread}
              renderFace={renderFace}
              open={opened && !showsBackCover && !onDesk}
              cover={<VoCover progress={coverProgress} />}
              coverProgress={coverProgress}
              turn={turn}
              backCover={
                <VoBackCover hidden={!showsBackCover} />
              }
              soundEnabled
              onCompactChange={setCompact}
              appendix={appendix}
              entryAppendix={notFound}
              renderAppendix={renderAppendix}
              onLeaveAppendix={() =>
                voPushUrl(spreadHref(resumeSpread, route))
              }
              insert={
                bookmarked ? (
                  <VoNewsletterTab
                    onPick={() => setInsertOpen(true)}
                    reversed={showsBackCover}
                  />
                ) : null
              }
              onBeforeFirstPage={closeBook}
              onPastLastPage={goToBackCover}
              bookmark={
                showsBackCover ? (
                  <VoBookLink
                    className="vo-bookmark"
                    href={spreadHref(resumeSpread, route)}
                    aria-label={`Riprendi la lettura da ${resumeSpread.navLabel}`}
                  >
                    <span className="vo-bookmark-tail" aria-hidden="true" />
                  </VoBookLink>
                ) : (
                  <span className="vo-bookmark" aria-hidden="true">
                    <span className="vo-bookmark-tail" />
                  </span>
                )
              }
            />
        </div>

        {closed ? (
          <button
            type="button"
            className="vo-cover-prompt"
            inert={onDesk || undefined}
            onClick={openBook}
          >
            Scorri o tocca per aprire il libro
            <span aria-hidden="true" />
          </button>
        ) : null}

        {showSwipeHint ? (
          <div className="vo-swipe-hint" aria-hidden="true">
            <span className="vo-swipe-hint-chevron" data-dir="prev">
              ‹
            </span>
            <span className="vo-swipe-hint-label">scorri di lato per sfogliare</span>
            <span className="vo-swipe-hint-chevron" data-dir="next">
              ›
            </span>
          </div>
        ) : null}
      </motion.div>

      {/* La seconda scena. Non sostituisce il volume: gli sta accanto, e la
          camera trasla fra le due. */}
      <motion.div
        className="vo-desk-scene"
        inert={!onDesk || undefined}
        style={{
          opacity: deskFade,
          scale: deskScale,
          rotateY: deskTurn,
          x: deskDrift,
          transformPerspective: 1500,
        }}
      >
        <VoDesk notes={posts} current={article} onOpen={openArticle} />
      </motion.div>

      {/* L'appiglio per tornare indietro, in parole. Il libro nell'angolo si
          può cliccare direttamente, ma resta un pulsante vero e raggiungibile
          da tastiera per chi non lo vede o non punta un mouse. */}
      {onDesk ? (
        <button type="button" className="vo-desk-back-to-book" onClick={goBackToBook}>
          Torna al libro
        </button>
      ) : null}
      </div>

      {/*
       * Non più una barra di piede: due richiami e basta.
       *
       * Proprietà, firme e area riservata sono passate al colophon sulla quarta
       * di copertina, dov'è il loro posto in un volume. Privacy e cookie no:
       * un'informativa deve restare raggiungibile da *ogni* pagina senza
       * cercarla, e due clic dietro un libro che si gira non sono la stessa
       * cosa. Questa riga è il minimo che lo garantisce senza rifare un piede.
       */}
      <footer className="vo-book-footer">
        <span className="vo-book-footer-links">
          {voAppendix.map((entry) => (
            <VoBookLink
              key={entry.id}
              href={appendixHref(entry, route)}
              aria-current={appendix?.id === entry.id ? "page" : undefined}
            >
              {entry.navLabel}
            </VoBookLink>
          ))}
          <a href={gestioneHref} target="_blank" rel="noopener noreferrer">
            Gestione
          </a>
        </span>
        {/* I crediti stanno qui su schermo largo e sulla quarta di copertina su
            schermo stretto: è il CSS a scegliere, in base a `data-compact`. Un
            piede su un telefono è già stretto per i soli richiami legali, e la
            quarta è il posto dove un libro vero nomina lo stampatore. */}
        <span className="vo-book-footer-credits">
          Realizzato da{" "}
          <a href="https://pynkstudio.eu" target="_blank" rel="noopener noreferrer">
            PynkStudio
          </a>
          <span aria-hidden="true">·</span>
          <a href="https://weuseorpheo.com" target="_blank" rel="noopener noreferrer">
            Powered by Orpheo
          </a>
        </span>
      </footer>

      <VoNewsletterInsert
        open={insertOpen}
        sent={newsletter.newsletterSent}
        pending={newsletter.newsletterPending}
        error={newsletter.newsletterError}
        onClose={() => setInsertOpen(false)}
        onSubmit={newsletter.handleNewsletterSubmit}
      />
    </main>
  );
}
