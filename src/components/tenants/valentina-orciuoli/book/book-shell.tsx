"use client";

import { animate, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { VoLeaf } from "@/components/tenants/valentina-orciuoli/book/leaf";
import { voPushUrl } from "@/components/tenants/valentina-orciuoli/book/book-navigation";
import { usePageSound } from "@/components/tenants/valentina-orciuoli/book/use-page-sound";
import {
  voBookMemory,
  voBookMemoryAvailable,
} from "@/components/tenants/valentina-orciuoli/book/book-memory";
import {
  isBackCoverPathname,
  isBookPathname,
  leafFaces,
  spreadHref,
  spreadIndexByPathname,
  voSpreadCount,
  voSpreads,
  type VoAppendix,
  type VoFaceSide,
  type VoSpread,
} from "@/components/tenants/valentina-orciuoli/book/book-map";
import { voRoute } from "@/components/tenants/valentina-orciuoli/routes";

/**
 * Quanto si solleva il foglio quando il puntatore è proprio sul taglio.
 *
 * Un decimo di corsa sono diciotto gradi: passandoci accanto col mouse la pagina
 * si spalancava come un cancello, e un libro vero non fa nulla finché non lo
 * tocchi. Undici gradi bastano ad accennare — la carta prende luce sul taglio, il
 * suo spessore si stacca dalla pagina sotto e l'ombra portata comincia a sfilare —
 * senza che l'affordance diventi un movimento a sé.
 */
const HINT_MAX = 0.062;
/** Entro quanti pixel dal taglio il foglio comincia a sollevarsi. */
const HINT_PROXIMITY = 120;
const DRAG_COMMIT_THRESHOLD = 0.3;
/**
 * Un colpetto veloce è un gesto compiuto anche se il pollice non arriva a metà
 * corsa: sopra questa velocità (corse al secondo) il foglio parte comunque.
 * Senza, sul telefono bisognava trascinare mezza pagina per girarla e il libro
 * sembrava incollato.
 */
const FLICK_VELOCITY = 0.85;
/** Pixel di traverso prima di decidere che il tocco è una sfogliata e non uno scorrimento. */
const SWIPE_SLOP = 12;
/**
 * Oltre questi pixel il puntatore ha *trascinato*, non cliccato.
 *
 * Il taglio è insieme una presa e un pulsante, e il browser fa scoccare il clic
 * anche quando il puntatore è finito a mezza pagina di distanza: la cattura
 * riporta il rilascio sul bottone da cui il gesto era partito. Il trascinamento
 * girava la sua pagina, il clic ne chiedeva un'altra, e il libro avanzava di due
 * — con l'URL fermo alla prima, perché la seconda era una richiesta in coda.
 */
const CLICK_SLOP = 4;
/**
 * `deltaY` non è in pixel dappertutto: `deltaMode` 1 conta righe (Firefox con una
 * rotella vera manda ~3) e 2 conta pagine. Senza normalizzare, su quei browser
 * girare una pagina richiederebbe decine di scatti.
 */
export const WHEEL_LINE_PX = 16;
/** Tetto per singolo evento: l'inerzia di un trackpad manda colpi enormi. */
export const WHEEL_MAX_STEP = 160;
/** Pixel di rotella che valgono un giro pagina intero. */
const WHEEL_SPAN = 300;
/** Silenzio dopo cui la rotella si considera lasciata andare. */
const WHEEL_IDLE_MS = 110;
/**
 * Dopo un giro concluso, la pausa prima che la rotella ne apra un altro. La coda
 * d'inerzia di un trackpad arriva quando il foglio si è già posato: senza questa
 * pausa aprirebbe da sola il giro successivo, e un colpo solo ne girerebbe tre.
 */
/**
 * Quanto **silenzio** serve prima che la rotella possa aprire un giro nuovo.
 *
 * Non è un tempo fisso dopo il giro precedente: quello era il difetto. Un flick
 * di trackpad produce sette-ottocento pixel di scorrimento, il giro si compie ai
 * primi trecento, e gli altri quattrocento continuano ad arrivare per quasi un
 * secondo — ben oltre qualunque attesa fissa. Ognuno di quegli eventi apriva un
 * gesto nuovo che, trovando un foglio ancora in volo, finiva **in coda** come
 * pagina successiva: una scorsa sola girava due o tre pagine.
 *
 * Finché gli eventi arrivano il blocco si sposta in avanti. Un gesto nuovo
 * comincia solo dopo che la mano si è davvero fermata, che è l'unico modo di
 * distinguere una seconda intenzione dalla coda della prima.
 */
const WHEEL_QUIET_MS = 160;
/** La rotella non è un puntatore, ma prende in prestito lo stesso trascinamento. */
const WHEEL_POINTER_ID = -1;
/**
 * Quanto il libro resta sordo agli input subito dopo essersi aperto.
 *
 * La copertina si apre con una rotellata o una scorsa del pollice, e l'inerzia
 * di quel gesto arriva *dopo* che il volume è già aperto: il primo ascoltatore
 * ha finito il suo lavoro, il secondo lo raccoglie e gira una pagina — a volte
 * due. Chi apriva il libro non vedeva mai il frontespizio, si ritrovava
 * direttamente sull'indice delle opere.
 */
const OPEN_GRACE_MS = 750;
const MAX_ANIMATED_LEAVES = 3;
/**
 * Oltre questo tempo un giro pagina si considera concluso comunque. La molla ci
 * mette mezzo secondo scarso: è un margine, non un tempo di riferimento.
 */
const RUN_TIMEOUT_MS = 1800;
const LEAF_STAGGER_MS = 90;
/**
 * Di quanto il foglio in volo sta davanti al blocco pagine. Deve bastare a
 * togliere ogni ambiguità di profondità con le pagine ferme — due piani a
 * distanza nulla in una scena `preserve-3d` si contendono il posto e si vedono a
 * chiazze — e restare abbastanza piccola da non produrre parallasse: a 2800px di
 * fuga, tre pixel valgono meno di uno a schermo.
 */
const LEAF_BASE_DEPTH = 2.4;
const LEAF_DEPTH_STEP = 0.7;

type GestureMode = "hint" | "drag" | "run";

type Gesture = {
  token: number;
  from: number;
  to: number;
  dir: 1 | -1;
  /** Indici dei fogli animati, nell'ordine in cui si muovono. */
  leaves: number[];
  mode: GestureMode;
  /**
   * La posizione di lettura da riportare sulla faccia del foglio che copre la
   * pagina lasciata. Si legge quando il gesto si arma, non dopo: un attimo più
   * tardi quella pagina è già stata sostituita.
   */
  carry?: { front: number; back: number };
  /**
   * La corsa raccoglie un foglio già in aria invece di lanciarne uno da fermo.
   * Serve a distinguerla da un salto nuovo, che parte sempre da un capo: senza,
   * un foglio lasciato oltre metà corsa veniva riportato al dorso e rigirato.
   */
  resumed?: boolean;
};

// Una pagina di carta è leggera ma incontra l'aria: si posa senza rimbalzare.
// Smorzamento appena sotto il critico, così arriva dritta e non oscilla.
//
// La molla di prima era sovrasmorzata e pesante: la coda per rientrare nella
// tolleranza durava oltre un secondo, e per tutto quel tempo il foglio era
// tecnicamente in volo — il libro sordo ai gesti successivi e la carta ferma a
// un capello dalla pagina. Mezzo secondo scarso è il tempo di un giro pagina vero.
const flipSpring = {
  type: "spring",
  stiffness: 150,
  damping: 24,
  mass: 1,
  restDelta: 0.0015,
  restSpeed: 0.02,
} as const;
const hintSpring = { type: "spring", stiffness: 150, damping: 20, mass: 0.9 } as const;
/**
 * Il foglio lasciato cadere sotto soglia: torna al suo posto più deciso della
 * molla d'accenno, altrimenti resta a mezz'aria abbastanza da sembrare un bug.
 */
const releaseSpring = { type: "spring", stiffness: 190, damping: 24, mass: 0.85 } as const;
/**
 * La rotella detta il bersaglio, questa molla ci arriva. Serve perché gli scatti
 * di un mouse sono discreti: seguirli di pari passo farebbe avanzare il foglio a
 * scatti, e un foglio che scatta non è carta.
 */
const wheelFollow = {
  type: "spring",
  stiffness: 380,
  damping: 38,
  mass: 0.7,
  restDelta: 0.0005,
} as const;

/**
 * Quali fogli animare per andare da `from` a `to`. Oltre tre fogli l'occhio non
 * distingue più i singoli passaggi, quindi si tengono il primo, uno di mezzo e
 * l'ultimo: il primo porta la pagina di partenza, l'ultimo quella d'arrivo.
 */
function leavesForJump(from: number, to: number) {
  const forward = to > from;
  const all: number[] = [];
  if (forward) {
    for (let i = from; i <= to - 1; i += 1) all.push(i);
  } else {
    for (let i = from - 1; i >= to; i -= 1) all.push(i);
  }
  if (all.length <= MAX_ANIMATED_LEAVES) return all;
  return [all[0], all[Math.floor(all.length / 2)], all[all.length - 1]];
}

/**
 * Sotto il punto di rottura la doppia pagina è illeggibile e il libro passa a
 * pagina singola.
 *
 * La soglia è dichiarata **una volta sola, qui**, e il foglio di stile la segue
 * tramite `[data-compact]`. Prima era una media query nel CSS *e* una in
 * JavaScript: due verità che possono divergere, e quando è successo si è ottenuto
 * il peggio dei due modi — la pagina sinistra visibile per il CSS ma riempita con
 * la stessa facciata della destra dal componente. Il modo è una decisione di
 * comportamento, non di aspetto: deve appartenere a chi costruisce le pagine.
 */
const COMPACT_BREAKPOINT = "(max-width: 899px)";

/**
 * Prima della pittura sul client, dopo il montaggio sul server. Il modo del libro
 * deve essere deciso *prima* che il fotogramma esca: cambiare sezione rimonta il
 * componente, e con un `useEffect` normale il primo fotogramma dopo il rimontaggio
 * usciva a doppia pagina anche su un telefono — un lampo di libro spalancato in
 * mezzo a ogni giro. `useLayoutEffect` sul server non ha senso e avviserebbe.
 */
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useCompactBook(stageRef: RefObject<HTMLDivElement | null>) {
  const [compact, setCompact] = useState(false);

  useBeforePaint(() => {
    const query = window.matchMedia(COMPACT_BREAKPOINT);
    const read = () => setCompact(query.matches);

    read();
    query.addEventListener("change", read);

    // Un `ResizeObserver` sull'elemento invece di un listener sulla finestra:
    // osserva la cosa che conta davvero — la scatola del libro — e scatta anche
    // quando l'evento `resize` non arriva, cosa che succede più spesso di quanto
    // si creda (pannelli incorporati, cambi di zoom, barre che compaiono).
    const observer = new ResizeObserver(read);
    const element = stageRef.current;
    if (element) observer.observe(element);
    window.addEventListener("resize", read);
    // `visualViewport` coglie i cambi che non passano da `resize` — barre del
    // browser che compaiono, zoom, pannelli incorporati. Nessuno di questi tre
    // inneschi ripete la soglia: la leggono tutti dallo stesso posto.
    window.visualViewport?.addEventListener("resize", read);

    return () => {
      query.removeEventListener("change", read);
      observer.disconnect();
      window.removeEventListener("resize", read);
      window.visualViewport?.removeEventListener("resize", read);
    };
  }, [stageRef]);

  return compact;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function VoBookShell({
  initialSpread,
  renderFace,
  open,
  cover,
  coverProgress,
  turn,
  backCover,
  soundEnabled,
  bookmark,
  insert,
  onBeforeFirstPage,
  onPastLastPage,
  onCompactChange,
  appendix,
  entryAppendix,
  onLeaveAppendix,
  renderAppendix,
}: {
  initialSpread: number;
  renderFace: (spread: VoSpread, side: VoFaceSide) => ReactNode;
  /** Il libro accetta input solo a copertina aperta. */
  open: boolean;
  /** Resa dentro `.vo-book`: deve condividere lo stesso contesto `preserve-3d` dei fogli. */
  cover: ReactNode;
  /** 0 = volume chiuso, 1 = copertina completamente ribaltata. */
  coverProgress: MotionValue<number>;
  /** 0 = si guarda il fronte, 1 = il volume è rigirato sulla quarta di copertina. */
  turn: MotionValue<number>;
  backCover: ReactNode;
  soundEnabled: boolean;
  /** Nastro segnalibro: reso qui perché deve stare nel contesto 3D del volume. */
  bookmark: ReactNode;
  /** Cedola infilata fra le pagine: come il segnalibro, appartiene al volume. */
  insert: ReactNode;
  /** Chiamata quando si prova a tornare indietro dalla prima pagina: lì c'è la copertina. */
  onBeforeFirstPage?: () => void;
  /** Chiamata sfogliando oltre l'ultima pagina: lì c'è la quarta di copertina. */
  onPastLastPage?: () => void;
  /** Riporta il modo alla radice del sito, che ne veste testatina, comandi e piede. */
  onCompactChange?: (compact: boolean) => void;
  /** Appendice aperta dai richiami nel piede, fuori dalla sequenza sfogliabile. */
  appendix: VoAppendix | null;
  /**
   * L'appendice è il punto d'ingresso, non un salto: il volume ci si apre sopra
   * senza sfogliare. Serve all'errata, che non ha un URL da inseguire — la
   * pagina che manca non è un indirizzo del libro, e senza questo il volume
   * resterebbe fermo dov'era mostrando tutt'altro.
   */
  entryAppendix?: boolean;
  /** Chiamata quando si esce dall'appendice tornando alla lettura. */
  onLeaveAppendix?: () => void;
  renderAppendix: (entry: VoAppendix, side: VoFaceSide) => ReactNode;
}) {
  const pathname = usePathname();
  const reducedMotion = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const compact = useCompactBook(stageRef);

  useEffect(() => {
    onCompactChange?.(compact);
  }, [compact, onCompactChange]);

  // La scatola misurata invecchia a ogni ridimensionamento: si butta e si rilegge.
  useEffect(() => {
    const forget = () => {
      stageRectRef.current = null;
    };
    forget();
    window.addEventListener("resize", forget);
    window.visualViewport?.addEventListener("resize", forget);
    return () => {
      window.removeEventListener("resize", forget);
      window.visualViewport?.removeEventListener("resize", forget);
    };
  }, [compact]);
  const playPageSound = usePageSound(soundEnabled && !reducedMotion);

  // Il volume si è appena aperto: si prende un attimo prima di accettare gesti,
  // altrimenti l'inerzia della scorsa che l'ha aperto gira subito una pagina.
  useEffect(() => {
    if (!open) return;
    inputLockRef.current = performance.now() + OPEN_GRACE_MS;
  }, [open]);
  // Prefisso host + lingua dell'URL corrente: gli href pubblicati devono
  // restare sull'indirizzo da cui si sta leggendo (preview o dominio custom).
  const route = useMemo(() => voRoute(pathname), [pathname]);

  // Se il volume era già aperto si riparte da dove eravamo, non dalla pagina
  // d'arrivo: è la differenza fra le due che l'effetto sul pathname trasforma in
  // fogli che girano.
  const [spread, setSpread] = useState(() =>
    voBookMemoryAvailable && voBookMemory.opened ? voBookMemory.spread : initialSpread,
  );

  useEffect(() => {
    voBookMemory.spread = spread;
  }, [spread]);

  /**
   * Su schermo stretto la doppia pagina non esiste: si mostra una facciata alla
   * volta, e girare la pagina avanza di *mezzo* spread. `half` dice quale delle
   * due facciate è in vista; su schermo largo non ha significato e viene ignorato.
   *
   * Lo stato resta in unità di spread — è quello che l'URL, la memoria e i
   * numeri di pagina conoscono — e la posizione si deriva dal modo corrente, così
   * un cambio di larghezza non corrompe nulla.
   *
   * Come lo spread, la facciata sopravvive a un rimontaggio: cambiare sezione
   * rimonta il componente, e ripartire da zero riportava indietro di una pagina
   * chi aveva appena girato sulla facciata destra.
   */
  const [half, setHalf] = useState(() =>
    voBookMemoryAvailable && voBookMemory.opened ? voBookMemory.half : 0,
  );

  useEffect(() => {
    voBookMemory.half = half;
  }, [half]);
  const positionCount = compact ? voSpreadCount * 2 : voSpreadCount;
  const toPos = useCallback(
    (targetSpread: number, targetHalf: number) =>
      compact ? targetSpread * 2 + targetHalf : targetSpread,
    [compact],
  );
  const fromPos = useCallback(
    (position: number) =>
      compact
        ? { spread: Math.floor(position / 2), half: position % 2 }
        : { spread: position, half: 0 },
    [compact],
  );
  /**
   * L'appendice occupa una posizione *virtuale* subito oltre l'ultima pagina. Sta
   * fuori dai limiti usati dalla navigazione manuale, quindi sfogliando non ci si
   * arriva mai; ma essendo una posizione come le altre, il salto per raggiungerla
   * riusa il motore dei fogli e si vede il libro sfogliare fino in fondo.
   */
  const appendixPos = positionCount;

  /**
   * Se il volume era già aperto si parte da dov'eravamo e l'appendice diventa un
   * *bersaglio*: la differenza fra le due posizioni è ciò che l'effetto sul
   * pathname trasforma in un riffle fino in fondo al libro. Chi invece apre un
   * richiamo legale da un link diretto ci si trova già, senza sfogliata inutile.
   */
  const [atAppendix, setAtAppendix] = useState(
    () =>
      Boolean(appendix) &&
      (entryAppendix || !(voBookMemoryAvailable && voBookMemory.opened)),
  );
  const pos = atAppendix ? appendixPos : toPos(spread, half);
  /** Come `gestureRef`: la posizione che vale per un input arrivato prima del render. */
  const posRef = useRef(pos);
  posRef.current = pos;

  const [gesture, setGestureState] = useState<Gesture | null>(null);

  /**
   * Il gesto in corso, leggibile *subito*.
   *
   * Lo stato React arriva al render dopo, e tre frecce premute nello stesso
   * fotogramma leggevano tutte "nessun gesto in corso": ognuna ripartiva dalla
   * stessa pagina e le tre insieme ne giravano una. Chi sfoglia in fretta lo
   * vedeva come un libro che perde i colpi. Ogni scrittura passa di qui, quindi
   * il riferimento è la verità e lo stato serve solo a ridisegnare.
   */
  const gestureRef = useRef<Gesture | null>(null);
  const setGesture = useCallback(
    (next: Gesture | null | ((current: Gesture | null) => Gesture | null)) => {
      const value = typeof next === "function" ? next(gestureRef.current) : next;
      gestureRef.current = value;
      setGestureState(value);
    },
    [],
  );

  const tokenRef = useRef(0);
  /** Corsa accumulata dalla rotella nel gesto in corso, e il suo tempo di guardia. */
  const wheelRef = useRef<{ travel: number; idle: number } | null>(null);
  const wheelLockRef = useRef(0);
  /**
   * Fino a quando ignorare un gesto *nuovo*. Serve solo all'apertura: la coda
   * del gesto che ha spalancato la copertina non deve valere anche come
   * richiesta di girare la prima pagina.
   */
  const inputLockRef = useRef(0);
  const dragRef = useRef<{
    startX: number;
    /** Corsa in pixel che vale un giro pagina intero. */
    span: number;
    /** Da dove parte il foglio: un accenno già sollevato non ricomincia dal dorso. */
    base: number;
    /**
     * Dove il gesto ha chiesto di portare il foglio. Non coincide con la
     * posizione del foglio quando è una molla a inseguire il bersaglio, ed è
     * *questo* il valore su cui si decide se il giro è compiuto: il dito che ha
     * spinto fin lì lo ha già deciso, la carta deve solo arrivarci.
     */
    target: number;
    /** Il gesto ha davvero trascinato: il clic che segue è la coda della presa. */
    moved: boolean;
    pointerId: number;
  } | null>(null);
  /** La scatola del libro, letta una volta per passaggio del puntatore e non per evento. */
  const stageRectRef = useRef<DOMRect | null>(null);
  /** Il clic che il browser fa scoccare a fine trascinamento, da lasciar cadere. */
  const swallowClickRef = useRef(false);

  // Tre fogli animabili al massimo: i motion value sono fissi, cambia chi li usa.
  const p0 = useMotionValue(0);
  const p1 = useMotionValue(0);
  const p2 = useMotionValue(0);
  const progressValues = useMemo(() => [p0, p1, p2], [p0, p1, p2]);

  const busy = gesture?.mode === "run";

  // Da chiuso il volume mostra solo la copertina, quindi va centrato sulla metà
  // destra; si riallinea al centro reale mentre il cartoncino si apre. La pagina
  // sinistra compare solo quando la copertina ha passato la verticale.
  const blockShift = useTransform(coverProgress, [0, 0.55], [compact ? "0%" : "-25%", "0%"]);
  const volumeTurn = useTransform(turn, [0, 1], [0, 180]);
  /**
   * La prima pagina **è il dietro della copertina**: non compare, scende con lei.
   *
   * Prima era un foglio a sé che si accendeva in dissolvenza sotto il piatto in
   * volo, e si vedeva per quello che era — una pagina che si materializza. Il
   * problema non era *quando* la dissolvenza cominciava: era che ci fosse una
   * dissolvenza. Un libro che si apre non fa comparire niente, scopre.
   *
   * Ora la pagina condivide il cardine del piatto e ci ruota insieme, sfalsata di
   * 180°: sono le due facce dello stesso movimento. A volume chiuso guarda dalla
   * parte opposta e `backface-visibility` la toglie di mezzo senza bisogno di
   * opacità; passata la verticale si gira verso di noi e si posa esattamente dove
   * deve stare, perché parte e arriva alla posizione della pagina.
   */
  const leftPageTurn = useTransform(coverProgress, (p) => 180 - p * 180);
  /**
   * Il taglio del blocco pagine invece è decorazione, non carta: quello può
   * accendersi quando il volume è ormai aperto.
   */
  const edgeOpacity = useTransform(coverProgress, [0.86, 0.99], [0, 1]);

  /**
   * Le facciate già costruite, per posizione. Un gesto rimonta lo shell almeno
   * due volte — quando i fogli partono e quando si posano — e senza questa cache
   * ogni render ricostruiva da zero l'albero di *tutte* le pagine in scena, fogli
   * in volo compresi. Restituire lo stesso elemento fa uscire React dal sottoalbero
   * senza toccarlo, ed è la differenza fra un giro pagina liscio e uno che perde
   * fotogrammi proprio sul primo e sull'ultimo.
   *
   * `useMemo` è la scadenza: quando cambia una delle sorgenti la mappa è nuova.
   */
  const sheetCache = useMemo(
    () => new Map<string, ReactNode>(),
    [appendix, compact, positionCount, renderAppendix, renderFace],
  );

  /**
   * La carta muta dei fogli intermedi di un salto. Di un riffle si vedono davvero
   * solo due facciate — quella da cui si parte e quella su cui si atterra — e
   * impaginare le altre costa quanto impaginarle tutte.
   */
  const fillerSheet = useMemo(
    () => (
      <div className="vo-page-sheet vo-page-sheet-blank">
        <div className="vo-page-grain" aria-hidden="true" />
      </div>
    ),
    [],
  );

  const buildSheet = useCallback(
    (position: number, side: VoFaceSide) => {
      if (position === appendixPos) {
        if (!appendix) return <div className="vo-page-sheet vo-page-sheet-blank" />;
        const face: VoFaceSide = compact ? "right" : side;
        return (
          <div className="vo-page-sheet" data-side={face} data-spread="appendice">
            <div className="vo-page-grain" aria-hidden="true" />
            <div className="vo-page-running-head" aria-hidden="true">
              <span>{face === "left" ? "Valentina Orciuoli" : appendix.runningHead}</span>
            </div>
            <div className="vo-page-body" data-vo-scroll="">
              {renderAppendix(appendix, face)}
            </div>
          </div>
        );
      }
      if (position < 0 || position >= positionCount) {
        return <div className="vo-page-sheet vo-page-sheet-blank" />;
      }
      const { spread: targetSpread, half: targetHalf } = fromPos(position);
      // In compatto la posizione *è* la facciata: il lato richiesto dal chiamante
      // vale solo quando le due pagine convivono.
      const face: VoFaceSide = compact ? (targetHalf === 0 ? "left" : "right") : side;
      const meta = voSpreads[targetSpread];
      const folio = targetSpread * 2 + (face === "right" ? 1 : 0);
      return (
        <div className="vo-page-sheet" data-side={face} data-spread={meta.id}>
          <div className="vo-page-grain" aria-hidden="true" />
          <div className="vo-page-running-head" aria-hidden="true">
            <span>{face === "left" ? "Valentina Orciuoli" : meta.runningHead}</span>
          </div>
          <div className="vo-page-body" data-vo-scroll="">
            {renderFace(meta, face)}
          </div>
          {folio > 0 ? (
            <span className="vo-page-folio" aria-hidden="true">
              {folio}
            </span>
          ) : null}
        </div>
      );
    },
    [appendix, appendixPos, compact, fromPos, positionCount, renderAppendix, renderFace],
  );

  const pageSheet = useCallback(
    (position: number, side: VoFaceSide) => {
      // In compatto la facciata la detta la posizione, non il lato richiesto: due
      // chiavi diverse per lo stesso foglio sprecherebbero la cache.
      const key = compact ? `${position}` : `${position}:${side}`;
      const cached = sheetCache.get(key);
      if (cached !== undefined) return cached;
      const node = buildSheet(position, side);
      sheetCache.set(key, node);
      return node;
    },
    [buildSheet, compact, sheetCache],
  );

  /**
   * Il gesto finisce, ma la carta resta dov'è.
   *
   * Prima qui si riavvolgevano i tre valori a zero. Sono scritture immediate,
   * mentre lo smontaggio del foglio passa da un render: per un fotogramma il
   * foglio appena posato a sinistra tornava spalancato sulla destra, e quello che
   * si vedeva era il *recto* — cioè il contenuto della pagina da cui si era
   * appena partiti, che lampeggiava alla fine di ogni giro.
   *
   * Riavvolgerli non serviva: ogni gesto nuovo porta il suo foglio al capo giusto
   * della corsa prima di muoverlo (`beginDrag`, `hintAt`, e il riallineamento
   * "stale" dell'effetto di corsa).
   */
  const clearGesture = useCallback(() => {
    setGesture(null);
  }, [setGesture]);

  /**
   * Il passo chiesto mentre un foglio era ancora in volo. Prima veniva scartato:
   * chi sfogliava svelto vedeva il libro ignorare un gesto su due. Uno solo si
   * mette in coda — due sarebbero l'inerzia del trackpad, non una volontà.
   */
  const queuedRef = useRef(0);
  /**
   * La sezione chiesta dall'URL mentre un foglio era ancora in volo.
   *
   * Prima veniva scartata: due clic ravvicinati in nav — o un clic durante un
   * giro — cambiavano la barra degli indirizzi e lasciavano il libro sull'altra
   * pagina. Da fuori sembrava che il volume non sapesse dove andare, ed è il
   * difetto che si notava di più perché lascia URL e pagina in disaccordo.
   */
  const pendingUrlRef = useRef<number | null>(null);

  /** Porta l'URL sulla sezione, se non ci è già. */
  const publish = useCallback(
    (targetSpread: number) => {
      // In compatto due posizioni consecutive appartengono allo stesso spread:
      // l'URL cambia solo quando cambia la sezione.
      const href = spreadHref(voSpreads[targetSpread], route);
      if (href === pathname) return;
      // Cronologia, non router: vedi `book-navigation`. Un `router.push` qui
      // rimontava il libro intero sull'ultimo fotogramma del giro.
      voPushUrl(href);
    },
    [route, pathname],
  );

  const commit = useCallback(
    (target: number) => {
      // La carta che si posa sulla pila. Il fruscio dello stacco raccontava metà
      // del gesto: senza questo, il giro finiva in silenzio proprio nel momento
      // in cui in un libro vero fa il rumore più riconoscibile.
      playPageSound("land");
      // L'appendice non è una posizione del volume: l'URL ce l'ha già portata, e
      // scriverla in `spread` la farebbe rientrare nella sequenza sfogliabile.
      if (target === appendixPos) {
        setAtAppendix(true);
        clearGesture();
        return;
      }
      const { spread: nextSpread, half: nextHalf } = fromPos(target);
      // Si scrive qui, non nell'effetto: il foglio è atterrato *adesso*. La
      // navigazione che parte due righe sotto rimonta il componente, e l'effetto
      // che avrebbe salvato la pagina appartiene all'istanza che sta per sparire —
      // non gira mai. Il libro rileggeva così la pagina precedente e tornava
      // indietro da solo di un giro ogni volta che si cambiava sezione.
      voBookMemory.spread = nextSpread;
      voBookMemory.half = nextHalf;
      setAtAppendix(false);
      setSpread(nextSpread);
      setHalf(nextHalf);
      clearGesture();
      // Cambiare sezione rimonta il libro: è lo stesso file di route con un
      // parametro diverso, e il router ricrea il segmento. Se c'è ancora un passo
      // in coda, navigare adesso significherebbe rimontare mentre il foglio
      // successivo è già in volo — e quel foglio sparirebbe a metà giro. La
      // navigazione aspetta la fine della rincorsa: una sola, alla pagina d'arrivo.
      if (queuedRef.current !== 0) return;
      publish(nextSpread);
    },
    [appendixPos, clearGesture, fromPos, playPageSound, publish],
  );

  /**
   * Dov'era arrivata la lettura sulla facciata che sta per staccarsi.
   *
   * Il foglio in volo non sposta la pagina: ne monta una copia nuova, e una copia
   * nuova nasce riavvolta in cima. Chi aveva letto mezza pagina la vedeva saltare
   * all'inizio nell'istante in cui la prendeva per girarla — e riapparire al punto
   * giusto solo se tornava indietro. Si legge qui, mentre quella facciata è ancora
   * in scena: un attimo dopo il suo posto è già della pagina d'arrivo.
   */
  const carryFor = useCallback(
    (dir: 1 | -1) => {
      const stage = stageRef.current;
      if (!stage) return undefined;
      // Andando avanti si stacca la facciata destra, tornando indietro la
      // sinistra. In compatto la sinistra non è in vista: c'è una facciata sola.
      const side = dir === 1 || compact ? "right" : "left";
      const body = stage.querySelector<HTMLElement>(`.vo-page-${side} [data-vo-scroll]`);
      const top = body?.scrollTop ?? 0;
      if (!top) return undefined;
      return dir === 1 ? { front: top, back: 0 } : { front: 0, back: top };
    },
    [compact],
  );

  const goTo = useCallback(
    (target: number) => {
      if (!open) return;
      const from = posRef.current;
      if (target < 0 || (target >= positionCount && target !== appendixPos)) return;
      if (target === from) return;
      if (gestureRef.current?.mode === "run") return;
      if (reducedMotion) {
        commit(target);
        return;
      }
      const dir: 1 | -1 = target > from ? 1 : -1;
      tokenRef.current += 1;
      setGesture({
        token: tokenRef.current,
        from,
        to: target,
        dir,
        leaves: leavesForJump(from, target),
        mode: "run",
        carry: carryFor(dir),
      });
    },
    [appendixPos, carryFor, commit, open, positionCount, reducedMotion, setGesture],
  );

  // Avvia le animazioni una volta che i fogli sono montati con lo stato di partenza.
  useLayoutEffect(() => {
    if (!gesture || gesture.mode !== "run") return;
    const { dir, leaves, to } = gesture;
    const start = dir === 1 ? 0 : 1;
    const end = dir === 1 ? 1 : 0;
    const timers: number[] = [];
    const controls = leaves.map((_, index) => {
      const value = progressValues[index];
      // Il primo foglio può arrivare da un accenno o da un trascinamento già in
      // corso: azzerarlo farebbe uno scatto, quindi si riallinea solo se è al
      // capo sbagliato della corsa.
      const current = value.get();
      // Un foglio raccolto a mezz'aria sta già dove deve stare. Il riallineamento
      // serve ai salti nuovi, il cui valore può essere rimasto al capo opposto da
      // un gesto precedente; applicarlo a una ripresa riportava al dorso un foglio
      // lasciato oltre metà corsa, che ripartiva da capo sotto gli occhi.
      const stale = dir === 1 ? current > 0.5 : current < 0.5;
      if (index > 0 || (stale && !gesture.resumed)) value.set(start);
      const control = animate(value, end, {
        ...flipSpring,
        delay: (index * LEAF_STAGGER_MS) / 1000,
      });
      // Il fruscio del primo foglio è già dovuto: farlo partire subito lo aggancia
      // al gesto invece che al fotogramma successivo. Una ripresa però ha già
      // frusciato quando il foglio si è staccato, ed è lì che la carta suona.
      if (index === 0) {
        if (!gesture.resumed) playPageSound();
      }
      else timers.push(window.setTimeout(playPageSound, index * LEAF_STAGGER_MS));
      return control;
    });
    const last = controls[controls.length - 1];
    let cancelled = false;
    last.then(() => {
      if (!cancelled) commit(to);
    });
    /**
     * La rete di sicurezza del giro.
     *
     * `commit` è appeso alla promessa della molla, e una molla interrotta —
     * scheda in secondo piano, animazione fermata da fuori — quella promessa non
     * la risolve mai. Il gesto resterebbe in corsa per sempre, e un gesto in
     * corsa blocca *ogni* input: rotella, frecce, tagli e link del menu. Da fuori
     * è un libro che si pianta su una pagina e non si muove più.
     */
    timers.push(
      window.setTimeout(() => {
        if (!cancelled) commit(to);
      }, RUN_TIMEOUT_MS + leaves.length * LEAF_STAGGER_MS),
    );
    return () => {
      cancelled = true;
      // Un gesto annullato non deve continuare a frusciare: i timer sopravvivono
      // all'animazione che li aveva programmati.
      timers.forEach((timer) => window.clearTimeout(timer));
      controls.forEach((control) => control.stop());
    };
    // `commit` cambia identità a ogni spread: la dipendenza dal token basta a
    // garantire che l'effetto giri una sola volta per gesto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gesture?.token, gesture?.mode]);

  // Back/forward del browser: il libro insegue l'URL sfogliando davvero.
  useEffect(() => {
    // Un path che il libro non impagina — un appunto sulla scrivania — non deve
    // muovere il volume né, peggio, farlo riscrivere l'URL.
    if (!isBookPathname(pathname)) return;
    if (isBackCoverPathname(pathname)) return;
    // Una sezione si apre sempre dalla sua prima facciata; l'appendice ha la sua
    // posizione virtuale in fondo, così raggiungerla è comunque uno sfogliare.
    const fromUrl = appendix ? appendixPos : toPos(spreadIndexByPathname(pathname), 0);
    if (fromUrl === pos) return;
    // Un foglio è già in volo: la richiesta non si butta, si onora appena si posa.
    if (gesture) {
      pendingUrlRef.current = fromUrl;
      return;
    }
    // L'URL nomina la *sezione*, non la facciata. Su schermo stretto una sezione
    // ne occupa due, e se si è già dentro quella giusta non c'è niente da
    // inseguire: pretenderne la prima rimandava indietro di una pagina ogni giro
    // che atterrava sulla facciata destra — il libro tornava sui suoi passi da solo.
    if (!appendix && !atAppendix && fromPos(pos).spread === spreadIndexByPathname(pathname)) return;
    if (reducedMotion) {
      const landing = fromPos(fromUrl);
      setSpread(landing.spread);
      setHalf(landing.half);
      return;
    }
    const dir: 1 | -1 = fromUrl > pos ? 1 : -1;
    tokenRef.current += 1;
    setGesture({
      token: tokenRef.current,
      from: pos,
      to: fromUrl,
      dir,
      leaves: leavesForJump(pos, fromUrl),
      mode: "run",
      carry: carryFor(dir),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendix, pathname]);

  useEffect(() => {
    if (gesture) return;
    // Prima l'URL: se nel frattempo è cambiato, è quello che l'utente ha chiesto.
    const pending = pendingUrlRef.current;
    if (pending !== null) {
      pendingUrlRef.current = null;
      queuedRef.current = 0;
      if (pending !== pos) {
        goTo(pending);
        return;
      }
    }
    if (queuedRef.current === 0) return;
    const queued = queuedRef.current;
    queuedRef.current = 0;
    const target = pos + queued;
    if (target < 0 || target >= positionCount || atAppendix) {
      // La rincorsa è finita contro un capo del volume. Il commit precedente
      // aveva ceduto la navigazione al passo che non c'è più: la si onora qui,
      // altrimenti l'URL resterebbe indietro di una sezione.
      publish(fromPos(pos).spread);
      return;
    }
    goTo(target);
  }, [atAppendix, fromPos, gesture, goTo, pos, positionCount, publish]);

  /** Un passo avanti o indietro da qualunque input, code e capi del volume inclusi. */
  const step = useCallback(
    (direction: 1 | -1) => {
      const from = posRef.current;
      if (from === appendixPos) {
        if (direction === -1) onLeaveAppendix?.();
        return;
      }
      // Ai due capi del volume non ci sono pagine: ci sono i piatti.
      if (direction === -1 && from === 0) {
        onBeforeFirstPage?.();
        return;
      }
      if (direction === 1 && from === positionCount - 1) {
        onPastLastPage?.();
        return;
      }
      if (gestureRef.current?.mode === "run") {
        queuedRef.current = direction;
        return;
      }
      goTo(from + direction);
    },
    [appendixPos, goTo, onBeforeFirstPage, onLeaveAppendix, onPastLastPage, positionCount],
  );

  // ── Input: tastiera ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        step(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, step]);

  // ── Input: accenno, presa e trascinamento ──────────────────────────────────
  /**
   * La molla dell'accenno, tenuta per poterla fermare. Un accenno che insegue il
   * puntatore *non* deve essere animato — la distanza dal taglio è già una
   * posizione continua — ma quello da tastiera sì, e i due non possono scrivere
   * sullo stesso valore insieme.
   */
  const hintAnimRef = useRef<{ stop: () => void } | null>(null);
  const stopHintAnim = useCallback(() => {
    hintAnimRef.current?.stop();
    hintAnimRef.current = null;
  }, []);

  /**
   * Apre (o riusa) il gesto sul foglio in direzione `dir`. Torna `false` quando da
   * quella parte non c'è un foglio da prendere.
   *
   * Lavora in *posizioni*, non in spread: su schermo stretto un giro pagina è
   * mezzo spread, e misurare qui in spread faceva saltare la facciata mostrata a
   * ogni tocco e atterrare a metà libro dopo un trascinamento.
   */
  const armGesture = useCallback(
    (dir: 1 | -1, mode: "hint" | "drag") => {
      const target = pos + dir;
      if (target < 0 || target >= positionCount) return false;
      setGesture((current) => {
        if (current && current.dir === dir && current.from === pos && current.to === target) {
          // Lo stesso foglio che passa da accenno a presa: la posizione di lettura
          // l'ha già presa, ed è quella giusta — la pagina sotto nel frattempo è
          // cambiata.
          return current.mode === mode ? current : { ...current, mode };
        }
        tokenRef.current += 1;
        return {
          token: tokenRef.current,
          from: pos,
          to: target,
          dir,
          leaves: leavesForJump(pos, target),
          mode,
          carry: carryFor(dir),
        };
      });
      return true;
    },
    [carryFor, pos, positionCount],
  );

  /**
   * Il foglio non aspetta il clic: si solleva man mano che il puntatore si
   * avvicina al taglio, in proporzione alla distanza. È l'affordance — si capisce
   * che quello è un foglio e che lo si può prendere — senza aggiungere UI.
   */
  const hintAt = useCallback(
    (dir: 1 | -1, strength = 1, smooth = false) => {
      // Il riferimento, non lo stato: un accenno armato mentre un foglio è ancora
      // in volo lo strapperebbe di mano alla molla che lo sta posando, e lo stato
      // React di un gesto appena partito dice ancora che non c'è nessun gesto.
      const held = gestureRef.current;
      if (!open || reducedMotion || held?.mode === "run" || held?.mode === "drag") return;
      if (!armGesture(dir, "hint")) return;
      const lift = HINT_MAX * Math.min(1, Math.max(0, strength));
      const settled = dir === 1 ? lift : 1 - lift;
      stopHintAnim();
      // Il puntatore è già una posizione continua: seguirlo di pari passo è più
      // fluido di una molla nuova a ogni evento, che è quel che rendeva l'accenno
      // scattoso e teneva il processore occupato per nulla.
      if (smooth) hintAnimRef.current = animate(p0, settled, hintSpring);
      else p0.set(settled);
    },
    [armGesture, open, p0, reducedMotion, stopHintAnim],
  );

  const dropHint = useCallback(() => {
    const held = gestureRef.current;
    if (held?.mode !== "hint") return;
    const dir = held.dir;
    stopHintAnim();
    const control = animate(p0, dir === 1 ? 0 : 1, hintSpring);
    hintAnimRef.current = control;
    control.then(() => {
      setGesture((current) => (current?.mode === "hint" ? null : current));
    });
  }, [p0, setGesture, stopHintAnim]);

  /** Prende il foglio dove si trova: un accenno già sollevato non ricade sul dorso. */
  const beginDrag = useCallback(
    (dir: 1 | -1, startX: number, pointerId: number, travelSpan?: number) => {
      if (!open || reducedMotion || gestureRef.current?.mode === "run") return false;
      if (performance.now() < inputLockRef.current) return false;
      const stage = stageRef.current;
      if (!stage) return false;
      // Un foglio già accennato si prende dov'è; uno preso da fermo parte dal suo
      // capo della corsa — e per il gesto all'indietro quel capo è 1, non 0.
      // Leggerlo e basta faceva partire il ritorno da foglio già girato, quindi
      // qualunque trascinamento all'indietro risultava "compiuto" appena iniziato.
      const held = gestureRef.current;
      const resuming =
        held?.mode === "hint" && held.dir === dir && held.from === pos && held.to === pos + dir;
      if (!armGesture(dir, "drag")) return false;
      stopHintAnim();
      if (!resuming) p0.set(dir === 1 ? 0 : 1);
      const rect = stage.getBoundingClientRect();
      dragRef.current = {
        startX,
        // Su schermo largo la scatola contiene due facciate, su schermo stretto
        // una: la corsa utile è sempre *una* facciata, non metà scatola. La
        // rotella porta la sua, perché non ha una pagina sotto da misurare.
        span: Math.max(travelSpan ?? (compact ? rect.width : rect.width * 0.5) ?? 1, 1),
        base: p0.get(),
        target: p0.get(),
        moved: false,
        pointerId,
      };
      // La carta fruscia quando si stacca, non quando la si lascia andare.
      if (!resuming) playPageSound();
      return true;
    },
    [armGesture, compact, open, p0, playPageSound, pos, reducedMotion, stopHintAnim],
  );

  /**
   * Porta il foglio dove il gesto lo chiede e restituisce quel punto. Un dito è
   * già una posizione continua e ci va di pari passo; la rotella no — i suoi
   * scatti sono discreti — e allora detta il bersaglio e lo raggiunge con una
   * molla, che è lo stesso patto della cerimonia d'apertura.
   */
  const updateDrag = useCallback(
    (clientX: number, smooth = false) => {
      const drag = dragRef.current;
      if (!drag) return 0;
      const travelled = (drag.startX - clientX) / drag.span;
      const target = Math.min(1, Math.max(0, drag.base + travelled));
      drag.target = target;
      if (Math.abs(clientX - drag.startX) > CLICK_SLOP) drag.moved = true;
      stopHintAnim();
      if (smooth) hintAnimRef.current = animate(p0, target, wheelFollow);
      else p0.set(target);
      return target;
    },
    [p0, stopHintAnim],
  );

  const endDrag = useCallback(
    (stillHovering: boolean) => {
      const drag = dragRef.current;
      // Il riferimento, non lo stato: la rotella può arrivare a fine corsa in due
      // eventi, cioè prima che React abbia ridisegnato, e lo stato direbbe ancora
      // che non c'è nessun gesto — il foglio resterebbe a mezz'aria.
      const held = gestureRef.current;
      if (!drag || !held) return;
      dragRef.current = null;
      // La rotella non fa scoccare clic: solo un puntatore vero può lasciarne
      // uno in canna dopo aver girato la sua pagina.
      if (drag.moved && drag.pointerId !== WHEEL_POINTER_ID) swallowClickRef.current = true;
      // Il bersaglio del gesto, non il punto in cui la carta è arrivata. Otto
      // scatti di rotella nello stesso fotogramma portano il bersaglio a fondo
      // corsa mentre la molla è ancora ferma sul dorso: leggendo il foglio, il
      // giro risultava appena accennato e non si compiva mai.
      const reached = drag.target;
      const travelled = held.dir === 1 ? reached : 1 - reached;
      // La velocità del pollice conta quanto la distanza percorsa.
      const flick = p0.getVelocity() * held.dir;
      if (travelled >= DRAG_COMMIT_THRESHOLD || flick >= FLICK_VELOCITY) {
        tokenRef.current += 1;
        setGesture({ ...held, token: tokenRef.current, mode: "run", resumed: true });
        return;
      }
      // Sotto soglia il foglio ricade: se il puntatore è ancora sul taglio resta l'accenno.
      const settled =
        held.dir === 1 ? (stillHovering ? HINT_MAX : 0) : stillHovering ? 1 - HINT_MAX : 1;
      stopHintAnim();
      const control = animate(p0, settled, releaseSpring);
      hintAnimRef.current = control;
      control.then(() => {
        setGesture((current) => {
          if (current?.mode !== "drag") return current;
          return stillHovering ? { ...current, mode: "hint" } : null;
        });
      });
    },
    [p0, stopHintAnim],
  );

  // ── Input: rotella ─────────────────────────────────────────────────────────
  /**
   * La rotella non fa scattare un giro: lo *scorre*. Il foglio segue la mano per
   * tutta la corsa e a gesto finito decide da sé se cadere in avanti o tornare
   * indietro, con le stesse due regole del dito — è lo stesso gesto con un'altra
   * periferica, e va trattato come tale.
   *
   * Prima era una soglia con un tempo morto: novanta pixel facevano partire un
   * giro intero, e per quattro decimi di secondo la rotella non contava più. Un
   * pulsante nascosto dentro uno scorrimento, non una pagina che si gira.
   *
   * Sta qui sotto e non fra gli altri input perché prende in prestito il
   * trascinamento: leggerlo prima di dichiararlo è un errore, non una scelta.
   */
  const endWheel = useCallback(() => {
    const wheel = wheelRef.current;
    if (!wheel) return;
    window.clearTimeout(wheel.idle);
    wheelRef.current = null;
    endDrag(false);
  }, [endDrag]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !open || reducedMotion) return;

    const onWheel = (event: WheelEvent) => {
      // Se il puntatore è su una pagina che può ancora scorrere, la rotella è sua.
      const scroller = (event.target as HTMLElement | null)?.closest?.("[data-vo-scroll]");
      if (scroller instanceof HTMLElement) {
        const room =
          event.deltaY > 0
            ? scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
            : scroller.scrollTop;
        if (room > 1) return;
      }
      event.preventDefault();
      const unit =
        event.deltaMode === 1 ? WHEEL_LINE_PX : event.deltaMode === 2 ? window.innerHeight : 1;
      const push = Math.max(-WHEEL_MAX_STEP, Math.min(WHEEL_MAX_STEP, event.deltaY * unit));
      if (push === 0) return;

      let wheel = wheelRef.current;
      if (!wheel) {
        const now = performance.now();
        // La coda del gesto precedente sposta il blocco invece di aprirne uno nuovo.
        if (now < wheelLockRef.current) {
          wheelLockRef.current = now + WHEEL_QUIET_MS;
          return;
        }
        if (now < inputLockRef.current) return;
        const direction: 1 | -1 = push > 0 ? 1 : -1;
        // Qui il silenzio c'è già stato, quindi questa *è* una seconda
        // intenzione: se il foglio precedente è ancora in volo si mette in coda,
        // esattamente come farebbe una freccia premuta due volte. Il blocco si
        // rialza subito, così la scia di *questa* scorsa non ne accodi un'altra.
        if (gestureRef.current?.mode === "run") {
          wheelLockRef.current = now + WHEEL_QUIET_MS;
          step(direction);
          return;
        }
        // Qui invece un foglio da prendere non c'è proprio: siamo a un capo del
        // volume, e `step` sa chiudere il libro o girarlo sulla quarta.
        if (!beginDrag(direction, 0, WHEEL_POINTER_ID, WHEEL_SPAN)) {
          step(direction);
          return;
        }
        wheel = { travel: 0, idle: 0 };
        wheelRef.current = wheel;
      }
      wheel.travel += push;
      const reached = updateDrag(-wheel.travel, true);
      window.clearTimeout(wheel.idle);
      // A un capo della corsa la decisione è presa: aspettare il silenzio
      // terrebbe il foglio incollato al bordo per un decimo di secondo.
      if (reached <= 0 || reached >= 1) {
        wheelLockRef.current = performance.now() + WHEEL_QUIET_MS;
        endWheel();
        return;
      }
      wheel.idle = window.setTimeout(endWheel, WHEEL_IDLE_MS);
    };

    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stage.removeEventListener("wheel", onWheel);
      // L'ascoltatore si riscrive a ogni giro pagina (`beginDrag` cambia con la
      // posizione). Se lo fa mentre una scorsa è ancora aperta, il timer di
      // guardia muore con lui: senza chiudere il gesto qui, `wheelRef` restava
      // pieno per sempre e ogni rotellata successiva finiva dentro un gesto che
      // non poteva più concludersi — la rotella smetteva di girare le pagine e
      // il libro sembrava bloccato su quella sezione.
      if (wheelRef.current) endWheel();
    };
  }, [beginDrag, endWheel, open, reducedMotion, step, updateDrag]);

  /**
   * Rete di sicurezza sotto `touch-action`: quel CSS basta da solo nei browser
   * che rispettano la specifica, ma qui si preferisce non fidarsi ciecamente —
   * senza questo, su un telefono un tocco un po' verticale poteva ancora
   * trascinare l'intera pagina invece di restare fermo, ed è esattamente il
   * difetto che `touch-action: none` sullo stage dovrebbe già escludere.
   *
   * Si registra sul foglio da cui parte il tocco, non sull'esito del gesto: un
   * dito posato su un foglio che scorre resta suo per tutta la durata, anche
   * se in quell'istante non c'è ancora corsa da fare in quella direzione — al
   * contrario si spezzerebbe lo scorrimento appena il testo arriva a un capo.
   */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !open || reducedMotion) return;

    let blocking = false;
    const onTouchStart = (event: TouchEvent) => {
      const target = event.touches[0]?.target as HTMLElement | null;
      const scroller = target?.closest?.("[data-vo-scroll]");
      blocking = !(scroller instanceof HTMLElement && scroller.scrollHeight > scroller.clientHeight);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (blocking) event.preventDefault();
    };

    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
    };
  }, [open, reducedMotion]);

  /**
   * La sfogliata a dito, su tutta la pagina. Prima l'unica presa era la striscia
   * sul taglio: su un telefono è una mira che nessuno ha voglia di prendere, e il
   * gesto che tutti provano — trascinare la pagina di lato — non faceva nulla.
   *
   * Lo scorrimento verticale resta della carta: `touch-action: pan-y` lascia
   * decidere al browser, e se sceglie di scorrere ci arriva un `pointercancel`.
   */
  const swipeRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(null);

  /**
   * La cattura è un di più: serve a non perdere il dito che esce dalla scatola.
   * Se il browser la rifiuta — succede quando il puntatore è già stato rilasciato
   * fra un evento e l'altro — il trascinamento deve proseguire lo stesso, non
   * morire con un'eccezione a metà gesto.
   */
  const capture = (element: Element, pointerId: number) => {
    try {
      element.setPointerCapture(pointerId);
    } catch {
      // Senza cattura il gesto vale finché il puntatore resta sulla scatola.
    }
  };

  const onStagePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") return;
      if (!open || reducedMotion || dragRef.current) return;
      // Si registra anche con un foglio in volo: il gesto non potrà prendere
      // *questo* foglio, ma vale come richiesta del prossimo giro.
      swipeRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
      };
    },
    [open, reducedMotion],
  );

  const onStagePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (drag) {
        if (drag.pointerId === event.pointerId) updateDrag(event.clientX);
        return;
      }

      const swipe = swipeRef.current;
      if (swipe && swipe.pointerId === event.pointerId) {
        const dx = event.clientX - swipe.startX;
        const dy = event.clientY - swipe.startY;
        if (Math.abs(dx) < SWIPE_SLOP) return;
        if (Math.abs(dx) <= Math.abs(dy)) {
          swipeRef.current = null;
          return;
        }
        const dir: 1 | -1 = dx < 0 ? 1 : -1;
        // Un foglio è ancora in volo: questo dito non può prenderlo, ma la sua
        // intenzione non va persa — vale il prossimo giro, come per rotella e
        // frecce. Senza, sfogliare a raffica col pollice mangiava un gesto su due.
        if (gestureRef.current?.mode === "run") {
          swipeRef.current = null;
          queuedRef.current = dir;
          return;
        }
        // Il gesto comincia dove la soglia è stata superata, non dove il dito si è
        // posato: altrimenti il foglio scatta in avanti dei pixel di tolleranza.
        const originX = swipe.startX + (dir === 1 ? -SWIPE_SLOP : SWIPE_SLOP);
        if (!beginDrag(dir, originX, event.pointerId)) {
          swipeRef.current = null;
          return;
        }
        capture(event.currentTarget, event.pointerId);
        updateDrag(event.clientX);
        return;
      }

      if (event.pointerType === "touch") return;
      if (!open || reducedMotion) return;
      const held = gestureRef.current;
      if (held?.mode === "run" || held?.mode === "drag") return;

      const rect = stageRectRef.current ?? event.currentTarget.getBoundingClientRect();
      stageRectRef.current = rect;
      const fromRight = rect.right - event.clientX;
      const fromLeft = event.clientX - rect.left;
      const near = Math.min(fromRight, fromLeft);
      const dir: 1 | -1 = fromRight <= fromLeft ? 1 : -1;

      if (near > HINT_PROXIMITY || near < 0) {
        dropHint();
        return;
      }
      hintAt(dir, 1 - near / HINT_PROXIMITY);
    },
    [beginDrag, dropHint, hintAt, open, reducedMotion, updateDrag],
  );

  const onStagePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (swipeRef.current?.pointerId === event.pointerId) swipeRef.current = null;
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      endDrag(false);
    },
    [endDrag],
  );

  const onStagePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      stageRectRef.current = null;
      if (dragRef.current?.pointerId === event.pointerId) {
        endDrag(false);
        return;
      }
      dropHint();
    },
    [dropHint, endDrag],
  );

  const onHotspotPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>, dir: 1 | -1) => {
      // Ogni clic nasce da una pressione: azzerare qui è la garanzia che la
      // guardia valga per il gesto in corso e non ne avveleni uno successivo.
      swallowClickRef.current = false;
      if (event.pointerType === "touch") return;
      if (!beginDrag(dir, event.clientX, event.pointerId)) return;
      capture(event.currentTarget, event.pointerId);
    },
    [beginDrag],
  );

  const onHotspotPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      updateDrag(event.clientX);
    },
    [updateDrag],
  );

  const onHotspotPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      endDrag(event.currentTarget.matches(":hover"));
    },
    [endDrag],
  );

  /** Il taglio come pulsante: vale solo se il gesto non era un trascinamento. */
  const onHotspotClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>, dir: 1 | -1) => {
      // `detail` a zero è l'attivazione da tastiera: non ha un puntatore dietro,
      // quindi non può essere la coda di una presa e va sempre onorata — anche
      // se una guardia fosse rimasta armata da un rilascio finito fuori pagina.
      if (event.detail > 0 && swallowClickRef.current) {
        swallowClickRef.current = false;
        return;
      }
      step(dir);
    },
    [step],
  );

  // Il gesto "run" riparte da capo: i motion value non usati vanno riportati a zero.
  const activeLeaves = gesture?.leaves ?? [];
  const staticLeft = gesture ? (gesture.dir === 1 ? gesture.from : gesture.to) : pos;
  const staticRight = gesture ? (gesture.dir === 1 ? gesture.to : gesture.from) : pos;

  const canGoBack = pos === appendixPos ? true : pos > 0;
  const canGoForward = pos === appendixPos ? false : pos < positionCount - 1;

  return (
    <div
      className="vo-book-stage"
      ref={stageRef}
      data-open={open || undefined}
      data-busy={busy || undefined}
      data-compact={compact || undefined}
      onPointerDown={onStagePointerDown}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerCancel={onStagePointerUp}
      onPointerLeave={onStagePointerLeave}
    >
      <div className="vo-book-ambient" aria-hidden="true" />
      <motion.div className="vo-book" style={{ x: blockShift, rotateX: 6, rotateY: volumeTurn }}>
        <motion.div
          className="vo-book-edge vo-book-edge-left"
          aria-hidden="true"
          style={{ ...({ "--vo-edge": spread } as CSSProperties), opacity: edgeOpacity }}
        />
        <motion.div
          className="vo-book-edge vo-book-edge-right"
          aria-hidden="true"
          style={{
            ...({ "--vo-edge": voSpreadCount - 1 - spread } as CSSProperties),
            opacity: edgeOpacity,
          }}
        />

        {/* Due pixel davanti al risguardo: complanari si contenderebbero il
            posto, e il piatto è comunque molto più spesso di così. */}
        <motion.div className="vo-page vo-page-left" style={{ rotateY: leftPageTurn, z: 2 }}>
          {pageSheet(staticLeft, "left")}
        </motion.div>
        <div className="vo-page vo-page-right">{pageSheet(staticRight, "right")}</div>

        <div className="vo-book-gutter" aria-hidden="true" />

        {/* Il dorso: la faccia che tiene insieme i due piatti. Si vede solo
            quando il volume è chiuso e ruota — a libro aperto è di taglio. */}
        <div className="vo-book-spine" aria-hidden="true">
          <div className="vo-book-spine-face">
            <span className="vo-book-spine-rule" />
            <span className="vo-book-spine-text">Valentina Orciuoli</span>
            <span className="vo-book-spine-mark">龍</span>
            <span className="vo-book-spine-rule" />
          </div>
        </div>

        {activeLeaves.map((leafIndex, order) => {
          const faces = leafFaces(leafIndex);
          // Di un salto si leggono due sole facciate: quella da cui il gesto parte
          // e quella su cui si posa. Andando avanti sono il recto del primo foglio
          // e il verso dell'ultimo; tornando indietro le due si scambiano. Le altre
          // passano davanti agli occhi in un decimo di secondo, e impaginarle
          // costava il primo fotogramma di ogni salto lungo.
          const first = order === 0;
          const last = order === activeLeaves.length - 1;
          const forward = gesture?.dir === 1;
          const frontReal = forward ? first : last;
          const backReal = forward ? last : first;
          return (
            <VoLeaf
              // La chiave è il *posto* nella pila, non il gesto. Legandola al
              // gesto, il foglio si rimontava da capo a ogni cambio di stadio —
              // e il passaggio da presa a corsa è esattamente l'istante in cui si
              // lascia andare la pagina: lì si perdeva la velocità accumulata,
              // quindi la frusta crollava a zero e la carta faceva uno scatto
              // proprio sul più bello. Restando lo stesso elemento, accenno,
              // trascinamento e corsa sono un movimento solo.
              key={order}
              progress={progressValues[order] as MotionValue<number>}
              // Il primo foglio a muoversi è quello in cima alla pila: parte più
              // vicino all'osservatore e ci resta anche dopo essere atterrato.
              depth={LEAF_BASE_DEPTH - order * LEAF_DEPTH_STEP}
              // Tornando indietro il foglio viene preso dalla pila di sinistra:
              // sotto di lui c'è già la pagina precedente, e deve restarle davanti.
              lifted={gesture?.dir === -1}
              front={frontReal ? pageSheet(faces.front.spread, faces.front.side) : fillerSheet}
              back={
                backReal
                  ? pageSheet(faces.back.spread, compact ? "right" : faces.back.side)
                  : fillerSheet
              }
              // Solo il primo foglio copre una pagina che si stava leggendo: gli
              // altri di un salto lungo arrivano da parti del volume mai aperte.
              carryKey={gesture?.token ?? 0}
              frontScroll={order === 0 ? gesture?.carry?.front ?? 0 : 0}
              backScroll={order === 0 ? gesture?.carry?.back ?? 0 : 0}
            />
          );
        })}

        {cover}
        {backCover}
        {bookmark}
        {insert}

        <button
          type="button"
          className="vo-leaf-hotspot vo-leaf-hotspot-next"
          onFocus={() => hintAt(1, 1, true)}
          onBlur={dropHint}
          onPointerDown={(event) => onHotspotPointerDown(event, 1)}
          onPointerMove={onHotspotPointerMove}
          onPointerUp={onHotspotPointerUp}
          onPointerCancel={onHotspotPointerUp}
          onClick={(event) => onHotspotClick(event, 1)}
          disabled={!open || pos === appendixPos || (!canGoForward && !onPastLastPage)}
          aria-label={canGoForward ? "Pagina successiva" : "Chi sono, sul retro del volume"}
        />
        <button
          type="button"
          className="vo-leaf-hotspot vo-leaf-hotspot-prev"
          onFocus={() => hintAt(-1, 1, true)}
          onBlur={dropHint}
          onPointerDown={(event) => onHotspotPointerDown(event, -1)}
          onPointerMove={onHotspotPointerMove}
          onPointerUp={onHotspotPointerUp}
          onPointerCancel={onHotspotPointerUp}
          onClick={(event) => onHotspotClick(event, -1)}
          disabled={!open || (!canGoBack && !onBeforeFirstPage)}
          aria-label="Pagina precedente"
        />
      </motion.div>

      <p className="vo-book-live" aria-live="polite">
        {voSpreads[spread].runningHead}
      </p>
    </div>
  );
}
