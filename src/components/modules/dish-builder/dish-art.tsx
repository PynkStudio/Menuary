import type { ReactNode } from "react";
import type { DishArt, DishArtShape } from "@/lib/dish-builder/types";

/** Coordinate arrotondate: server e client calcolano cos/sin con ultime cifre diverse (hydration). */
export const r2 = (n: number) => Math.round(n * 100) / 100;

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** PRNG deterministico: stessa chiave, stessa posizione a ogni render (niente salti). */
export function seeded(key: string): () => number {
  let a = hashString(key);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEFAULT_PIECE_COUNT: Record<DishArtShape, number> = {
  "round-slice": 7,
  chunk: 7,
  leaf: 6,
  ring: 7,
  dot: 14,
  cube: 7,
  strip: 6,
  shred: 14,
  crumb: 36,
  drizzle: 1,
  spread: 1,
  patty: 3,
  "cheese-slice": 3,
  egg: 1,
  wedge: 6,
};

function blobPath(rand: () => number, r: number, points = 7): string {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    const rr = r * (0.7 + rand() * 0.45);
    pts.push([r2(Math.cos(a) * rr), r2(Math.sin(a) * rr)]);
  }
  let d = "";
  for (let i = 0; i < points; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % points];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    d += i === 0 ? `M ${r2((pts[points - 1][0] + x0) / 2)} ${r2((pts[points - 1][1] + y0) / 2)} ` : "";
    d += `Q ${x0} ${y0} ${r2(mx)} ${r2(my)} `;
  }
  return `${d}Z`;
}

/** Un pezzo visto dall'alto, centrato in 0,0 (unita' del viewBox 400). */
export function TopPiece({ art, seed }: { art: DishArt; seed: string }): ReactNode {
  const s = art.size ?? 1;
  const c = art.color;
  const a = art.accent ?? "rgba(255,255,255,0.35)";
  const rand = seeded(seed);
  if (art.image) {
    const w = 34 * s;
    return <image href={art.image} x={-w / 2} y={-w / 2} width={w} height={w} preserveAspectRatio="xMidYMid meet" />;
  }
  switch (art.shape) {
    case "round-slice": {
      const r = 13 * s;
      const dots = Array.from({ length: 5 }, (_, i) => {
        const an = rand() * Math.PI * 2;
        const rr = rand() * r * 0.6;
        return <circle key={i} cx={r2(Math.cos(an) * rr)} cy={r2(Math.sin(an) * rr)} r={r2(1.6 * s)} fill={a} />;
      });
      return (
        <g>
          <circle r={r} fill={c} />
          <circle r={r * 0.82} fill="none" stroke={a} strokeOpacity={0.35} strokeWidth={1} />
          {dots}
        </g>
      );
    }
    case "chunk":
      return <path d={blobPath(rand, 11 * s)} fill={c} stroke={a} strokeWidth={1.4} />;
    case "egg":
      return (
        <g>
          <path d={blobPath(rand, 16 * s, 9)} fill={c} stroke={a} strokeWidth={2} />
          <ellipse rx={7 * s} ry={5 * s} cx={-4 * s} cy={-5 * s} fill="#fff" opacity={0.7} />
        </g>
      );
    case "leaf": {
      const l = 15 * s;
      return (
        <g>
          <path d={`M ${-l} 0 Q 0 ${-l * 0.75} ${l} 0 Q 0 ${l * 0.75} ${-l} 0 Z`} fill={c} />
          <path d={`M ${-l * 0.85} 0 L ${l * 0.85} 0`} stroke={a} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      );
    }
    case "ring": {
      const r = 10 * s;
      return (
        <g>
          <circle r={r} fill="none" stroke={c} strokeWidth={4 * s} />
          {art.accent ? <circle r={r - 2 * s} fill="none" stroke={art.accent} strokeWidth={0.8} /> : null}
        </g>
      );
    }
    case "dot":
      return (
        <g>
          <circle r={4.2 * s} fill={c} />
          <circle r={1.4 * s} cx={-1.4 * s} cy={-1.4 * s} fill="#fff" opacity={0.45} />
        </g>
      );
    case "cube": {
      const w = 15 * s;
      return (
        <g>
          <rect x={-w / 2} y={-w / 2} width={w} height={w} rx={3 * s} fill={c} />
          <path
            d={`M ${-w / 2 + 2} ${-w / 6} L ${w / 2 - 2} ${-w / 4} M ${-w / 2 + 2} ${w / 5} L ${w / 2 - 2} ${w / 8}`}
            stroke={a}
            strokeWidth={1.4}
            strokeLinecap="round"
          />
        </g>
      );
    }
    case "strip": {
      const l = 15 * s;
      return (
        <g>
          <path
            d={`M ${-l} -4 Q ${-l / 2} -9 0 -4 T ${l} -4 L ${l} 4 Q ${l / 2} 9 0 4 T ${-l} 4 Z`}
            fill={c}
          />
          <path d={`M ${-l + 2} 0 Q ${-l / 2} -4 0 0 T ${l - 2} 0`} stroke={a} strokeWidth={1.5} fill="none" />
        </g>
      );
    }
    case "shred": {
      const l = 7 * s;
      return <rect x={-l} y={-1.3 * s} width={l * 2} height={2.6 * s} rx={1.3 * s} fill={c} />;
    }
    case "crumb":
      return <circle r={1.3 * s} fill={c} />;
    case "wedge": {
      const r = 12 * s;
      return (
        <g>
          <path d={`M ${-r} 0 A ${r} ${r} 0 0 0 ${r} 0 Q 0 ${r * 0.35} ${-r} 0 Z`} fill={c} />
          <path d={`M ${-r * 0.7} ${r * 0.3} A ${r * 0.75} ${r * 0.75} 0 0 0 ${r * 0.7} ${r * 0.3}`} fill="none" stroke={a} strokeWidth={1.4} />
        </g>
      );
    }
    case "patty":
      return <path d={blobPath(rand, 22 * s, 10)} fill={c} stroke={a} strokeWidth={2} />;
    case "cheese-slice": {
      const w = 34 * s;
      return <rect x={-w / 2} y={-w / 2} width={w} height={w} rx={3} fill={c} opacity={0.92} transform="rotate(12)" />;
    }
    case "spread":
    case "drizzle":
      return <circle r={6 * s} fill={c} />;
  }
}

