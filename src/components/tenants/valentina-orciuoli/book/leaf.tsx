"use client";

import { motion, useTransform, useVelocity, type MotionValue } from "framer-motion";
import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";

/**
 * Un foglio del volume. Ruota attorno al dorso (bordo sinistro) da 0° (appoggiato
 * a destra) a -180° (appoggiato a sinistra); lo stesso elemento serve sia il gesto
 * "avanti" sia "indietro", cambia solo la direzione in cui `progress` viene animato.
 *
 * Il foglio è **un piano solo**, e la sua curvatura è luce, non geometria.
 *
 * Prima era spezzato in sei doghe curvate per davvero. Ogni doga però deve
 * ritagliare la propria striscia di DOM vivo, quindi ogni foglio portava dodici
 * copie della pagina — trentasei con tre fogli in volo — da ricomporre a ogni
 * fotogramma dentro un contesto 3D. Due conseguenze, entrambe visibili: il libro
 * perdeva fotogrammi a ogni giro, e le doghe — spinte per centinaia di pixel in
 * profondità — attraversavano il piano delle pagine ferme, che è ciò che faceva
 * vedere la carta in volo tagliata a metà da quella posata.
 *
 * L'arco esiste ancora, ma alimenta solo la rampa di luce, il riflesso e l'ombra
 * portata. A un giro pagina nessuno misura la pancia del foglio: quello che si
 * vede è come la luce ci scorre sopra.
 */

/**
 * L'arco virtuale della carta ai quarti di giro. È nullo ai due capi (il foglio è
 * posato) *e a metà giro* (in piedi fuori dal libro la carta è quasi piana):
 * gonfia ai quarti, quando un capo è ancora appoggiato e l'altro è già in volo.
 */
const ARC_DEG = 38;
/**
 * La frusta: l'aria e l'inerzia trattengono il taglio mentre il foglio vola, e lo
 * lasciano andare quando si posa. È l'unico termine che dipende dalla velocità e
 * non dalla posizione, ed è quello che distingue un foglio trascinato piano — che
 * resta quasi piatto sotto il dito — da uno lanciato con un colpetto.
 */
const WHIP_DEG_PER_TURN = 4;
const WHIP_MAX_DEG = 10;

/**
 * Lo **sghembo** del foglio: quanto l'angolo esterno anticipa il resto del taglio.
 *
 * Non è una `rotateZ`. Una rotazione sul piano fa ruotare *anche il bordo sul
 * dorso*, che è cucito nella legatura e non può muoversi: a un grado si vedeva il
 * foglio staccarsi dal solco. Uno scorrimento verticale crescente lungo il foglio
 * lascia il dorso esattamente dov'è e solleva l'angolo libero, che è come si stacca
 * una pagina vera — prima l'angolo, poi il resto.
 */
const SHEAR_DEG = 1.4;
/** Quanto la frusta si somma allo sghembo: l'angolo in coda rincorre il resto. */
const SHEAR_PER_WHIP_DEG = 0.055;

const DEG = Math.PI / 180;

/**
 * La z della pagina sinistra ferma (la applica `book-shell`). Un foglio sollevato
 * da quella pila deve starle davanti, non complanare: due piani alla stessa
 * distanza in una scena `preserve-3d` si contendono il posto e si vedono a chiazze.
 */
const LEFT_PAGE_DEPTH = 2;

/**
 * La luce della scena: da sinistra, dall'alto, davanti. Non è una scelta libera —
 * è la stessa direzione da cui arrivano l'ombra ambientale sotto il volume e i
 * gradienti dei piatti, e se le due non coincidono il libro si sfalda in oggetti
 * illuminati da soli diversi. Solo x e z contano: il foglio ruota attorno a Y,
 * quindi la sua normale non ha mai componente verticale.
 */
const LIGHT_X = -0.42;
const LIGHT_Z = 0.8;
/** Bisettrice fra luce e osservatore: dove la carta restituisce il riflesso. */
const HALF_X = -0.2216;
const HALF_Z = 0.9498;

/**
 * Quanto si amplifica il lato *chiaro* della rampa.
 *
 * La formula di Lambert su carta molto ambientale ha una gamma sbilanciata: verso
 * il buio corre fino a 1, verso la luce ha appena sette centesimi. Senza guadagno,
 * il lato chiaro non esiste — ed è metà del giro, perché una pagina che si alza
 * verso una luce frontale *prende luce* prima di perderla. È il termine che dà
 * forma alla carta nella prima metà, dove prima era un cartoncino piatto.
 */
