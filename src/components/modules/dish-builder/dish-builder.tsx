"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Info, Minus, Plus, Trash2, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  addBlockReason,
  addPick,
  countPicks,
  dishToCartLine,
  indexRecipe,
  ingredientPriceFactor,
  initialDishState,
  priceDish,
  removePick,
  selectedOptions,
  setChoice,
  validateDish,
} from "@/lib/dish-builder/engine";
import {
  blockMessage,
  dishText,
  fill,
  formatDishPrice,
  issueMessage,
  resolveDishCopy,
  type DishBuilderCopy,
} from "@/lib/dish-builder/i18n";
import type { DishIngredient, DishRecipe, DishState, DishText, DishTheme } from "@/lib/dish-builder/types";
import type { CartLine } from "@/lib/types";
import { useCartStore } from "@/store/cart-store";
import { spawnCartFly } from "@/lib/cart-fly";
import { DishStage } from "./dish-stage";
import { IngredientIcon } from "./dish-art";
import styles from "./dish-builder.module.css";

export type DishBuilderSubmit = {
  line: Omit<CartLine, "lineId">;
  state: DishState;
  /** Rettangolo del bottone, per l'animazione verso il carrello. */
  from: DOMRect | null;
};

export type DishBuilderProps = {
  recipe: DishRecipe;
  /** Lingua del cliente (es. "it", "en"). I testi della cucina restano in `recipe.kitchenLocale`. */
  locale?: string;
  /** Sovrascrive i testi della UI, anche tradotti: `{ submit: { it: "Inforna", en: "Bake it" } }`. */
  copy?: Partial<Record<keyof DishBuilderCopy, DishText>>;
  /** Tema del tenant; quello della ricetta (`recipe.theme`) vince sopra questo. */
  theme?: DishTheme;
  currency?: string;
  /**
   * Se assente la riga va nel carrello globale (`useCartStore`). Passarla per gestire
   * ordini al tavolo, modifica di una riga esistente o anteprime.
   */
  onSubmit?: (payload: DishBuilderSubmit) => void;
  onBack?: () => void;
  /** Stato iniziale (es. modifica di una riga gia' in carrello). */
  initialState?: DishState;
  /** Slot in alto a destra (carrello, audio, lingua). */
  headerActions?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

const PORTAL_VARS = [
  "--db-bg",
  "--db-surface",
  "--db-surface-2",
  "--db-ink",
  "--db-muted",
  "--db-line",
  "--db-accent",
  "--db-accent-ink",
  "--db-selected",
  "--db-price",
  "--db-glow",
  "--db-danger",
  "--db-radius",
  "--db-font-display",
  "--db-font-body",
  "--db-tile-bg",
];

function themeVars(theme: DishTheme | undefined): Record<string, string> {
  if (!theme) return {};
  const out: Record<string, string> = {};
  const c = theme.colors ?? {};
  const map: Record<string, string | undefined> = {
    "--db-bg": c.bg,
    "--db-surface": c.surface,
    "--db-surface-2": c.surface2,
    "--db-ink": c.ink,
    "--db-muted": c.muted,
    "--db-line": c.line,
    "--db-accent": c.accent,
    "--db-accent-ink": c.accentInk,
    "--db-selected": c.selected,
    "--db-price": c.price,
    "--db-glow": c.glow,
    "--db-danger": c.danger,
    "--db-font-display": theme.fonts?.display,
    "--db-font-body": theme.fonts?.body,
    "--db-radius": theme.radius,
    "--db-background": theme.background,
    "--db-stage-bg": theme.stageBackground,
    "--db-tile-bg": theme.tileBackground,
    "--db-stage-max": theme.stageMaxWidth ? `${theme.stageMaxWidth}px` : undefined,
    "--db-glow-opacity": theme.glow === false ? "0" : undefined,
  };
  for (const [k, v] of Object.entries(map)) if (v) out[k] = v;
  return out;
}

export function DishBuilder({
  recipe,
  locale = "it",
  copy: copyOverrides,
  theme,
  currency = "EUR",
  onSubmit,
  onBack,
  initialState,
  headerActions,
  className,
  style,
}: DishBuilderProps) {
  const index = useMemo(() => indexRecipe(recipe), [recipe]);
  const copy = useMemo(() => resolveDishCopy(locale, copyOverrides), [locale, copyOverrides]);
  const tx = useCallback((text: DishText | undefined) => dishText(text, locale), [locale]);
  const money = useCallback((n: number) => formatDishPrice(n, locale, currency), [locale, currency]);
  const ingName = useCallback((id: string) => tx(index.ingredients.get(id)?.name) || id, [index, tx]);
  const groupName = useCallback(
    (id: string) => tx(recipe.groups.find((g) => g.id === id)?.label) || id,
    [recipe.groups, tx],
  );

  const [state, setState] = useState<DishState>(() => initialState ?? initialDishState(recipe));
  const [history, setHistory] = useState<DishState[]>([]);
  const [pulse, setPulse] = useState(0);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [showIssues, setShowIssues] = useState(false);
  const [detail, setDetail] = useState<DishIngredient | null>(null);
  const addLine = useCartStore((s) => s.addLine);
  const submitRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const [portalVars, setPortalVars] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const counts = useMemo(() => countPicks(state.picks), [state.picks]);
  const price = useMemo(() => priceDish(recipe, index, state), [recipe, index, state]);
  const issues = useMemo(() => validateDish(recipe, index, state), [recipe, index, state]);
  const options = selectedOptions(recipe, state);
  const baseArt = options.reduce((art, o) => ({ ...art, ...o.baseArt }), recipe.baseArt);
  const scale = options.reduce((s, o) => s * (o.scale ?? 1), 1);
  const factor = ingredientPriceFactor(recipe, state);
  const included = useMemo(() => countPicks(recipe.includedPicks ?? []), [recipe.includedPicks]);

  const openDetail = (ing: DishIngredient) => {
    // La scheda vive in un portale sul body (i tenant hanno contenitori con transform che
    // rompono position:fixed): le copia le variabili --db-* calcolate, CSS del tenant compreso.
    const root = rootRef.current;
    if (root) {
      const cs = getComputedStyle(root);
      const vars: Record<string, string> = {};
      for (const name of PORTAL_VARS) {
        const v = cs.getPropertyValue(name).trim();
        if (v) vars[name] = v;
      }
      setPortalVars(vars);
    }
    setDetail(ing);
  };

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDetail(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail]);

  const say = useCallback((text: string) => {
    if (!text) return;
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text });
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  const commit = (next: DishState) => {
    setHistory((h) => [...h.slice(-40), state]);
    setState(next);
  };

  const add = (id: string) => {
    const blocked = addBlockReason(recipe, index, state, id);
    if (blocked) {
      say(blockMessage(blocked, copy, { ingredient: ingName, group: groupName }));
      return;
    }
    commit(addPick(state, id));
    setPulse((p) => p + 1);
    const n = (counts.get(id) ?? 0) + 1;
    say(fill(n > 1 ? copy.addedAgain : copy.added, { name: ingName(id), n }));
  };

  const remove = (id: string) => {
    commit(removePick(state, id));
    say(fill(copy.removed, { name: ingName(id) }));
  };

  const undo = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setState(prev);
  };

  const clear = () => {
    if (state.picks.length === 0) return;
    commit({ ...state, picks: [] });
  };

  const submit = () => {
    if (issues.length > 0) {
      setShowIssues(true);
      say(issueMessage(issues[0], copy, groupName(issues[0].groupId)));
      document.getElementById(`db-group-${recipe.id}-${issues[0].groupId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const line = dishToCartLine(recipe, index, state);
    const from = submitRef.current?.getBoundingClientRect() ?? null;
    if (onSubmit) {
      onSubmit({ line, state, from });
      return;
    }
    addLine(line);
    spawnCartFly(from, recipe.coverImage ?? null);
    say(copy.addedToOrder);
  };

  /** Prezzo mostrato sulla tessera: la porzione inclusa nel prezzo base appare gratuita. */
  const tilePrice = (ing: DishIngredient) => {
    if (ing.available === false) return copy.soldOut;
    const n = counts.get(ing.id) ?? 0;
    const freeLeft = (included.get(ing.id) ?? 0) - n;
    if (ing.price <= 0 || freeLeft > 0) return copy.free;
    return `+ ${money(ing.price * factor)}`;
  };

  const issueGroups = new Set(showIssues ? issues.map((i) => i.groupId) : []);
  const mergedTheme: DishTheme | undefined =
    theme || recipe.theme
      ? {
          ...theme,
          ...recipe.theme,
          colors: { ...theme?.colors, ...recipe.theme?.colors },
          fonts: { ...theme?.fonts, ...recipe.theme?.fonts },
        }
      : undefined;
  const title = tx(recipe.title);
  const pickedNames = state.picks.map(ingName);

  return (
    <section
      ref={rootRef}
      className={[styles.root, className].filter(Boolean).join(" ")}
      style={{ ...themeVars(mergedTheme), ...style } as CSSProperties}
      data-dish-builder={recipe.id}
      data-layout={recipe.layout}
      data-part="root"
      lang={locale}
      aria-label={title}
    >
      <header className={styles.header} data-part="header">
        {onBack ? (
          <button type="button" className={styles.iconBtn} onClick={onBack} aria-label={copy.back} data-part="back">
            <ChevronLeft size={22} />
          </button>
        ) : null}
        <div className={styles.titles}>
          <h2 className={styles.title} data-part="title">
            {title}
          </h2>
          {recipe.subtitle ? (
            <p className={styles.subtitle} data-part="subtitle">
              {tx(recipe.subtitle)}
            </p>
          ) : null}
        </div>
        {headerActions ? (
          <div className={styles.headerActions} data-part="header-actions">
            {headerActions}
          </div>
        ) : null}
      </header>

      {recipe.choices?.length ? (
        <div className={styles.choices} data-part="choices">
          {recipe.choices.map((choice) => (
            <div key={choice.id} className={styles.segmented} role="radiogroup" aria-label={tx(choice.label)} data-part="choice" data-choice={choice.id}>
              {choice.options.map((o) => {
                const active = (state.choices[choice.id] ?? choice.defaultOptionId) === o.id;
                const short = tx(o.shortLabel);
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={tx(o.label)}
                    className={styles.segment}
                    data-part="choice-option"
                    data-active={active || undefined}
                    onClick={() => !active && commit(setChoice(state, choice.id, o.id))}
                  >
                    {active && short ? <span className={styles.segmentShort}>{short}</span> : null}
                    {active || !short ? tx(o.label) : short}
                    {active && o.priceDelta ? (
                      <span className={styles.segmentDelta}>
                        {o.priceDelta > 0 ? "+" : "−"}
                        {money(Math.abs(o.priceDelta))}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.body} data-part="body">
        <div className={styles.stageWrap} data-part="stage-wrap">
          <div className={styles.stage} data-part="stage">
            <DishStage
              layout={recipe.layout}
              index={index}
              picks={state.picks}
              baseArt={baseArt}
              scale={scale}
              pulseKey={pulse}
              label={`${title}: ${pickedNames.length === 0 ? copy.emptyDish : pickedNames.join(", ")}`}
            />
          </div>
          <div className={styles.toastSlot} aria-live="polite" data-part="toast-slot">
            <AnimatePresence>
              {toast ? (
                <motion.div
                  key={toast.id}
                  className={styles.toast}
                  data-part="toast"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  {toast.text}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <div className={styles.groups} data-part="groups">
          {recipe.groups.map((group) => {
            const inGroup = state.picks.filter((p) => index.groupOf.get(p)?.id === group.id).length;
            return (
              <div
                key={group.id}
                id={`db-group-${recipe.id}-${group.id}`}
                className={styles.group}
                data-part="group"
                data-group={group.id}
                data-invalid={issueGroups.has(group.id) || undefined}
              >
                <div className={styles.groupHead}>
                  <h3 className={styles.groupTitle} data-part="group-title">
                    {tx(group.label)}
                  </h3>
                  <span className={styles.groupRule} data-part="group-rule" />
                  {group.max != null ? (
                    <span className={styles.groupMeta} data-part="group-meta">
                      {inGroup}/{group.max}
                    </span>
                  ) : null}
                </div>
                {group.hint ? (
                  <p className={styles.groupHint} data-part="group-hint">
                    {tx(group.hint)}
                  </p>
                ) : null}
                <ul className={styles.tiles} data-part="tiles">
                  {group.ingredients.map((ing) => {
                    const n = counts.get(ing.id) ?? 0;
                    const unavailable = ing.available === false;
                    const name = tx(ing.name);
                    return (
                      <li key={ing.id} className={styles.tileItem} data-ingredient={ing.id}>
                        <motion.button
                          type="button"
                          className={styles.tile}
                          data-part="tile"
                          data-selected={n > 0 || undefined}
                          disabled={unavailable}
                          onClick={() => add(ing.id)}
                          whileTap={{ scale: 0.94 }}
                          aria-label={`${name}, ${tilePrice(ing)}${n ? `, ${n} ${n === 1 ? copy.portion : copy.portions}` : ""}`}
                        >
                          <span className={styles.tileArt} data-part="tile-art">
                            <IngredientIcon art={ing.art} seed={ing.id} />
                          </span>
                          <span className={styles.tileName} data-part="tile-name">
                            {name}
                          </span>
                          <span className={styles.tilePrice} data-part="tile-price">
                            {tilePrice(ing)}
                          </span>
                          {n > 0 ? (
                            <span className={styles.tileBadge} data-part="tile-badge">
                              {n > 1 ? `x${n}` : "✓"}
                            </span>
                          ) : null}
                        </motion.button>
                        {n > 0 ? (
                          <button
                            type="button"
                            className={styles.tileMinus}
                            data-part="tile-minus"
                            onClick={() => remove(ing.id)}
                            aria-label={fill(copy.removeOne, { name })}
                          >
                            <Minus size={16} strokeWidth={3} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={styles.tileInfo}
                          data-part="tile-info"
                          onClick={() => openDetail(ing)}
                          aria-label={fill(copy.details, { name })}
                        >
                          <Info size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <footer className={styles.bar} data-part="bar">
        <div className={styles.total} data-part="total">
          <span className={styles.totalLabel}>{tx(recipe.totalLabel ?? recipe.name)}</span>
          <motion.span key={price.total} className={styles.totalValue} data-part="total-value" initial={{ y: -6, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }}>
            {money(price.total)}
          </motion.span>
        </div>
        <button type="button" className={styles.barBtn} data-part="undo" onClick={undo} disabled={history.length === 0} aria-label={copy.undo}>
          <Undo2 size={20} />
          <span>{copy.undo}</span>
        </button>
        <button type="button" className={styles.barBtn} data-part="clear" onClick={clear} disabled={state.picks.length === 0} aria-label={copy.clear}>
          <Trash2 size={20} />
          <span>{copy.clear}</span>
        </button>
        <button
          ref={submitRef}
          type="button"
          className={styles.cta}
          data-part="submit"
          data-ready={issues.length === 0 || undefined}
          onClick={submit}
        >
          {copy.submit}
        </button>
      </footer>

      {mounted
        ? createPortal(
      <AnimatePresence>
        {detail ? (
          <motion.div
            className={styles.sheetBackdrop}
            style={portalVars as CSSProperties}
            data-dish-builder-portal={recipe.id}
            lang={locale}
            data-part="detail-backdrop"
            onClick={() => setDetail(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={tx(detail.name)}
              className={styles.sheet}
              data-part="detail"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <button type="button" className={styles.sheetClose} onClick={() => setDetail(null)} aria-label={copy.close} data-part="detail-close">
                <X size={18} />
              </button>
              <div className={styles.sheetArt} data-part="detail-art">
                {detail.detailImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={detail.detailImage} alt="" />
                ) : (
                  <IngredientIcon art={detail.art} seed={detail.id} />
                )}
              </div>
              <h3 className={styles.sheetTitle} data-part="detail-title">
                {tx(detail.name)}
              </h3>
              <p className={styles.tilePrice}>{tilePrice(detail)}</p>
              {detail.badges?.length ? (
                <ul className={styles.badges} data-part="detail-badges">
                  {detail.badges.map((b, i) => (
                    <li key={i}>{tx(b)}</li>
                  ))}
                </ul>
              ) : null}
              {detail.description ? (
                <p className={styles.sheetText} data-part="detail-description">
                  {tx(detail.description)}
                </p>
              ) : null}
              {detail.allergens?.length ? (
                <p className={styles.sheetText} data-part="detail-allergens">
                  <strong>{copy.allergens}:</strong> {detail.allergens.map(tx).join(", ")}
                </p>
              ) : null}
              <div className={styles.sheetActions}>
                {(counts.get(detail.id) ?? 0) > 0 ? (
                  <button type="button" className={styles.sheetBtn} onClick={() => remove(detail.id)} aria-label={fill(copy.removeOne, { name: tx(detail.name) })}>
                    <Minus size={18} />
                  </button>
                ) : null}
                <span className={styles.sheetCount}>{counts.get(detail.id) ?? 0}</span>
                <button
                  type="button"
                  className={styles.cta}
                  data-ready
                  disabled={detail.available === false}
                  onClick={() => add(detail.id)}
                >
                  <Plus size={18} style={{ display: "inline", verticalAlign: "-3px", marginRight: 6 }} />
                  {copy.addToDish}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
            document.body,
          )
        : null}
    </section>
  );
}
