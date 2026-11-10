"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useId, type ReactNode } from "react";
import type { DishIndex } from "@/lib/dish-builder/engine";
import type { DishBaseArt, DishIngredient, DishLayout } from "@/lib/dish-builder/types";
import {
  DEFAULT_PIECE_COUNT,
  STACK_LAYER_HEIGHT,
  StackLayer,
  TopPiece,
  drizzlePath,
  r2,
  seeded,
} from "./dish-art";

type Placed = { key: string; x: number; y: number; rot: number; ing: DishIngredient; order: number };

const GOLDEN = 2.399963229728653;

function portionsInOrder(picks: string[]) {
  const seen = new Map<string, number>();
  return picks.map((id) => {
    const p = seen.get(id) ?? 0;
    seen.set(id, p + 1);
    return { id, portion: p };
  });
}

/** Pezzi distribuiti a spirale aurea con fase propria per ingrediente: copertura uniforme, niente grumi. */
function scatterDisc(index: DishIndex, picks: string[], radius: number): Placed[] {
  const out: Placed[] = [];
  portionsInOrder(picks).forEach(({ id, portion }, order) => {
    const ing = index.ingredients.get(id);
    if (!ing || ing.art.shape === "drizzle") return;
    const n = ing.art.count ?? DEFAULT_PIECE_COUNT[ing.art.shape];
    const rand = seeded(`${id}:${portion}`);
    const phase = rand() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const r = radius * Math.sqrt((k + 0.5) / n) * (0.88 + rand() * 0.12);
      const th = phase + k * GOLDEN + (rand() - 0.5) * 0.5;
      out.push({ key: `${id}:${portion}:${k}`, x: Math.cos(th) * r, y: Math.sin(th) * r, rot: rand() * 360, ing, order });
    }
  });
  return out;
}

/** Ogni ingrediente prende uno spicchio della ciotola; briciole e semi restano sparsi ovunque. */
function scatterBowl(index: DishIndex, picks: string[], inner: number, outer: number): Placed[] {
  const sectorIds = [...new Set(picks)].filter((id) => {
    const s = index.ingredients.get(id)?.art.shape;
    return s && s !== "drizzle" && s !== "crumb";
  });
  const out: Placed[] = [];
  const span = (Math.PI * 2) / Math.max(1, sectorIds.length);
  portionsInOrder(picks).forEach(({ id, portion }, order) => {
    const ing = index.ingredients.get(id);
    if (!ing || ing.art.shape === "drizzle") return;
    const n = ing.art.count ?? DEFAULT_PIECE_COUNT[ing.art.shape];
    const rand = seeded(`${id}:${portion}`);
    const slot = sectorIds.indexOf(id);
    for (let k = 0; k < n; k++) {
      let x: number;
      let y: number;
      if (slot < 0) {
        const r = outer * Math.sqrt(rand()) * 0.95;
        const th = rand() * Math.PI * 2;
        x = Math.cos(th) * r;
        y = Math.sin(th) * r;
      } else {
        const th = -Math.PI / 2 + slot * span + span * (0.12 + rand() * 0.76);
        const r = inner + (outer - inner) * Math.sqrt(rand());
        x = Math.cos(th) * r;
        y = Math.sin(th) * r;
      }
      out.push({ key: `${id}:${portion}:${k}`, x, y, rot: rand() * 360, ing, order });
    }
  });
  return out;
}

function FallingPiece({ p, reduce }: { p: Placed; reduce: boolean }) {
  return (
    <g transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`}>
      <motion.g
        initial={reduce ? { opacity: 0 } : { y: -220, opacity: 0, scale: 1.7 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.4 }}
        transition={
          reduce
            ? { duration: 0.15 }
            : { type: "spring", stiffness: 420, damping: 26, delay: (hashDelay(p.key) % 9) * 0.03 }
        }
      >
        <g transform={`rotate(${p.rot.toFixed(0)})`} filter="url(#db-piece-shadow)">
          <TopPiece art={p.ing.art} seed={p.key} />
        </g>
      </motion.g>
    </g>
  );
}

function hashDelay(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Drizzles({ index, picks, radius, reduce }: { index: DishIndex; picks: string[]; radius: number; reduce: boolean }) {
  return (
    <AnimatePresence>
      {portionsInOrder(picks)
        .filter(({ id }) => index.ingredients.get(id)?.art.shape === "drizzle")
        .map(({ id, portion }) => {
          const ing = index.ingredients.get(id)!;
          return (
            <motion.path
              key={`${id}:${portion}`}
              d={drizzlePath(`${id}:${portion}`, radius)}
              fill="none"
              stroke={ing.art.color}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: reduce ? 1 : 0, opacity: reduce ? 0 : 1 }}
              animate={{ pathLength: 1, opacity: 0.95 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0.15 : 0.9, ease: "easeInOut" }}
              filter="url(#db-piece-shadow)"
            />
          );
        })}
    </AnimatePresence>
  );
}

function PizzaBase({ art, uid }: { art: DishBaseArt; uid: string }) {
  if (art.image) return <image href={art.image} x={-180} y={-180} width={360} height={360} />;
  const rand = seeded("crust");
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-crust`}>
          <stop offset="78%" stopColor={art.primary} />
          <stop offset="100%" stopColor={art.tertiary ?? art.primary} />
        </radialGradient>
      </defs>
      <circle r={178} fill={`url(#${uid}-crust)`} />
      {Array.from({ length: 22 }, (_, i) => {
        const th = rand() * Math.PI * 2;
        const r = 160 + rand() * 16;
        const x = r2(Math.cos(th) * r);
        const y = r2(Math.sin(th) * r);
        return <ellipse key={i} cx={x} cy={y} rx={r2(3 + rand() * 6)} ry={r2(2 + rand() * 3)} fill={art.tertiary ?? "#5a3210"} opacity={0.55} transform={`rotate(${Math.round(th * 57.3)} ${x} ${y})`} />;
      })}
      <motion.circle r={156} animate={{ fill: art.secondary ?? art.primary }} transition={{ duration: 0.4 }} />
      <circle r={156} fill="none" stroke="#000" strokeOpacity={0.12} strokeWidth={6} />
    </g>
  );
}

