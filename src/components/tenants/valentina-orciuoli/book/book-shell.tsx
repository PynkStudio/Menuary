"use client";

import {
  animate,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
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
  appendixOrdinal,
  leafFaces,
  spreadHref,
  spreadIndexByPathname,
  voAppendixOrder,
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
/**
 * Silenzio dopo cui una scorsa si considera finita.
 *
 * Non è un tempo di blocco: è la fine di una *sessione*. Finché gli eventi
 * arrivano — coda d'inerzia compresa — la sessione resta aperta e assorbe
 * tutto; una sessione vale un giro solo. Per farne un altro la mano deve
 * davvero fermarsi, che è l'unico modo di distinguere una seconda intenzione
 * dalla coda della prima.
 */
const WHEEL_IDLE_MS = 110;
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
/** La testa che gira da una facciata all'altra a riposo: un moto solo, non un trascinamento. */
const cameraFocusSpring = { type: "spring", stiffness: 190, damping: 26, mass: 0.9 } as const;
/**
 * L'occhio che segue il foglio mentre gira. Smorzamento vicino al critico,
 * come `flipSpring` per la carta: la telecamera non deve rimbalzare, solo
 * arrivare morbida — un rimbalzo su una ripresa si nota molto più che su un
 * foglio, perché è tutta l'inquadratura a muoversi, non un dettaglio in essa.
 */
const cameraTrackSpring = { type: "spring", stiffness: 210, damping: 32, mass: 1 } as const;

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

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
   * `half` è rimasto nello stato solo per compatibilità con la memoria
   * salvata da versioni precedenti: la posizione non lo usa più, un giro
   * pagina vale sempre uno *spread* intero, largo o stretto che sia lo
   * schermo. Su schermo stretto è `focus`, qui sotto, a portare lo sguardo
   * da una facciata all'altra senza muovere la pagina.
   */
  const [half, setHalf] = useState(() =>
    voBookMemoryAvailable && voBookMemory.opened ? voBookMemory.half : 0,
  );

  useEffect(() => {
    voBookMemory.half = half;
  }, [half]);
  const positionCount = voSpreadCount;
  const toPos = useCallback((targetSpread: number) => targetSpread, []);
  const fromPos = useCallback((position: number) => ({ spread: position, half: 0 }), []);
  /**
   * L'appendice occupa una posizione *virtuale* subito oltre l'ultima pagina. Sta
   * fuori dai limiti usati dalla navigazione manuale, quindi sfogliando non ci si
   * arriva mai; ma essendo una posizione come le altre, il salto per raggiungerla
   * riusa il motore dei fogli e si vede il libro sfogliare fino in fondo.
   */
  const appendixBase = positionCount;
  /** L'ultima posizione virtuale esistente: oltre non c'è nulla da raggiungere. */
  const appendixEnd = appendixBase + voAppendixOrder.length;
  /** Dove sta, nella sequenza, l'appendice che l'URL sta chiedendo adesso. */
  const appendixTarget = appendix ? appendixBase + appendixOrdinal(appendix) : null;

  /**
   * Se il volume era già aperto si parte da dov'eravamo e l'appendice diventa un
   * *bersaglio*: la differenza fra le due posizioni è ciò che l'effetto sul
   * pathname trasforma in un riffle fino in fondo al libro. Chi invece apre un
   * richiamo legale da un link diretto ci si trova già, senza sfogliata inutile.
   */
  const [shownAppendix, setShownAppendix] = useState<number | null>(() =>
    appendix && (entryAppendix || !(voBookMemoryAvailable && voBookMemory.opened))
      ? appendixOrdinal(appendix)
      : null,
  );
  const pos = shownAppendix !== null ? appendixBase + shownAppendix : toPos(spread);
  /** Come `gestureRef`: la posizione che vale per un input arrivato prima del render. */
  const posRef = useRef(pos);
  posRef.current = pos;

  const [gesture, setGestureState] = useState<Gesture | null>(null);
  /**
   * 1 mentre un foglio è in mano o in volo, 0 a riposo.
   *
   * Esiste come *motion value* e non solo come `gestureRef` perché la
   * telecamera compatta è costruita su `useTransform`: una trasformazione
   * ricalcola solo quando cambia uno dei suoi ingressi dichiarati, e leggendo
   * il ref la fine di un gesto le restava invisibile — l'inquadratura si
   * piantava a metà giro finché qualcos'altro non muoveva `p0`.
   */
  const flipping = useMotionValue(0);

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
      flipping.set(value?.mode === "run" || value?.mode === "drag" ? 1 : 0);
      setGestureState(value);
    },
    [flipping],
  );

  const tokenRef = useRef(0);
  /**
   * La scorsa di rotella in corso: corsa accumulata, tempo di guardia, e se ha
   * già speso il suo giro pagina.
   *
   * `spent` è ciò che rende innocua la coda d'inerzia di un trackpad. Un flick
   * produce sette-ottocento pixel di scorrimento: il giro si compie ai primi
   * trecento e gli altri cinquecento continuano ad arrivare per quasi un
   * secondo. Prima quegli eventi aprivano gesti nuovi — una scorsa sola ne
   * girava due o tre. Adesso restano dentro la *stessa* scorsa, che li assorbe
   * e si limita a rimandare avanti la propria guardia: una sessione di rotella
   * vale esattamente un giro, e per farne un altro la mano deve fermarsi.
   */
  const wheelRef = useRef<{ travel: number; idle: number; spent: boolean } | null>(null);
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

  /**
   * Lo sportello da cui gli ascoltatori nativi leggono il presente.
   *
   * Rotella e tocco vivono su `addEventListener`, non su una prop JSX, e finora
   * il loro effetto dipendeva dalle funzioni che chiamava: `step`, `beginDrag`,
   * `updateDrag`. Quelle cambiano identità a ogni giro pagina — e `step` a ogni
   * *render*, perché in fondo alla catena c'è una prop scritta come arrow
   * inline dal chiamante. L'ascoltatore veniva quindi smontato e rimontato in
   * continuazione, e la sua pulizia chiude la scorsa in corso: bastava che il
   * componente si ridisegnasse mentre il trackpad era ancora in movimento
   * perché il gesto morisse a metà. È il difetto che si vedeva come "lo
   * scorrimento non è affidabile, tende a bloccarsi".
   *
   * Con lo sportello gli ascoltatori si registrano **una volta sola**, al
   * montaggio, e a ogni evento leggono da qui le funzioni di adesso. Nessuna
   * dipendenza, nessun rimontaggio, nessun gesto interrotto da un ridisegno.
   */
  const latestRef = useRef<{
    open: boolean;
    reducedMotion: boolean;
    step: (direction: 1 | -1, shiftFocus?: boolean) => void;
    tryShiftFocus: (dir: 1 | -1) => boolean;
    beginDrag: (dir: 1 | -1, startX: number, pointerId: number, travelSpan?: number) => boolean;
    updateDrag: (clientX: number, smooth?: boolean) => number;
    endDrag: (stillHovering: boolean) => void;
  } | null>(null);

  // Tre fogli animabili al massimo: i motion value sono fissi, cambia chi li usa.
  const p0 = useMotionValue(0);
  const p1 = useMotionValue(0);
  const p2 = useMotionValue(0);
  const progressValues = useMemo(() => [p0, p1, p2], [p0, p1, p2]);

  const busy = gesture?.mode === "run";

  /**
   * Su schermo stretto le due facciate esistono entrambe ma non ci stanno a
   * fuoco insieme: la telecamera guarda una alla volta, come una testa che si
   * gira. `tryShiftFocus`, più sotto, decide se un passo sposta lo sguardo o
   * gira davvero pagina. Su schermo largo resta scritto ma senza effetto
   * visivo — il CSS che lo legge è tutto sotto `[data-compact]`.
   */
  const [focus, setFocus] = useState<VoFaceSide>("left");
  /**
   * Il fuoco leggibile *subito*.
   *
   * Prima si scriveva in fase di render, quindi valeva solo dal render
   * successivo: due sfogliate nello stesso fotogramma — o una che arriva fra
   * l'atterraggio del foglio e il ridisegno — leggevano entrambe il lato
   * vecchio e venivano spese tutte e due per girare la testa. Da fuori è il
   * libro che smette di andare avanti.
   */
  const focusRef = useRef(focus);
  const lookAt = useCallback((side: VoFaceSide) => {
    focusRef.current = side;
    setFocus(side);
  }, []);
  /**
   * Il fuoco a riposo — dove la telecamera torna quando non c'è un foglio in
   * mano o in volo. Durante un giro vero non è lui a guidare: la telecamera
   * segue invece il foglio stesso, vedi `focusDuringFlip` qui sotto.
   */
  const restingFocusT = useMotionValue(focus === "left" ? 0 : 1);
  useEffect(() => {
    const controls = animate(restingFocusT, focus === "left" ? 0 : 1, cameraFocusSpring);
    return () => controls.stop();
  }, [restingFocusT, focus]);
  /**
   * Mentre un foglio è preso o in volo, la telecamera non salta da un fuoco
   * all'altro: insegue il foglio stesso, come un occhio che segue la pagina
   * che si gira. `p0` è la sua posizione — 0→1 andando avanti, 1→0 tornando
   * indietro, ma sempre "a metà corsa" quando vale 0.5, qualunque sia il
   * verso, per come è costruita più sotto l'animazione del volo. Vicino a 0 o
   * a 1 il foglio è quasi piatto e la facciata si legge a fuoco come da
   * fermi; verso 0.5 è di taglio — si vede di profilo, `|` — ed è lì che
   * `zoomDuringFlip` allarga per tenere centrato lo spacco invece che una
   * facciata sola, e `focusDuringFlip` scambia il lato di destinazione:
   * prima di metà corsa si guarda ancora la facciata di partenza, dopo si
   * guarda già quella d'arrivo.
   *
   * Entrambi leggono `flipping` invece dello stato React: durante un
   * trascinamento `p0` si muove a ogni pixel, ed è quel movimento — non un
   * ri-render — a dover guidare la telecamera in tempo reale.
   *
   * **`1 - p0` è una carrellata, non un taglio.** Prima qui c'era un gradino: a
   * metà corsa il lato di destinazione si scambiava di colpo. Una molla presa a
   * calci da un gradino accumula velocità e scavalca il bersaglio — ed è da lì
   * che venivano sia lo scatto d'inquadratura in fondo a ogni giro, sia le due
   * sfogliate ravvicinate che mandavano la scala fuori misura. La forma
   * continua vale in tutti e due i versi senza casi particolari, perché è il
   * foglio a portare il verso: andando avanti `p0` sale da 0 a 1 e la
   * telecamera scivola da destra a sinistra, tornando indietro scende da 1 a 0
   * e la telecamera rifà la stessa strada al contrario.
   */
  const focusDuringFlip = useTransform(
    [p0, restingFocusT, flipping],
    ([progress, resting, active]: number[]) => (active ? 1 - progress : resting),
  );
  /**
   * Quanto l'inquadratura è stretta sulla facciata: 1 sulla carta posata, 0 col
   * foglio di taglio a metà corsa, quando serve vedere la doppia pagina intera.
   *
   * La conca è un seno e non una V. Con `|2p - 1|` il fondo era uno spigolo:
   * la molla che insegue ci passa sopra senza avere il tempo di scenderci —
   * misurato, si fermava a metà strada — e ogni spigolo le dà uno strappo di
   * velocità. Il seno arriva prima, resta giù il tempo che serve e riparte
   * senza scalini: la panoramica si apre davvero, e la molla non prende calci.
   */
  const zoomDuringFlip = useTransform([p0, flipping], ([progress, active]: number[]) =>
    active ? clamp(1 - Math.sin(Math.PI * clamp(progress, 0, 1)), 0, 1) : 1,
  );
  /**
   * Le stesse due misure, ma smussate. Senza questo la telecamera scatterebbe
   * esattamente al variare di `p0` — durante un trascinamento è la posizione
   * grezza del dito, un moto a scatti, non lo sguardo morbido di una testa
   * che segue. La molla insegue con un piccolo ritardo elastico: è l'"ease"
   * che serve sia quando il foglio si posa da solo, sia quando è la mano a
   * fargli fare avanti e indietro.
   */
  /**
   * Le molle inseguono un bersaglio che *salta*: a metà giro il lato di
   * destinazione si scambia di colpo, e il fondo della V dello zoom è un
   * angolo, non una curva. Una molla presa a calci così accumula velocità, e
   * con due sfogliate ravvicinate divergeva — misurato: zoom a 11 e scala a
   * 5.8×, il libro fuori scala su tutto lo schermo. Il morso finale tiene
   * l'inquadratura dentro i suoi due estremi qualunque cosa faccia la molla.
   */
  const cameraFocusT = useTransform(useSpring(focusDuringFlip, cameraTrackSpring), (value) =>
    clamp(value, 0, 1),
  );
  const cameraZoomFlipT = useTransform(useSpring(zoomDuringFlip, cameraTrackSpring), (value) =>
    clamp(value, 0, 1),
  );
  /**
   * In doppia pagina compressa in una facciata sola, un passo prima sposta lo
   * sguardo — sinistra↔destra — e solo quando è già sul bordo giusto gira
   * davvero pagina: è la stessa testa che si gira, non ancora la mano che
   * afferra il foglio. Torna `true` se il passo è stato speso così — chi
   * chiama non deve più fare nient'altro — `false` se deve proseguire verso
   * un giro vero.
   */
  const tryShiftFocus = useCallback(
    (dir: 1 | -1) => {
      if (!compact) return false;
      const wanted: VoFaceSide = dir === 1 ? "right" : "left";
      if (focusRef.current === wanted) return false;
      lookAt(wanted);
      return true;
    },
    [compact, lookAt],
  );

  // Da chiuso il volume mostra solo la copertina, quindi va centrato sulla metà
  // destra; si riallinea al centro reale mentre il cartoncino si apre. La pagina
  // sinistra compare solo quando la copertina ha passato la verticale. Vale
  // anche su schermo stretto: la scatola contiene comunque le due facciate
  // vere, solo più piccole — non una sola — quindi lo stesso -25% la centra
  // allo stesso modo.
  const blockShift = useTransform(coverProgress, [0, 0.55], ["-25%", "0%"]);
  /**
   * Quanto della zoomata sul fuoco (sotto) è già "acceso": 0 appena la
   * copertina comincia a girare, 1 quando le pagine sono ormai scoperte. Solo
   * su schermo stretto — `.vo-book-stage` lo legge come `--vo-compact-zoom-t`
   * e lo ignora del tutto su schermo largo. Senza questa rampa lo zoom
   * scattava di colpo nell'istante in cui il volume risultava "aperto",
   * mentre la copertina stava ancora finendo di ribaltarsi.
   */
  const compactZoomActivation = useTransform(coverProgress, [0.3, 0.75], [0, 1]);
  /**
   * Le due rampe restano **separate**.
   *
   * Moltiplicarle voleva dire che a volume chiuso lo zoom valeva zero, cioè la
   * vista d'insieme: il libro chiuso si vedeva rimpicciolito, e aprendolo
   * cresceva. Ma la panoramica serve al *giro pagina*, quando il foglio è di
   * taglio e va inquadrata la doppia pagina intera; il volume chiuso non ha
   * niente da rimpicciolire — è un libro sul tavolo, grande quanto le sue
   * pagine. Ora `--vo-compact-zoom-t` è solo il volo, e `--vo-compact-open-t`
   * dice al CSS quanto siamo passati dall'inquadratura del piatto chiuso a
   * quella della facciata a fuoco: una carrellata a scala costante, non uno zoom.
   */
  const compactZoomT = cameraZoomFlipT;
  /**
   * Quanto siamo *dentro* il giro: 0 con la carta posata a un capo o all'altro,
   * 1 col foglio di taglio a metà corsa. È la stessa V dello zoom compatto letta
   * al rovescio, così le due inquadrature respirano sullo stesso ritmo.
   *
   * Su schermo largo è l'unica telecamera che c'è. Serviva: da desktop il giro
   * pagina era una ripresa fissa — l'occhio restava inchiodato mentre la carta
   * si alzava. Un passo indietro appena percettibile mentre il foglio è in
   * piedi, e il ritorno quando si posa, è quello che in un film fa la differenza
   * fra guardare una cosa che si muove e muoversi *insieme* a lei.
   */
  const flipDepthT = useTransform(cameraZoomFlipT, (value) => 1 - value);
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
    [positionCount, renderAppendix, renderFace],
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
      // L'appendice si sceglie dalla *posizione*, non dalla prop: durante il giro
      // fra due informative le due facciate in scena sono due appendici diverse, e
      // leggerle entrambe dalla prop ne avrebbe mostrata una sola.
      if (position >= appendixBase) {
        const entry = voAppendixOrder[position - appendixBase];
        if (!entry) return <div className="vo-page-sheet vo-page-sheet-blank" />;
        const face: VoFaceSide = side;
        return (
          <div className="vo-page-sheet" data-side={face} data-spread="appendice">
            <div className="vo-page-grain" aria-hidden="true" />
            <div className="vo-page-running-head" aria-hidden="true">
              <span>{face === "left" ? "Valentina Orciuoli" : entry.runningHead}</span>
            </div>
            <div className="vo-page-body" data-vo-scroll="">
              {renderAppendix(entry, face)}
            </div>
          </div>
        );
      }
      if (position < 0) {
        return <div className="vo-page-sheet vo-page-sheet-blank" />;
      }
      const { spread: targetSpread } = fromPos(position);
      const face: VoFaceSide = side;
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
    [appendixBase, fromPos, renderAppendix, renderFace],
  );

  const pageSheet = useCallback(
    (position: number, side: VoFaceSide) => {
      const key = `${position}:${side}`;
      const cached = sheetCache.get(key);
      if (cached !== undefined) return cached;
      const node = buildSheet(position, side);
      sheetCache.set(key, node);
      return node;
    },
    [buildSheet, sheetCache],
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
  const queuedRef = useRef<0 | 1 | -1>(0);
  /**
   * Se il passo in coda era un'intenzione *vaga* — una sfogliata — o un comando
   * esplicito, come il tocco sul margine o una freccia.
   *
   * Senza questa distinzione la coda spendeva **tutto** come comando esplicito,
   * cioè come una pagina intera. Su schermo stretto una sfogliata vale mezzo
   * passo (prima si gira la testa, poi la pagina): chi sfogliava più in fretta di
   * quanto duri un giro si vedeva saltare la facciata destra a ogni gesto
   * accodato, ed è così che il telefono "avanzava di più pagine insieme".
   */
  const queuedShiftRef = useRef(true);
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
    /**
     * `dir` serve solo a chi arriva senza aver sfogliato: con `prefers-reduced-motion`
     * non c'è nessun foglio in volo da cui leggere il verso, e senza questo un salto
     * all'indietro atterrava comunque guardando a sinistra — cioè saltando la
     * facciata che l'utente stava tornando a vedere.
     */
    (target: number, dir?: 1 | -1) => {
      // La carta che si posa sulla pila. Il fruscio dello stacco raccontava metà
      // del gesto: senza questo, il giro finiva in silenzio proprio nel momento
      // in cui in un libro vero fa il rumore più riconoscibile.
      playPageSound("land");
      /*
       * La posizione si sposta **adesso**, non al render successivo.
       *
       * `posRef` era una copia scritta in fase di render, quindi per tutta la
       * finestra fra l'atterraggio e il ridisegno diceva ancora la pagina
       * vecchia: un dito posato lì dentro armava il gesto dalla posizione
       * sbagliata e il libro saltava una pagina, o ne girava una che non era
       * quella sotto le dita. È la stessa ragione per cui esiste `gestureRef`.
       */
      posRef.current = target;
      // L'appendice non è una posizione del volume: l'URL ce l'ha già portata, e
      // scriverla in `spread` la farebbe rientrare nella sequenza sfogliabile.
      if (target >= appendixBase) {
        restingFocusT.set(0);
        setShownAppendix(target - appendixBase);
        lookAt("left");
        clearGesture();
        return;
      }
      // Arrivando avanti si ricomincia a guardare da sinistra, arrivando
      // indietro da destra: è la stessa testa che continua a girare nella
      // direzione da cui veniva, non che scatta sempre al solito lato.
      const landing: VoFaceSide = (dir ?? gestureRef.current?.dir) === -1 ? "right" : "left";
      /*
       * Il passaggio di consegne della telecamera.
       *
       * Fino a un istante fa l'inquadratura seguiva il foglio (`1 - p0`); da
       * adesso sta ferma sul fuoco a riposo. Se il valore a riposo non è già
       * quello d'arrivo, nell'istante del cambio l'inquadratura salta al valore
       * vecchio e poi ci torna sopra con la molla: è quello lo scatto che si
       * vedeva in fondo a ogni giro pagina.
       */
      restingFocusT.set(landing === "left" ? 0 : 1);
      lookAt(landing);
      const { spread: nextSpread, half: nextHalf } = fromPos(target);
      // Si scrive qui, non nell'effetto: il foglio è atterrato *adesso*. La
      // navigazione che parte due righe sotto rimonta il componente, e l'effetto
      // che avrebbe salvato la pagina appartiene all'istanza che sta per sparire —
      // non gira mai. Il libro rileggeva così la pagina precedente e tornava
      // indietro da solo di un giro ogni volta che si cambiava sezione.
      voBookMemory.spread = nextSpread;
      voBookMemory.half = nextHalf;
      setShownAppendix(null);
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
    [appendixBase, clearGesture, fromPos, lookAt, playPageSound, publish, restingFocusT],
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
      // Andando avanti si stacca la facciata destra, tornando indietro la sinistra.
      const side = dir === 1 ? "right" : "left";
      const body = stage.querySelector<HTMLElement>(`.vo-page-${side} [data-vo-scroll]`);
      const top = body?.scrollTop ?? 0;
      if (!top) return undefined;
      return dir === 1 ? { front: top, back: 0 } : { front: 0, back: top };
    },
    [],
  );

  const goTo = useCallback(
    (target: number) => {
      if (!open) return;
      const from = posRef.current;
      if (target < 0 || target >= appendixEnd) return;
      if (target === from) return;
      if (gestureRef.current?.mode === "run") return;
      const dir: 1 | -1 = target > from ? 1 : -1;
      if (reducedMotion) {
        commit(target, dir);
        return;
      }
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
    [appendixEnd, carryFor, commit, open, reducedMotion, setGesture],
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
    const fromUrl = appendixTarget ?? toPos(spreadIndexByPathname(pathname));
    if (fromUrl === pos) return;
    // Un foglio è già in volo: la richiesta non si butta, si onora appena si posa.
    if (gesture) {
      pendingUrlRef.current = fromUrl;
      return;
    }
    /*
     * E nemmeno si sfoglia a volume chiuso.
     *
     * Dalla quarta di copertina — "chi sono" — un richiamo alle informative
     * cambia l'indirizzo mentre il volume è ancora girato e chiuso: il libro
     * partiva col suo riffle in quello stato, sotto la copertina, e da fuori era
     * il "si comporta strano" che si vedeva. La richiesta si mette in attesa e si
     * onora quando il volume è di nuovo aperto, che è l'unico momento in cui una
     * sfogliata ha senso.
     */
    if (!open) {
      pendingUrlRef.current = fromUrl;
      return;
    }
    // L'URL nomina la *sezione*, non la facciata. Su schermo stretto una sezione
    // ne occupa due, e se si è già dentro quella giusta non c'è niente da
    // inseguire: pretenderne la prima rimandava indietro di una pagina ogni giro
    // che atterrava sulla facciata destra — il libro tornava sui suoi passi da solo.
    if (!appendix && shownAppendix === null && fromPos(pos).spread === spreadIndexByPathname(pathname))
      return;
    if (reducedMotion) {
      posRef.current = fromUrl;
      if (fromUrl >= appendixBase) {
        setShownAppendix(fromUrl - appendixBase);
        return;
      }
      const landing = fromPos(fromUrl);
      setShownAppendix(null);
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


  /**
   * Un passo avanti o indietro da qualunque input, code e capi del volume
   * inclusi.
   *
   * `shiftFocus` distingue le due nature di un passo. Una sfogliata a mano
   * libera è un'intenzione vaga — "avanti" — e su schermo stretto la si spende
   * prima girando la testa. Un comando *esplicito* no: chi tocca il taglio
   * della pagina, o chi ha già chiesto un altro giro mentre il foglio era in
   * volo, ha chiesto una pagina, non un'inquadratura. Spenderla a girare la
   * testa era quel "sfoglia e poi va anche a destra invece di fermarsi".
   */
  const step = useCallback(
    (direction: 1 | -1, shiftFocus = true) => {
      const from = posRef.current;
      if (from >= appendixBase) {
        if (direction === -1) onLeaveAppendix?.();
        return;
      }
      if (shiftFocus && tryShiftFocus(direction)) return;
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
        queuedShiftRef.current = shiftFocus;
        return;
      }
      goTo(from + direction);
    },
    [appendixBase, goTo, onBeforeFirstPage, onLeaveAppendix, onPastLastPage, positionCount, tryShiftFocus],
  );

  useEffect(() => {
    if (gesture) return;
    // Prima l'URL: se nel frattempo è cambiato, è quello che l'utente ha chiesto.
    const pending = pendingUrlRef.current;
    if (pending !== null) {
      // A volume chiuso `goTo` non farebbe nulla e la richiesta andrebbe persa:
      // resta in attesa finché il libro non è di nuovo in condizione di sfogliare.
      if (!open) return;
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
    /**
     * Il passo in coda si spende con `step`, non con `goTo`.
     *
     * `goTo` salta la pagina e basta: saltava anche il giro di testa su schermo
     * stretto (`tryShiftFocus`) e i due capi del volume. Il risultato era che
     * una sfogliata arrivata mentre un foglio era ancora in volo valeva *una
     * pagina intera* invece del mezzo passo che l'utente aveva chiesto — due
     * dita svelte e il libro ne girava tre.
     *
     * E si spende con la *natura* che aveva: `queuedShiftRef`. Spenderla sempre
     * come comando esplicito riportava esattamente lo stesso difetto per un'altra
     * strada, perché anche una sfogliata finiva per valere una pagina intera.
     *
     * L'URL si allinea comunque prima: il commit precedente aveva ceduto la
     * navigazione al passo in coda, e se quel passo ora si spende girando la
     * testa (o contro un piatto) nessuno la scriverebbe più.
     */
    publish(fromPos(pos).spread);
    step(queued, queuedShiftRef.current);
  }, [fromPos, gesture, goTo, open, pos, publish, step]);

  /**
   * Il riallineamento fra il libro e la barra degli indirizzi.
   *
   * L'effetto qui sopra reagisce al *cambio* di indirizzo, e un evento che non
   * si può onorare nell'istante in cui arriva è un evento perso: se in quel
   * momento un foglio era in volo e la richiesta messa in attesa veniva poi
   * consumata a libro chiuso, o se `goTo` usciva subito perché il volume non era
   * aperto, nessuno ci tornava più sopra. Da lì in avanti l'URL diceva una
   * pagina e il libro ne mostrava un'altra — e bastava ricaricare per vedere il
   * volume "saltare" altrove.
   *
   * Questo non è un evento ma un **invariante**: a volume fermo e aperto, la
   * pagina in vista e l'indirizzo devono coincidere; se non coincidono, si
   * sfoglia fin lì. Un evento si può perdere, un invariante no — ed è la sola
   * cosa che rende la coppia libro/URL sicura sotto una raffica di gesti a caso.
   *
   * Si legge `window.location`, non `pathname`: il valore di React arriva un
   * render più tardi di `voPushUrl`, e in quella finestra il libro si troverebbe
   * "in disaccordo" col proprio stesso giro pagina appena concluso — e tornerebbe
   * indietro da solo.
   */
  useEffect(() => {
    if (!open || gesture) return;
    if (pendingUrlRef.current !== null || queuedRef.current !== 0) return;
    const here = window.location.pathname;
    if (isBackCoverPathname(here)) return;
    const wanted =
      appendixTarget ?? (isBookPathname(here) ? toPos(spreadIndexByPathname(here)) : null);
    if (wanted === null || posRef.current === wanted) return;
    goTo(wanted);
  }, [appendixTarget, gesture, goTo, open, pathname, toPos]);

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
      // `posRef`, non `pos`: un gesto che nasce fra l'atterraggio di un foglio e
      // il ridisegno deve partire dalla pagina su cui il libro *è*, non da
      // quella su cui era. Vedi la nota in `commit`.
      const pos = posRef.current;
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
    [carryFor, positionCount, setGesture],
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
      const here = posRef.current;
      const resuming =
        held?.mode === "hint" && held.dir === dir && held.from === here && held.to === here + dir;
      if (!armGesture(dir, "drag")) return false;
      stopHintAnim();
      if (!resuming) p0.set(dir === 1 ? 0 : 1);
      const rect = stage.getBoundingClientRect();
      dragRef.current = {
        startX,
        /*
         * La corsa che vale un giro intero.
         *
         * È una facciata — non la scatola intera — ma su schermo stretto una
         * facciata è più larga dello schermo: la scatola misura quasi il doppio
         * del viewport, quindi metà scatola sono trecento e passa pixel e il
         * pollice non ce li ha. Chiedere quella corsa voleva dire trascinare
         * mezzo schermo per girare una pagina, e sotto soglia il foglio
         * ricadeva indietro: da fuori, un libro che non vuole saperne di
         * andare avanti. Qui la corsa si tiene dentro quello che il dito può
         * davvero percorrere. La rotella porta la sua, perché non ha una
         * pagina sotto da misurare.
         */
        span: Math.max(
          travelSpan ?? Math.min(rect.width * 0.5, window.innerWidth * 0.5),
          1,
        ),
        base: p0.get(),
        target: p0.get(),
        moved: false,
        pointerId,
      };
      // La carta fruscia quando si stacca, non quando la si lascia andare.
      if (!resuming) playPageSound();
      return true;
    },
    [armGesture, open, p0, playPageSound, reducedMotion, stopHintAnim],
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
      if (!drag) return;
      /*
       * La presa si libera **prima** di ogni altra considerazione.
       *
       * Stava sotto il controllo sul gesto, e se il gesto era già stato
       * archiviato da qualcun altro — una navigazione arrivata a metà
       * trascinamento, un giro concluso dalla rete di sicurezza — si usciva di
       * qui lasciando `dragRef` pieno per sempre. Da quel momento
       * `onStagePointerDown` scartava ogni tocco successivo: il libro non
       * rispondeva più a niente, ed è il modo più silenzioso che ha di morire.
       */
      dragRef.current = null;
      if (!held) return;
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
    [p0, setGesture, stopHintAnim],
  );
  /** Come `latestRef`: la rete sulla finestra deve poter chiudere *questa* presa. */
  const endDragRef = useRef(endDrag);
  endDragRef.current = endDrag;

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
    // Se il giro è già stato speso il trascinamento non c'è più, ed `endDrag`
    // esce da sé: chiuderlo qui serve alla scorsa lasciata a metà.
    endDrag(false);
  }, [endDrag]);
  /** Come `latestRef`, per l'unica funzione che serve anche alla pulizia. */
  const endWheelRef = useRef(endWheel);
  endWheelRef.current = endWheel;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    /** Rimanda avanti il momento in cui la scorsa si considera finita. */
    const watch = (wheel: { idle: number }) => {
      window.clearTimeout(wheel.idle);
      wheel.idle = window.setTimeout(() => endWheelRef.current(), WHEEL_IDLE_MS);
    };

    const onWheel = (event: WheelEvent) => {
      const api = latestRef.current;
      if (!api || !api.open || api.reducedMotion) return;

      // Un trackpad manda le sfogliate a due dita su `deltaX`: è il gesto più
      // naturale che ci sia su un libro, e ignorarlo lasciava metà dei Mac
      // senza modo di girare pagina senza toccare il taglio.
      const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      const raw = horizontal ? event.deltaX : event.deltaY;

      // Se il puntatore è su una pagina che può ancora scorrere, la rotella è
      // sua — ma solo quando il gesto è verticale: una sfogliata orizzontale
      // non ha niente a che vedere con la carta che scorre sotto.
      if (!horizontal) {
        const scroller = (event.target as HTMLElement | null)?.closest?.("[data-vo-scroll]");
        if (scroller instanceof HTMLElement) {
          const room =
            raw > 0
              ? scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop
              : scroller.scrollTop;
          if (room > 1) return;
        }
      }
      event.preventDefault();
      const unit =
        event.deltaMode === 1 ? WHEEL_LINE_PX : event.deltaMode === 2 ? window.innerHeight : 1;
      const push = clamp(raw * unit, -WHEEL_MAX_STEP, WHEEL_MAX_STEP);
      if (push === 0) return;

      let wheel = wheelRef.current;
      if (wheel) {
        watch(wheel);
        // La scia di un gesto già compiuto: assorbita, non ascoltata.
        if (wheel.spent) return;
      } else {
        if (performance.now() < inputLockRef.current) return;
        const direction: 1 | -1 = push > 0 ? 1 : -1;
        wheel = { travel: 0, idle: 0, spent: false };
        wheelRef.current = wheel;
        watch(wheel);

        // Un foglio è ancora in volo: questa è una seconda intenzione e va in
        // coda, come una freccia premuta due volte. La scorsa nasce già spesa,
        // così la sua coda non ne accoda una terza.
        if (gestureRef.current?.mode === "run") {
          wheel.spent = true;
          api.step(direction);
          return;
        }
        // Prima si gira la testa, poi la pagina: qui la rotella non prende in
        // mano nessun foglio, sposta solo lo sguardo.
        if (api.tryShiftFocus(direction)) {
          wheel.spent = true;
          return;
        }
        // Qui invece un foglio da prendere non c'è proprio: siamo a un capo del
        // volume, e `step` sa chiudere il libro o girarlo sulla quarta.
        if (!api.beginDrag(direction, 0, WHEEL_POINTER_ID, WHEEL_SPAN)) {
          wheel.spent = true;
          api.step(direction);
          return;
        }
      }

      wheel.travel += push;
      const reached = api.updateDrag(-wheel.travel, true);
      // A un capo della corsa la decisione è presa: aspettare il silenzio
      // terrebbe il foglio incollato al bordo per un decimo di secondo. La
      // sessione però resta aperta — è lei che assorbe il resto dell'inerzia.
      if (reached <= 0 || reached >= 1) {
        wheel.spent = true;
        api.endDrag(false);
      }
    };

    // Registrato una volta sola, per la vita del componente: vedi `latestRef`.
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stage.removeEventListener("wheel", onWheel);
      if (wheelRef.current) endWheelRef.current();
    };
  }, []);

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
    if (!stage) return;

    let blocking = false;
    const onTouchStart = (event: TouchEvent) => {
      const api = latestRef.current;
      if (!api || !api.open || api.reducedMotion) {
        blocking = false;
        return;
      }
      const target = event.touches[0]?.target as HTMLElement | null;
      const scroller = target?.closest?.("[data-vo-scroll]");
      blocking = !(scroller instanceof HTMLElement && scroller.scrollHeight > scroller.clientHeight);
    };
    const onTouchMove = (event: TouchEvent) => {
      if (blocking) event.preventDefault();
    };
    const onTouchEnd = () => {
      blocking = false;
    };

    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchmove", onTouchMove, { passive: false });
    stage.addEventListener("touchend", onTouchEnd, { passive: true });
    stage.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchmove", onTouchMove);
      stage.removeEventListener("touchend", onTouchEnd);
      stage.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  /**
   * La rete sotto ogni presa.
   *
   * Un trascinamento finisce quando il dito si alza, e il rilascio arriva
   * all'elemento su cui la presa era stata catturata. Ma la cattura si può
   * perdere — il browser la revoca quando decide di scorrere lui, un ridisegno
   * può sostituire l'elemento, un `pointercancel` può arrivare da tutt'altra
   * parte — e allora quel rilascio non arriva mai a nessuno: `dragRef` resta
   * pieno per sempre, `onStagePointerDown` scarta ogni tocco successivo, e il
   * libro smette di rispondere del tutto. È il modo più silenzioso che ha di
   * morire, ed è quello che l'utente descriveva come "si blocca e non fa più
   * scorrere da nessuna parte".
   *
   * La finestra vede *tutti* i rilasci, sempre, qualunque cosa sia successo
   * all'elemento sotto. Da qui una presa non può sopravvivere al dito che
   * l'aveva aperta.
   */
  useEffect(() => {
    const release = (event: PointerEvent) => {
      if (swipeRef.current?.pointerId === event.pointerId) swipeRef.current = null;
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      endDragRef.current(false);
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    // Un tocco che finisce mentre la scheda passa in secondo piano non manda
    // né l'uno né l'altro: il gesto va comunque restituito.
    const abandon = () => {
      if (document.visibilityState !== "hidden") return;
      swipeRef.current = null;
      if (dragRef.current) endDragRef.current(false);
      if (wheelRef.current) endWheelRef.current();
    };
    document.addEventListener("visibilitychange", abandon);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      document.removeEventListener("visibilitychange", abandon);
    };
  }, []);

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
        if (Math.abs(dx) < SWIPE_SLOP) {
          // Non ancora deciso. Si aspetta ancora un po', a meno che il dito non
          // sia chiaramente sceso o salito: quello è scorrimento della carta.
          // Prima bastava un pixel di verticale in più per buttare via il gesto
          // *per sempre* — e un pollice non parte mai perfettamente orizzontale,
          // quindi una sfogliata su due non partiva.
          if (Math.abs(dy) > SWIPE_SLOP * 1.5) swipeRef.current = null;
          return;
        }
        if (Math.abs(dx) <= Math.abs(dy)) {
          swipeRef.current = null;
          return;
        }
        const dir: 1 | -1 = dx < 0 ? 1 : -1;
        // Un foglio è ancora in volo: questo dito non può prenderlo, ma la sua
        // intenzione non va persa — vale il prossimo giro, come per rotella e
        // frecce. Senza, sfogliare a raffica col pollice mangiava un gesto su due.
        // Il fuoco si legge solo qui *sotto*, a rincorsa ferma: durante il
        // volo non è ancora quello vero, perché lo scrive `commit` all'atterraggio.
        if (gestureRef.current?.mode === "run") {
          swipeRef.current = null;
          queuedRef.current = dir;
          // Una sfogliata resta una sfogliata anche se arriva in coda: su schermo
          // stretto vale mezzo passo, non una pagina intera.
          queuedShiftRef.current = true;
          return;
        }
        // Prima si gira la testa, poi la pagina: una sfogliata che arriva
        // mentre lo sguardo non è ancora sul bordo giusto sposta il fuoco e
        // **finisce lì**.
        if (tryShiftFocus(dir)) {
          /*
           * Una sfogliata vale un passo solo.
           *
           * Su schermo stretto la lettura procede sinistra → destra → pagina
           * nuova → sinistra: sono quattro momenti, e ognuno è un gesto. Per un
           * momento questo gesto si era rimesso l'origine sotto il dito, così da
           * incatenare la carrellata al giro pagina in un movimento unico: ma
           * quel movimento unico *salta la facciata destra*, cioè metà del
           * libro. Chi spinge il pollice per andare dalla sinistra alla destra
           * si ritrovava direttamente sulla sinistra successiva.
           *
           * Il dito resta giù ma il gesto è speso: per il passo dopo si
           * ricomincia, ed è giusto così — è quello che distingue lo sfogliare
           * dal trascinare.
           */
          swipeRef.current = null;
          return;
        }
        // Il gesto comincia dove la soglia è stata superata, non dove il dito si è
        // posato: altrimenti il foglio scatta in avanti dei pixel di tolleranza.
        const originX = swipe.startX + (dir === 1 ? -SWIPE_SLOP : SWIPE_SLOP);
        if (!beginDrag(dir, originX, event.pointerId)) {
          swipeRef.current = null;
          /*
           * Oltre l'ultima pagina c'è la quarta di copertina, e lì la sfogliata
           * ci porta: senza questo ripiego, sul telefono il gesto sull'ultima
           * pagina non faceva proprio nulla.
           *
           * **E indietro dalla prima pagina chiude il volume**, di nuovo.
           * Era stato tolto perché a libro chiuso il dito non aveva più niente
           * da sfogliare — la cerimonia di riapertura ascoltava il solo gesto
           * verticale — e chi continuava a sfogliare di lato trovava un libro
           * morto. Adesso la cerimonia accetta anche il gesto orizzontale, e
           * quel vicolo cieco non c'è più: chiudere il libro sfogliando indietro
           * dalla prima pagina torna a essere quello che ci si aspetta.
           */
          step(dir);
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
    [beginDrag, dropHint, hintAt, open, reducedMotion, step, tryShiftFocus, updateDrag],
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
      // Il taglio è un comando, non un'esitazione: gira la pagina e basta.
      step(dir, false);
    },
    [step],
  );

  // Lo sportello degli ascoltatori nativi si riempie qui, in fondo al render,
  // quando tutte le funzioni esistono. Gli eventi arrivano sempre dopo.
  latestRef.current = {
    open,
    reducedMotion,
    step,
    tryShiftFocus,
    beginDrag,
    updateDrag,
    endDrag,
  };

  // Il gesto "run" riparte da capo: i motion value non usati vanno riportati a zero.
  const activeLeaves = gesture?.leaves ?? [];
  const staticLeft = gesture ? (gesture.dir === 1 ? gesture.from : gesture.to) : pos;
  const staticRight = gesture ? (gesture.dir === 1 ? gesture.to : gesture.from) : pos;

  const canGoBack = pos >= appendixBase ? true : pos > 0;
  const canGoForward = pos >= appendixBase ? false : pos < positionCount - 1;

  return (
    <motion.div
      className="vo-book-stage"
      ref={stageRef}
      data-open={open || undefined}
      data-busy={busy || undefined}
      data-compact={compact || undefined}
      // Solo su schermo stretto: dicono a `.vo-book-stage`, in CSS, su quale
      // facciata zoomare (`--vo-compact-focus-t`) e quanto di quello zoom è
      // acceso in questo istante (`--vo-compact-zoom-t`). Innocui su schermo
      // largo, dove il CSS non li legge.
      style={{
        ...({
          "--vo-compact-focus-t": cameraFocusT,
          "--vo-compact-zoom-t": compactZoomT,
          "--vo-compact-open-t": compactZoomActivation,
          // Su schermo largo è la sola telecamera: vedi `flipDepthT`.
          "--vo-flip-t": flipDepthT,
        } as CSSProperties),
      }}
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
              back={backReal ? pageSheet(faces.back.spread, faces.back.side) : fillerSheet}
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
          disabled={!open || pos >= appendixBase || (!canGoForward && !onPastLastPage)}
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
          /*
           * Sul taglio sinistro della prima pagina il tocco chiude il volume, su
           * schermo largo come su stretto. Era disabilitato in compatto finché la
           * cerimonia di riapertura ascoltava il solo gesto verticale: adesso
           * accetta anche quello orizzontale, quindi da chiuso si torna dentro con
           * lo stesso gesto con cui si è usciti.
           */
          disabled={!open || (!canGoBack && !onBeforeFirstPage)}
          aria-label="Pagina precedente"
        />
      </motion.div>

      <p className="vo-book-live" aria-live="polite">
        {shownAppendix !== null
          ? (voAppendixOrder[shownAppendix]?.runningHead ?? voSpreads[spread].runningHead)
          : voSpreads[spread].runningHead}
      </p>
    </motion.div>
  );
}
