"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  Users, CreditCard, ChefHat, ShoppingBag, Copy,
  CheckCircle2, Clock, XCircle,
} from "lucide-react";
import {
  useMenuStore,
  selectActiveSession,
  selectOrdersBySession,
} from "@/store/menu-store";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useHydrated } from "@/components/core/providers";
import { formatEuro } from "@/lib/price-utils";
import { aggregateOrderLinesForSession } from "@/lib/kitchen-merge";
import {
  COPERTO_DISPLAY_NAME,
  COPERTO_ITEM_ID,
} from "@/lib/coperto";
import { LineMods } from "@/components/modules/shop/line-mods";
import { formatRemovedForLine } from "@/lib/ingredients";
import { selectItemById } from "@/store/menu-store";
import { useTenant } from "@/components/core/tenant-provider";
import { MenuaryAuthHintGate } from "@/components/modules/menu/menuary-auth-hint-gate";
import type { Order, OrderLine, TableSession, Table } from "@/lib/types";

function resolveTable(tables: Table[], param: string): Table | undefined {
  return (
    tables.find((t) => t.id === `tbl-${param}`) ??
    tables.find((t) => t.id === param)
  );
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  nuovo: <Clock size={14} className="text-pork-mustard" />,
  in_preparazione: <ChefHat size={14} className="text-pork-red" />,
  pronto: <CheckCircle2 size={14} className="text-emerald-500" />,
  consegnato: <CheckCircle2 size={14} className="text-emerald-500" />,
  annullato: <XCircle size={14} className="text-pork-ink/40" />,
};

const STATUS_LABELS: Record<string, string> = {
  pending_confirmation: "In attesa",
  nuovo: "Ricevuto",
  in_preparazione: "In preparazione",
  pronto: "Pronto",
  in_consegna: "In consegna",
  consegnato: "Servito",
  annullato: "Annullato",
};

