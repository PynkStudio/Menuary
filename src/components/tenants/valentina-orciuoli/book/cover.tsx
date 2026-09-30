"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import type { ReactNode } from "react";

/**
 * La copertina è l'unica superficie del libro che si può curvare per davvero: è
 * una texture, non DOM vivo. L'arte è spezzata in doghe verticali annidate, ognuna
 * ruotata di un incremento costante rispetto alla precedente — è l'approssimazione
 * cilindrica classica, e restituisce il cartoncino che si imbarca mentre si apre.
 *
 * Titolo e cornice restano su un piano non curvato sopra le doghe: la piega è di
 * ~20° e dura poco più di un secondo, l'occhio non coglie lo scarto ma coglierebbe
 * eccome il testo spezzato in sette tronconi.
 */
const STAVES = 5;
const MAX_BEND_DEG = 22;
function BentCover({ bend }: { bend: MotionValue<number> }) {
  // Le doghe si annidano: ognuna parte dove finisce la precedente e ci aggiunge
  // la propria rotazione, così gli angoli si sommano lungo la curva.
  let stack: ReactNode = null;
  for (let index = STAVES - 1; index >= 0; index -= 1) {
    const child = stack;
    stack = (
      <motion.div
        className="vo-cover-stave"
        key={index}
        style={{
          rotateY: bend,
          width: `calc(var(--vo-cover-w) / ${STAVES})`,
          left: index === 0 ? 0 : "100%",
          ["--vo-stave" as string]: index,
        }}
        data-stave={index}
      >
        {child}
      </motion.div>
    );
  }
  return <div className="vo-cover-staves">{stack}</div>;
}

export function VoCover({ progress }: { progress: MotionValue<number> }) {
  const rotateY = useTransform(progress, [0, 1], [0, -180]);
  // La piega nasce e muore col movimento: cartoncino fermo = cartoncino piatto.
  const bend = useTransform(progress, (p) => (Math.sin(p * Math.PI) * MAX_BEND_DEG) / STAVES);
  const shade = useTransform(progress, [0, 0.45, 1], [0, 0.42, 0.66]);
  const insideShade = useTransform(progress, [0, 0.5, 1], [0.72, 0.34, 0.08]);

  return (
    <motion.div className="vo-cover" style={{ rotateY }} aria-hidden="true">
      {/* La z resta costante (la detta `--vo-cover-depth`, che serve anche al
          dorso): chiusa la copertina sta davanti al blocco, e la rotazione di 180°
          da sola la porta dietro alle pagine una volta aperta — che è esattamente
          dove deve stare il piatto di un libro aperto. */}
      <div className="vo-cover-depth">
      <div className="vo-cover-face vo-cover-front">
        <BentCover bend={bend} />
        <div className="vo-cover-plate">
          <div className="vo-cover-titling">
            <strong className="vo-cover-name">Valentina Orciuoli</strong>
          </div>
        </div>
        <motion.span className="vo-cover-shade" style={{ opacity: shade }} />
      </div>
      <div className="vo-cover-face vo-cover-inside">
        <div className="vo-cover-endpaper" />
        <motion.span className="vo-cover-shade" style={{ opacity: insideShade }} />
      </div>
      </div>
    </motion.div>
  );
}