const LIT_GAIN = 2.5;
/** Il lampo speculare: stretto, quindi va pesato più del diffuso. */
const SPEC_GAIN = 0.22;

/**
 * L'ombra portata **non può avere la stessa estensione del foglio**, o resta
 * nascosta sotto di lui per tutto il giro — che è esattamente ciò che succedeva.
 * La luce arriva di sbieco, quindi l'ombra di un foglio alzato sporge oltre il suo
 * taglio: questo è il rapporto fra la componente orizzontale della luce e quella
 * frontale, cioè di quanto scivola l'ombra per ogni unità di altezza.
 */
const SHADOW_LEAN = 0.45;

function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

/**
 * Quanto una superficie si scurisce, dalla sua normale. `facing` vale 1 per il
 * recto e -1 per il verso: sono le due facce della stessa carta, quindi la stessa
 * formula con la normale ribaltata.
 */
function lambertShade(angleDeg: number, facing: number) {
  const angle = angleDeg * DEG;
  const lambert = facing * Math.sin(angle) * LIGHT_X + facing * Math.cos(angle) * LIGHT_Z;
  return (0.86 - lambert) / 1.5;
}

/**
 * Il velo che il foglio porterebbe da fermo. Va sottratto, perché a foglio posato
 * la carta in volo e la pagina sotto di lei devono essere *la stessa cosa*: montare
 * o smontare il foglio è un'operazione che avviene sempre lì, e un velo residuo
 * la trasformava in uno scalino di luce — la pagina si incupiva appena il puntatore
 * sfiorava il taglio e si schiariva di colpo quando il giro finiva.
 */
const REST_SHADE = lambertShade(0, 1);

/** Il segno conta: sopra lo zero la carta è più scura del riposo, sotto è più chiara. */
function shadeAt(angleDeg: number, facing: number) {
  return lambertShade(angleDeg, facing) - REST_SHADE;
}

/** Il lobo speculare della carta: largo e debole, perché la carta è opaca. */
function sheenAt(angleDeg: number, facing: number) {
  const angle = angleDeg * DEG;
  const spec = facing * Math.sin(angle) * HALF_X + facing * Math.cos(angle) * HALF_Z;
  return spec <= 0 ? 0 : Math.pow(spec, 14);
}

/**
 * La posizione di lettura della pagina che il foglio si è appena preso.
 *
 * La faccia in volo è una copia montata da zero, quindi nasce riavvolta in cima
 * mentre copre esattamente la pagina che si stava leggendo a metà: senza questo,
 * sfiorare il taglio di una pagina scorsa la faceva saltare all'inizio.
 */