function BowlBase({ art }: { art: DishBaseArt }) {
  if (art.image) return <image href={art.image} x={-185} y={-185} width={370} height={370} />;
  const rand = seeded("rice");
  return (
    <g>
      <circle r={184} fill={art.tertiary ?? "#222"} />
      <circle r={172} fill={art.primary} />
      <motion.circle r={150} animate={{ fill: art.secondary ?? "#fff" }} transition={{ duration: 0.4 }} />
      {Array.from({ length: 140 }, (_, i) => {
        const th = rand() * Math.PI * 2;
        const r = 148 * Math.sqrt(rand());
        const x = r2(Math.cos(th) * r);
        const y = r2(Math.sin(th) * r);
        return <ellipse key={i} cx={x} cy={y} rx={3} ry={1.4} fill="#000" opacity={0.06} transform={`rotate(${Math.round(rand() * 180)} ${x} ${y})`} />;
      })}
    </g>
  );
}

function NestBase({ art, sauce }: { art: DishBaseArt; sauce?: string }) {
  if (art.image) return <image href={art.image} x={-185} y={-185} width={370} height={370} />;
  const rand = seeded("nest");
  const strands = Array.from({ length: 46 }, (_, i) => {
    const th = rand() * Math.PI * 2;
    const r0 = 30 + rand() * 90;
    const sweep = 1.2 + rand() * 1.8;
    const x0 = Math.cos(th) * r0;
    const y0 = Math.sin(th) * r0;
    const x1 = Math.cos(th + sweep) * (r0 * (0.6 + rand() * 0.5));
    const y1 = Math.sin(th + sweep) * (r0 * (0.6 + rand() * 0.5));
    const cx = Math.cos(th + sweep / 2) * (r0 + 40);
    const cy = Math.sin(th + sweep / 2) * (r0 + 40);
    return <path key={i} d={`M ${r2(x0)} ${r2(y0)} Q ${r2(cx)} ${r2(cy)} ${r2(x1)} ${r2(y1)}`} />;
  });
  return (
    <g>
      <circle r={186} fill={art.tertiary ?? "#ddd"} />
      <circle r={176} fill={art.primary} />
      <circle r={128} fill="#000" opacity={0.06} />
      <motion.g
        fill="none"
        strokeLinecap="round"
        animate={{ stroke: art.secondary ?? "#f0c96a" }}
        transition={{ duration: 0.4 }}
        strokeWidth={6}
      >
        {strands}
      </motion.g>
      <g fill="none" stroke="#000" strokeOpacity={0.1} strokeWidth={1}>
        {strands}
      </g>
      <AnimatePresence>
        {sauce ? (
          <motion.g key={sauce} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 0.82, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <path d="M -80 -40 Q -60 -105 10 -98 Q 92 -86 96 -10 Q 102 70 20 92 Q -70 104 -96 30 Q -112 -10 -80 -40 Z" fill={sauce} />
            <g fill="none" stroke={sauce} strokeWidth={6} strokeLinecap="round">
              {strands.slice(0, 18)}
            </g>
          </motion.g>
        ) : null}
      </AnimatePresence>
    </g>
  );
}

