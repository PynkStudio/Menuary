/**
 * Memoria del volume che sopravvive a un rimontaggio del componente.
 *
 * Fra due sezioni (`/it/libri` → `/it/contatti`) il libro non si rimonta: sono lo
 * stesso route file, e la shell di transizione condivide una chiave sola. Ma la
 * home e le sezioni sono route file **diversi** (`[previewSlug]` contro
 * `[previewSlug]/[bookId]`), quindi lì React monta un componente nuovo e lo stato
 * di lettura andrebbe perso: il libro ripartirebbe dalla pagina d'arrivo, e lo
 * sfogliare non si vedrebbe.
 *
 * Regola d'oro: ogni campo si scrive quando la cosa *accade davvero* (il libro si
 * apre, il foglio atterra, il volume finisce di rigirarsi), mai al montaggio. Un
 * flag scritto al montaggio verrebbe consumato dal doppio montaggio di
 * StrictMode, che rimonta sullo stesso path senza che sia successo nulla.
 */
export const voBookMemory = {
  /** true dopo che il volume è stato aperto almeno una volta in questa scheda. */
  opened: false,
  /** Ultimo spread mostrato. */
  spread: 0,
  /**
   * Quale delle due facciate dello spread era in vista, su schermo stretto.
   *
   * Sta qui per lo stesso motivo dello spread: senza, un rimontaggio riportava la
   * facciata a zero, e siccome l'URL nomina la sezione e non la pagina il libro
   * *tornava indietro da solo* di una facciata ogni volta che un giro finiva su
   * quella di destra. Su schermo largo non ha significato e resta zero.
   */
  half: 0,
  /** true se il volume è rigirato sulla quarta di copertina. */
  back: false,
  /** true se la camera è sulla scrivania invece che sul volume. */
  desk: false,
  /** Preferenza audio. */
  sound: true,
  /**
   * La dedica si scrive una volta sola per sessione di lettura. Tornare sul
   * frontespizio sfogliando non deve far ricominciare la penna da capo: sarebbe
   * un'animazione che si ripete, e un'animazione che si ripete smette di essere
   * un gesto e diventa un effetto.
   */
  dedicationWritten: false,
  /**
   * Il suggerimento "sfoglia di lato" si mostra una volta sola per scheda, la
   * prima volta che il libro si apre su schermo stretto. Senza questo flag
   * ricomparirebbe a ogni sezione visitata — smettendo di essere un
   * insegnamento e diventando un intralcio.
   */
  swipeHintSeen: false,
};

/**
 * Sul server i moduli sono condivisi fra le richieste: leggere questa memoria
 * durante il render farebbe finire lo stato di un visitatore nell'HTML del
 * successivo, e l'idratazione fallirebbe. Esiste solo nel browser.
 */
export const voBookMemoryAvailable = typeof window !== "undefined";