function useCarriedScroll(ref: RefObject<HTMLDivElement | null>, top: number, carryKey: number) {
  useLayoutEffect(() => {
    if (!top) return;
    const body = ref.current?.querySelector<HTMLElement>("[data-vo-scroll]");
    if (body) body.scrollTop = top;
    // `carryKey` è il gesto: cambia quando la faccia cambia contenuto, ed è quello
    // che deve far riapplicare la posizione su un foglio che non si è rimontato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carryKey, top]);
}

export function VoLeaf({
  progress,
  front,
  back,
  depth,
  lifted = false,
  frontScroll = 0,
  backScroll = 0,
  carryKey = 0,
}: {
  progress: MotionValue<number>;
  front: ReactNode;
  back: ReactNode;
  depth: number;
  /**
   * Il foglio è stato *sollevato* dalla pila di sinistra invece che staccato da
   * quella di destra: sta tornando indietro, quindi resta in cima per tutto il
   * gesto. Vedi `z` più sotto.
   */
  lifted?: boolean;
  /** Posizione di lettura da riportare sulla faccia che copre la pagina lasciata. */
  frontScroll?: number;
  backScroll?: number;
  /** Cambia a ogni gesto: è la scadenza delle due posizioni qui sopra. */
  carryKey?: number;
}) {
  const frontRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);
  useCarriedScroll(frontRef, frontScroll, carryKey);
  useCarriedScroll(backRef, backScroll, carryKey);

  /**
   * L'angolo del piano di carta: la corda fra dorso e taglio. È il gesto, senza
   * correzioni — un foglio piano non ha nulla fra i due capi da compensare.
   */
  const chord = useTransform(progress, (p) => p * -180);

  /**
   * L'arco virtuale: non piega più niente, ma dice di quanto la normale della
   * carta ruota fra il dorso e il taglio, ed è da lì che nasce tutta la luce.
   */
  const arc = useTransform(progress, (p) => -ARC_DEG * Math.sin(2 * Math.PI * p));
  const velocity = useVelocity(progress);
  const whip = useTransform(velocity, (v) =>
    clamp(v * WHIP_DEG_PER_TURN, -WHIP_MAX_DEG, WHIP_MAX_DEG),
  );
  /** L'apertura totale della rampa: l'arco che la carta descrive più la frusta. */
  const bend = useTransform([arc, whip] as MotionValue<number>[], ([a, w]: number[]) => a + w);

  // I due bordi della carta. La rampa di luce li congiunge: il dorso resta quasi
  // tangente al piatto, il taglio è dove il gesto lo porta.
  const nearAngle = useTransform(
    [chord, bend] as MotionValue<number>[],
    ([c, b]: number[]) => c - b / 2,
  );
  const farAngle = useTransform(
    [chord, bend] as MotionValue<number>[],
    ([c, b]: number[]) => c + b / 2,
  );

  /**
   * Quanto la carta è incurvata, da 0 a 1. Pesa il riflesso: con la carta piana
   * non esiste una zona che guardi la bisettrice, quindi non esiste riflesso
   * radente — ed è anche ciò che tiene il velo chiaro *esattamente* a zero sul
   * foglio posato, dove il lobo speculare varrebbe da solo quasi la metà.
   */
  const curl = useTransform(arc, (a) => clamp(Math.abs(a) / 18, 0, 1));

  // Due veli per bordo e per faccia: uno per il lato scuro della rampa, uno per
  // quello chiaro. Sono le due metà della stessa funzione con segno, separate
  // perché un'opacità non può cambiare segno.
  const dark = (angle: number, facing: number) => clamp(shadeAt(angle, facing), 0, 0.92);
  const glow = (angle: number, facing: number, k: number) =>
    clamp(
      clamp(-shadeAt(angle, facing), 0, 1) * LIT_GAIN + sheenAt(angle, facing) * SPEC_GAIN * k,
      0,
      0.34,
    );

  const frontDarkNear = useTransform(nearAngle, (a) => dark(a, 1));
  const frontDarkFar = useTransform(farAngle, (a) => dark(a, 1));
  const backDarkNear = useTransform(nearAngle, (a) => dark(a, -1));
  const backDarkFar = useTransform(farAngle, (a) => dark(a, -1));

  const near = [nearAngle, curl] as MotionValue<number>[];
  const far = [farAngle, curl] as MotionValue<number>[];
  const frontGlowNear = useTransform(near, ([a, k]: number[]) => glow(a, 1, k));
  const frontGlowFar = useTransform(far, ([a, k]: number[]) => glow(a, 1, k));
  const backGlowNear = useTransform(near, ([a, k]: number[]) => glow(a, -1, k));
  const backGlowFar = useTransform(far, ([a, k]: number[]) => glow(a, -1, k));

  /**
   * La profondità del foglio rispetto al blocco pagine.
   *
   * **Un foglio in mano sta sopra le due pile, sempre.** Da qualunque parte
   * arrivi e comunque vada.
   *
   * Andando avanti la rampa scendeva a `-depth`, cioè il foglio finiva *dietro*
   * la pila di sinistra. La giustificazione era che a quel punto le due portano
   * lo stesso contenuto, e quindi lo scambio non si vede. Non è vero: la pagina
   * sinistra ferma porta ancora la sezione di **partenza** — il contenuto
   * d'arrivo sta sul retro del foglio, ed è proprio quello che spariva dietro.
   * Misurato a fine corsa: foglio a z −2.26, pagina sinistra a +2, la pagina
   * mostra `libri` mentre il retro del foglio mostra `trilogia`. Da lì il lampo
   * della pagina precedente per tutta la coda della molla, prima che l'atterraggio
   * scrivesse la sezione nuova.
   *
   * Ora la rampa sale: si parte davanti alla pila di destra (a 0) e si arriva
   * davanti a quella di sinistra (a `LEFT_PAGE_DEPTH`). Lo scambio col blocco
   * pagine avviene quando il foglio si smonta, e lì il contenuto è davvero lo
   * stesso. `lifted` — il foglio sollevato dalla pila di sinistra, che torna
   * indietro — sta in cima da subito e la sua z non cambia.
   */
  const restZ = depth + LEFT_PAGE_DEPTH;
  const z = useTransform(progress, [0, 1], lifted ? [restZ, restZ] : [depth, restZ]);

  /** L'angolo libero anticipa il resto del taglio; in coda lo rincorre. */
  const shear = useTransform(
    [progress, whip] as MotionValue<number>[],
    ([p, w]: number[]) => {
      const lead = -SHEAR_DEG * Math.sin(2 * Math.PI * p);
      return lead + w * SHEAR_PER_WHIP_DEG;
    },
  );

  /**
   * L'ombra portata sulla pagina sotto. Non è un `box-shadow` sul foglio: quella
   * resta incollata alla carta e ruota con lei, mentre l'ombra di un foglio alzato
   * sta sul piano del libro.
   *
   * La sua lunghezza **non** è il semplice coseno dell'angolo. Con il solo coseno
   * l'ombra ha esattamente la stessa estensione della proiezione del foglio, cioè
   * gli resta nascosta sotto per tutto il giro: era un elemento che non si è mai
   * visto. La luce arriva di sbieco, quindi l'ombra sporge oltre il taglio in
   * proporzione a quanto il foglio è alzato — ed è quella lama che sfila sulla
   * pagina destra a raccontare che sopra c'è della carta in aria.
   */
  const castScale = useTransform(chord, (c) => {
    const a = c * DEG;
    return clamp(Math.cos(a) + SHADOW_LEAN * Math.abs(Math.sin(a)), -1, 1);
  });
  /** Massima a foglio in piedi: è lì che la carta è più alta sopra la pagina. */
  const castOpacity = useTransform(progress, (p) => 0.6 * Math.sin(Math.PI * p));

  /**
   * La piega sul dorso: massima a metà rotazione, nulla ai due capi. Deve morire
   * del tutto sul foglio posato, altrimenti è un velo scuro che compare e sparisce
   * insieme al foglio invece che insieme al movimento.
   */
  const fold = useTransform(progress, [0, 0.5, 1], [0, 1, 0]);

  return (
    <>
      <motion.div
        className="vo-leaf-cast"
        aria-hidden="true"
        style={{ scaleX: castScale, opacity: castOpacity }}
      />
      <motion.div
        className="vo-leaf"
        style={{ z, rotateY: chord, skewY: shear }}
        aria-hidden="true"
        // Le facce duplicano il contenuto delle pagine statiche: senza `inert`
        // link e campi del foglio in volo resterebbero raggiungibili da tastiera.
        inert
      >
        <div className="vo-leaf-face vo-leaf-front" ref={frontRef}>
          {front}
          <motion.span className="vo-leaf-lit vo-leaf-lit-near" style={{ opacity: frontDarkNear }} />
          <motion.span className="vo-leaf-lit vo-leaf-lit-far" style={{ opacity: frontDarkFar }} />
          <motion.span
            className="vo-leaf-glow vo-leaf-glow-near"
            style={{ opacity: frontGlowNear }}
          />
          <motion.span className="vo-leaf-glow vo-leaf-glow-far" style={{ opacity: frontGlowFar }} />
          <motion.span className="vo-leaf-fold vo-leaf-fold-front" style={{ opacity: fold }} />
          <motion.span className="vo-leaf-rim" style={{ opacity: curl }} />
        </div>
        {/* Il verso è la stessa superficie vista da dietro: ruotato di 180°, ha i
            due bordi scambiati, quindi la rampa di luce corre al contrario. */}
        <div className="vo-leaf-face vo-leaf-back" ref={backRef}>
          {back}
          <motion.span className="vo-leaf-lit vo-leaf-lit-near" style={{ opacity: backDarkFar }} />
          <motion.span className="vo-leaf-lit vo-leaf-lit-far" style={{ opacity: backDarkNear }} />
          <motion.span className="vo-leaf-glow vo-leaf-glow-near" style={{ opacity: backGlowFar }} />
          <motion.span className="vo-leaf-glow vo-leaf-glow-far" style={{ opacity: backGlowNear }} />
          <motion.span className="vo-leaf-fold vo-leaf-fold-back" style={{ opacity: fold }} />
          <motion.span className="vo-leaf-rim" style={{ opacity: curl }} />
        </div>
      </motion.div>
    </>
  );
}