function TavoloSummaryBody() {
  const hydrated = useHydrated();
  const pathname = usePathname();
  const params = useParams<{ number: string }>();
  const tenant = useTenant();

  const tables = useMenuStore((s) => s.tables);
  const sessions = useMenuStore((s) => s.sessions);
  const allOrders = useMenuStore((s) => s.orders);
  const items = useMenuStore((s) => s.items);

  const {
    allowTableOrders,
    dinerSeparationAtTables: dinerSeparation,
    autonomousTableCheckout,
  } = useEffectiveFeatures();

  const previewPrefix =
    tenant.previewSlug && pathname?.startsWith(`/${tenant.previewSlug}`)
      ? `/${tenant.previewSlug}`
      : "";

  const table = useMemo(
    () => (params?.number ? resolveTable(tables, params.number) : undefined),
    [tables, params?.number],
  );

  const session = useMemo(
    () => (table ? selectActiveSession(sessions, table.id) : undefined),
    [sessions, table],
  );

  const sessionOrders = useMemo(
    () =>
      session
        ? selectOrdersBySession(allOrders, session.id).filter(
            (o) => o.status !== "annullato",
          )
        : [],
    [allOrders, session],
  );

  const aggregated = useMemo(
    () =>
      !dinerSeparation && sessionOrders.length > 0
        ? aggregateOrderLinesForSession(sessionOrders)
        : null,
    [dinerSeparation, sessionOrders],
  );

  const ordersByDiner = useMemo(() => {
    if (!dinerSeparation) return null;
    const map = new Map<string, { nickname: string; orders: Order[]; total: number }>();
    for (const order of sessionOrders) {
      const key = order.dinerNickname ?? order.dinerClientId ?? "__unknown__";
      const entry = map.get(key) ?? {
        nickname: order.dinerNickname ?? "Ospite",
        orders: [],
        total: 0,
      };
      entry.orders.push(order);
      entry.total += order.total;
      map.set(key, entry);
    }
    return [...map.values()];
  }, [dinerSeparation, sessionOrders]);

  const grandTotal = sessionOrders.reduce((a, o) => a + o.total, 0);

  const [copied, setCopied] = useState(false);

  if (!hydrated) return null;

  if (!allowTableOrders) {
    return (
      <EmptyCentered>
        <p className="impact-title text-pork-red">Percorso non attivo</p>
        <Link href={`${previewPrefix}/menu`} className="btn-primary mt-6 inline-flex">
          Vai al menu
        </Link>
      </EmptyCentered>
    );
  }

  if (!table) {
    return (
      <EmptyCentered>
        <p className="impact-title text-pork-red">Tavolo non trovato.</p>
        <p className="mt-2 text-pork-ink/60">
          Il tavolo richiesto non esiste. Scansiona il QR code o inserisci il numero corretto.
        </p>
        <Link href={`${previewPrefix}/tavolo`} className="btn-primary mt-6 inline-flex">
          Cerca il tuo tavolo
        </Link>
      </EmptyCentered>
    );
  }

  if (!session) {
    return (
      <EmptyCentered>
        <p className="impact-title text-pork-red">Nessuna sessione attiva.</p>
        <p className="mt-2 text-pork-ink/60">
          Il {table.label.toLowerCase()} non ha ordini aperti. Scansiona il QR code per iniziare.
        </p>
        <Link
          href={`${previewPrefix}/tavolo?t=${table.id}`}
          className="btn-primary mt-6 inline-flex"
        >
          Apri il {table.label.toLowerCase()}
        </Link>
      </EmptyCentered>
    );
  }

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${previewPrefix}/tavolo?code=${session.code}`
      : `${previewPrefix}/tavolo?code=${session.code}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-pork-ink pt-28 pb-10 text-pork-cream md:pt-36">
        <div className="container-wide">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip-mustard">{table.label}</span>
            <span className="chip bg-pork-cream/10 text-pork-cream/70">
              Codice {session.code}
            </span>
            {dinerSeparation && session.diners.length > 0 && (
              <span className="chip bg-pork-red text-white">
                <Users size={12} className="mr-1 inline" />
                {session.diners.length} {session.diners.length === 1 ? "commensale" : "commensali"}
              </span>
            )}
          </div>
          <h1 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
            Riepilogo{" "}
            <span className="text-pork-mustard">{table.label.toLowerCase()}.</span>
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-full bg-pork-mustard px-4 py-2 text-sm font-bold text-pork-ink hover:bg-pork-mustard-soft"
            >
              <Copy size={14} />
              {copied ? "Copiato!" : "Condividi codice"}
            </button>
            <Link
              href={`${previewPrefix}/tavolo?t=${table.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-pork-cream/10 px-4 py-2 text-sm font-bold text-pork-cream hover:bg-pork-cream/20"
            >
              <ShoppingBag size={14} />
              Ordina ancora
            </Link>
          </div>

          {dinerSeparation && session.diners.length > 1 && (
            <p className="mt-4 text-xs text-pork-cream/60">
              Al tavolo:{" "}
              {session.diners.map((d, i) => (
                <span key={d.clientId}>
                  {i > 0 && " · "}
                  {d.nickname}
                </span>
              ))}
            </p>
          )}
        </div>
      </section>

      {/* ── Contenuto ─────────────────────────────────────────────────── */}
      <div className="bg-pork-cream pb-32 pt-10">
        <div className="container-wide">
          {sessionOrders.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-pork-ink/5">
              <p className="impact-title text-2xl">Nessun ordine ancora.</p>
              <p className="mt-2 text-sm text-pork-ink/60">
                Ordina qualcosa dal menu, apparirà qui.
              </p>
              <Link
                href={`${previewPrefix}/tavolo?t=${table.id}`}
                className="btn-primary mt-6 inline-flex"
              >
                Vai al menu
              </Link>
            </div>
          ) : dinerSeparation && ordersByDiner ? (
            /* ── Vista per commensale ──────────────────────────────── */
            <div className="space-y-6">
              {ordersByDiner.map((diner) => (
                <DinerCard
                  key={diner.nickname}
                  nickname={diner.nickname}
                  orders={diner.orders}
                  total={diner.total}
                  items={items}
                />
              ))}

              <TotalBar
                total={grandTotal}
                orderCount={sessionOrders.length}
                autonomousCheckout={autonomousTableCheckout}
                previewPrefix={previewPrefix}
                session={session}
                table={table}
              />
            </div>
          ) : (
            /* ── Vista aggregata (conto unico) ────────────────────── */
            <div className="space-y-6">
              {aggregated && (
                <div className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/5 sm:p-8">
                  <h2 className="headline text-2xl">
                    Tutti gli ordini · {sessionOrders.length}{" "}
                    {sessionOrders.length === 1 ? "invio" : "invii"}
                  </h2>
                  <OrderLinesList lines={aggregated.lines} items={items} />
                </div>
              )}

              <OrderTimeline orders={sessionOrders} />

              <TotalBar
                total={grandTotal}
                orderCount={sessionOrders.length}
                autonomousCheckout={autonomousTableCheckout}
                previewPrefix={previewPrefix}
                session={session}
                table={table}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Componenti interni ───────────────────────────────────────────────────────

function DinerCard({
  nickname,
  orders,
  total,
  items,
}: {
  nickname: string;
  orders: Order[];
  total: number;
  items: ReturnType<typeof useMenuStore.getState>["items"];
}) {
  const allLines = orders.flatMap((o) => o.lines);

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/5 sm:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="headline text-2xl">
          <Users size={18} className="mr-2 inline text-pork-red" />
          {nickname}
        </h2>
        <span className="font-impact text-2xl text-pork-red">
          {formatEuro(total)}
        </span>
      </div>
      <p className="mt-1 text-xs text-pork-ink/50">
        {orders.length} {orders.length === 1 ? "ordine" : "ordini"}
      </p>
      <OrderLinesList lines={allLines} items={items} />
    </div>
  );
}

function OrderLinesList({
  lines,
  items,
}: {
  lines: OrderLine[];
  items: ReturnType<typeof useMenuStore.getState>["items"];
}) {
  return (
    <ul className="mt-4 divide-y divide-pork-ink/8">
      {lines.map((l, i) => {
        const isCoperto = l.itemId === COPERTO_ITEM_ID;
        return (
          <li key={`${l.itemId}-${i}`} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-semibold leading-tight">
                {l.qty} × {isCoperto ? COPERTO_DISPLAY_NAME : l.name}
              </p>
              {l.variantLabel && (
                <p className="text-xs font-semibold text-pork-red">{l.variantLabel}</p>
              )}
              {!isCoperto && (
                <LineMods
                  removed={l.removedIngredients}
                  removedDisplay={formatRemovedForLine(
                    l.itemId,
                    selectItemById(items, l.itemId)?.ingredients,
                    l.removedIngredients,
                  )}
                  extras={l.addedExtras}
                  note={l.note}
                  bundlePicks={l.bundlePicks}
                />
              )}
            </div>
            <span className="shrink-0 font-impact text-lg text-pork-red">
              {formatEuro(l.lineTotal)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function OrderTimeline({ orders }: { orders: Order[] }) {
  if (orders.length <= 1) return null;

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-pork-ink/5 sm:p-8">
      <h3 className="headline text-lg text-pork-ink/80">Ordini inviati</h3>
      <ul className="mt-3 space-y-2">
        {orders.map((o) => (
          <li
            key={o.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-pork-cream/60 px-4 py-3"
          >
            <div className="flex items-center gap-2 text-sm">
              {STATUS_ICONS[o.status] ?? <Clock size={14} className="text-pork-ink/40" />}
              <span className="font-semibold">{o.code}</span>
              <span className="text-pork-ink/50">
                {STATUS_LABELS[o.status] ?? o.status}
              </span>
              {o.dinerNickname && (
                <span className="text-pork-ink/40">· {o.dinerNickname}</span>
              )}
            </div>
            <span className="font-impact text-sm text-pork-red">
              {formatEuro(o.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TotalBar({
  total,
  orderCount,
  autonomousCheckout,
  previewPrefix,
  session,
  table,
}: {
  total: number;
  orderCount: number;
  autonomousCheckout: boolean;
  previewPrefix: string;
  session: TableSession;
  table: Table;
}) {
  const [requesting, setRequesting] = useState(false);
  const router = useRouter();
  const tenant = useTenant();

  async function handleCheckout() {
    setRequesting(true);
    try {
      const res = await fetch("/api/orders/table-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          sessionId: session.id,
          tableId: table.id,
        }),
      });
      if (!res.ok) {
        setRequesting(false);
        return;
      }
      const data = await res.json();
      if (data.code && data.publicToken) {
        router.push(
          `${previewPrefix}/checkout/${encodeURIComponent(data.code)}?t=${encodeURIComponent(data.publicToken)}`,
        );
      }
    } catch {
      setRequesting(false);
    }
  }

  return (
    <div className="rounded-3xl bg-pork-ink p-6 text-pork-cream ring-1 ring-pork-ink sm:p-8">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="impact-title text-sm text-pork-cream/60">
            Conto del tavolo · {orderCount}{" "}
            {orderCount === 1 ? "ordine" : "ordini"}
          </p>
        </div>
        <span className="headline text-4xl text-pork-mustard">
          {formatEuro(total)}
        </span>
      </div>

      {autonomousCheckout && total > 0 && (
        <button
          type="button"
          onClick={handleCheckout}
          disabled={requesting}
          className="btn-primary mt-6 w-full text-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CreditCard size={20} />
          {requesting ? "Preparazione conto…" : "Paga il conto"}
        </button>
      )}

      {!autonomousCheckout && (
        <p className="mt-4 text-center text-sm text-pork-cream/50">
          Per pagare il conto chiedi al personale in sala.
        </p>
      )}
    </div>
  );
}

function EmptyCentered({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-wide py-32 text-center">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}

export default function TavoloSummaryPage() {
  return (
    <>
      <MenuaryAuthHintGate />
      <Suspense fallback={null}>
        <TavoloSummaryBody />
      </Suspense>
    </>
  );
}