function BurgerStack({ index, picks, art, reduce }: { index: DishIndex; picks: string[]; art: DishBaseArt; reduce: boolean }) {
  const w = 240;
  const layers = portionsInOrder(picks)
    .map(({ id, portion }) => ({ id, portion, ing: index.ingredients.get(id) }))
    .filter((l): l is { id: string; portion: number; ing: DishIngredient } => !!l.ing);
  let y = 150 - 34;
  const placed = layers.map((l) => {
    const h = STACK_LAYER_HEIGHT[l.ing.art.shape] ?? 14;
    const node = { ...l, y, h };
    y -= h - 2;
    return node;
  });
  const topY = y;
  const totalH = 150 - topY + 80;
  const fit = Math.min(1, 330 / totalH);
  const rand = seeded("sesame");
  return (
    <g transform={`scale(${fit.toFixed(3)}) translate(0 ${((1 - fit) * 120).toFixed(1)})`}>
      <ellipse cx={0} cy={158} rx={w / 1.6} ry={14} fill="#000" opacity={0.25} />
      <motion.path
        d={`M ${-w / 2} ${150 - 34} L ${w / 2} ${150 - 34} Q ${w / 2} 150 ${w / 2 - 22} 150 L ${-w / 2 + 22} 150 Q ${-w / 2} 150 ${-w / 2} ${150 - 34} Z`}
        animate={{ fill: art.primary }}
      />
      <motion.rect x={-w / 2} y={150 - 36} width={w} height={8} rx={3} animate={{ fill: art.secondary ?? art.primary }} />
      <AnimatePresence>
        {placed.map((l) => (
          <motion.g
            key={`${l.id}:${l.portion}`}
            initial={reduce ? { opacity: 0, y: l.y } : { opacity: 0, y: l.y - 260 }}
            animate={{ opacity: 1, y: l.y }}
            exit={{ opacity: 0, y: l.y - 40 }}
            transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 380, damping: 24 }}
            filter="url(#db-piece-shadow)"
          >
            <StackLayer art={l.ing.art} w={w} h={l.h} seed={`${l.id}:${l.portion}`} />
          </motion.g>
        ))}
      </AnimatePresence>
      <motion.g animate={{ y: topY }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 22 }}>
        <motion.rect x={-w / 2 + 2} y={-8} width={w - 4} height={10} rx={4} animate={{ fill: art.secondary ?? art.primary }} />
        <motion.path
          d={`M ${-w / 2 - 6} -4 Q ${-w / 2 - 6} -96 0 -98 Q ${w / 2 + 6} -96 ${w / 2 + 6} -4 Z`}
          animate={{ fill: art.primary }}
        />
        <path d={`M ${-w / 3} -70 Q -20 -92 ${w / 6} -84`} stroke="#fff" strokeOpacity={0.18} strokeWidth={8} fill="none" strokeLinecap="round" />
        {Array.from({ length: 16 }, (_, i) => {
          const x = r2((rand() - 0.5) * w * 0.8);
          const yy = r2(-20 - rand() * 64 * (1 - Math.abs(x) / w));
          return <ellipse key={i} cx={x} cy={yy} rx={3.2} ry={1.6} fill={art.tertiary ?? "#fff6dc"} transform={`rotate(${Math.round(rand() * 60 - 30)} ${x} ${yy})`} />;
        })}
      </motion.g>
    </g>
  );
}

export function DishStage({
  layout,
  index,
  picks,
  baseArt,
  scale,
  pulseKey,
  label,
}: {
  layout: DishLayout;
  index: DishIndex;
  picks: string[];
  baseArt: DishBaseArt;
  scale: number;
  /** Cambia a ogni aggiunta: fa partire il lampo attorno al piatto. */
  pulseKey: number;
  label: string;
}) {
  const reduce = useReducedMotion() ?? false;
  const uid = useId().replace(/:/g, "");
  let body: ReactNode;
  if (layout === "stack") {
    body = <BurgerStack index={index} picks={picks} art={baseArt} reduce={reduce} />;
  } else {
    const sauce =
      layout === "nest"
        ? [...picks].reverse().map((id) => index.ingredients.get(id)).find((i) => i?.art.shape === "drizzle")?.art.color
        : undefined;
    const pieces =
      layout === "bowl" ? scatterBowl(index, picks, 62, 138) : scatterDisc(index, picks, layout === "nest" ? 108 : 140);
    body = (
      <g>
        {layout === "disc" ? <PizzaBase art={baseArt} uid={uid} /> : null}
        {layout === "bowl" ? <BowlBase art={baseArt} /> : null}
        {layout === "nest" ? <NestBase art={baseArt} sauce={sauce} /> : null}
        <AnimatePresence>
          {pieces.map((p) => (
            <FallingPiece key={p.key} p={p} reduce={reduce} />
          ))}
        </AnimatePresence>
        {layout !== "nest" ? <Drizzles index={index} picks={picks} radius={layout === "bowl" ? 140 : 150} reduce={reduce} /> : null}
      </g>
    );
  }

  return (
    <svg viewBox="-200 -200 400 400" role="img" aria-label={label} data-dish-stage>
      <defs>
        <filter id="db-piece-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="1.6" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>
      <AnimatePresence>
        {!reduce && pulseKey > 0 ? (
          <motion.circle
            key={pulseKey}
            r={170}
            fill="none"
            stroke="var(--db-glow, #ffb347)"
            strokeWidth={10}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1.22, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>
      <motion.g animate={{ scale }} transition={{ type: "spring", stiffness: 200, damping: 20 }}>
        {body}
      </motion.g>
    </svg>
  );
}