/** Filo di salsa a zig-zag dentro un cerchio di raggio r. */
export function drizzlePath(seed: string, r: number): string {
  const rand = seeded(seed);
  const tilt = rand() * Math.PI;
  const lines = 6;
  let d = "";
  for (let i = 0; i <= lines; i++) {
    const t = -1 + (2 * i) / lines;
    const off = t * r * 0.8;
    const half = Math.sqrt(Math.max(0, r * r * 0.72 - off * off));
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * half;
    const y = off;
    const px = x * Math.cos(tilt) - y * Math.sin(tilt);
    const py = x * Math.sin(tilt) + y * Math.cos(tilt);
    d += i === 0 ? `M ${px.toFixed(1)} ${py.toFixed(1)} ` : `Q ${(px * 0.15).toFixed(1)} ${(py + (rand() - 0.5) * 30).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)} `;
  }
  return d;
}

export const STACK_LAYER_HEIGHT: Partial<Record<DishArtShape, number>> = {
  patty: 30,
  "cheese-slice": 9,
  leaf: 16,
  "round-slice": 13,
  ring: 9,
  strip: 11,
  spread: 7,
  drizzle: 7,
  egg: 22,
};

/** Strato visto di lato, largo `w`, appoggiato su y=0 e alto `h` verso l'alto (y negative). */
export function StackLayer({ art, w, h, seed }: { art: DishArt; w: number; h: number; seed: string }): ReactNode {
  const c = art.color;
  const a = art.accent ?? "rgba(0,0,0,0.2)";
  const half = w / 2;
  const rand = seeded(seed);
  if (art.image) {
    return <image href={art.image} x={-half} y={-h * 2} width={w} height={h * 3} preserveAspectRatio="xMidYMid meet" />;
  }
  switch (art.shape) {
    case "patty":
      return (
        <g>
          <rect x={-half - 4} y={-h} width={w + 8} height={h} rx={h / 2.2} fill={c} />
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx={r2(-half + 8 + rand() * (w - 16))} cy={r2(-h * (0.25 + rand() * 0.5))} r={r2(1.6 + rand() * 1.6)} fill={a} opacity={0.7} />
          ))}
          <rect x={-half + 4} y={-h + 3} width={w - 8} height={4} rx={2} fill="#fff" opacity={0.08} />
        </g>
      );
    case "cheese-slice": {
      const drips = [-0.6, -0.15, 0.35, 0.7].map((t, i) => {
        const x = t * half;
        const len = r2(8 + rand() * 10);
        return <path key={i} d={`M ${x - 6} ${-1} Q ${x} ${len + 6} ${x + 6} ${-1} Z`} fill={c} />;
      });
      return (
        <g>
          <rect x={-half - 8} y={-h} width={w + 16} height={h} rx={3} fill={c} />
          {drips}
        </g>
      );
    }
    case "leaf": {
      let d = `M ${-half - 10} ${-h / 2} `;
      const waves = 9;
      for (let i = 0; i < waves; i++) {
        const x0 = -half - 10 + ((w + 20) * (i + 0.5)) / waves;
        const x1 = -half - 10 + ((w + 20) * (i + 1)) / waves;
        d += `Q ${x0} ${i % 2 ? -h - 2 : 4} ${x1} ${-h / 2} `;
      }
      d += `L ${half + 10} 0 L ${-half - 10} 0 Z`;
      return <path d={d} fill={c} stroke={a} strokeWidth={1.5} />;
    }
    case "round-slice":
    case "ring": {
      const n = 4;
      return (
        <g>
          {Array.from({ length: n }, (_, i) => {
            const cx = -half + 4 + ((w - 8) * (i + 0.5)) / n;
            return art.shape === "ring" ? (
              <ellipse key={i} cx={cx} cy={-h / 2} rx={w / n / 1.7} ry={h / 2} fill="none" stroke={c} strokeWidth={3.5} />
            ) : (
              <g key={i}>
                <ellipse cx={cx} cy={-h / 2} rx={w / n / 1.6} ry={h / 2} fill={c} />
                <ellipse cx={cx} cy={-h / 2 - 1} rx={w / n / 2.4} ry={h / 3.4} fill={a} opacity={0.5} />
              </g>
            );
          })}
        </g>
      );
    }
    case "strip":
      return (
        <g>
          <path
            d={`M ${-half - 6} ${-h / 2} Q ${-half / 2} ${-h - 4} 0 ${-h / 2} T ${half + 6} ${-h / 2} L ${half + 6} 0 Q ${half / 2} ${4} 0 ${0} T ${-half - 6} 0 Z`}
            fill={c}
          />
          <path d={`M ${-half - 2} ${-h / 2 + 1} Q ${-half / 2} ${-h} 0 ${-h / 2 + 1} T ${half + 2} ${-h / 2 + 1}`} fill="none" stroke={a} strokeWidth={2} />
        </g>
      );
    case "spread":
    case "drizzle":
      return (
        <g>
          <rect x={-half + 2} y={-h} width={w - 4} height={h} rx={h / 2} fill={c} />
          {Array.from({ length: 3 }, (_, i) => {
            const x = r2(-half + 20 + rand() * (w - 40));
            return <path key={i} d={`M ${r2(x - 4)} -1 Q ${x} ${r2(8 + rand() * 6)} ${r2(x + 4)} -1 Z`} fill={c} />;
          })}
        </g>
      );
    default:
      return <rect x={-half} y={-h} width={w} height={h} rx={h / 2} fill={c} stroke={a} />;
  }
}

/** Icona della tessera: un mucchietto dell'ingrediente. */
export function IngredientIcon({ art, seed }: { art: DishArt; seed: string }) {
  if (art.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={art.image} alt="" draggable={false} />;
  }
  if (art.shape === "drizzle" || art.shape === "spread") {
    let d = "M 0 0 ";
    for (let i = 1; i < 40; i++) {
      const an = i * 0.55;
      const r = i * 0.62;
      d += `L ${(Math.cos(an) * r).toFixed(1)} ${(Math.sin(an) * r).toFixed(1)} `;
    }
    return (
      <svg viewBox="-30 -30 60 60" aria-hidden>
        <path d={d} fill="none" stroke={art.color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const big = ["patty", "cheese-slice", "egg"].includes(art.shape);
  const tiny = art.shape === "crumb" || art.shape === "dot" || art.shape === "shred";
  const rand = seeded(seed);
  const n = big ? 1 : tiny ? 12 : 3;
  const pieces = Array.from({ length: n }, (_, i) => {
    const an = rand() * Math.PI * 2;
    const rr = n === 1 ? 0 : rand() * (tiny ? 14 : 8);
    return (
      <g key={i} transform={`translate(${(Math.cos(an) * rr).toFixed(1)} ${(Math.sin(an) * rr).toFixed(1)}) rotate(${Math.round(rand() * 360)})`}>
        <TopPiece art={{ ...art, size: (art.size ?? 1) * (big ? 0.75 : tiny ? 1.6 : 1.15) }} seed={`${seed}-${i}`} />
      </g>
    );
  });
  return (
    <svg viewBox="-30 -30 60 60" aria-hidden>
      {pieces}
    </svg>
  );
}
