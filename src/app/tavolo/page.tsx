"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, Users, KeyRound } from "lucide-react";
import { InteractiveMenu } from "@/components/modules/menu/interactive-menu";
import { useCartStore, type CartContext } from "@/store/cart-store";
import {
  useMenuStore,
  selectActiveSession,
  selectSessionByCode,
} from "@/store/menu-store";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useHydrated } from "@/components/core/providers";
import { formatEuro } from "@/lib/price-utils";
import { getClientId } from "@/lib/client-id";
import type { TableSession, Table } from "@/lib/types";
import { TableOrderJoinFlow } from "@/components/modules/table-orders/table-order-join-flow";
import { NicknameGate } from "@/components/modules/table-orders/nickname-gate";
import { MenuaryAuthHintGate } from "@/components/modules/menu/menuary-auth-hint-gate";

function sameTavoloSessionBinding(
  a: CartContext,
  b: {
    type: "tavolo";
    tableId: string;
    tableLabel: string;
    sessionId: string;
    sessionCode: string;
    clientId: string;
    nickname?: string;
  },
): boolean {
  return (
    a.type === "tavolo" &&
    a.tableId === b.tableId &&
    (a.tableLabel ?? "") === (b.tableLabel ?? "") &&
    a.sessionId === b.sessionId &&
    (a.sessionCode ?? "") === (b.sessionCode ?? "") &&
    a.clientId === b.clientId &&
    (a.nickname ?? "") === (b.nickname ?? "")
  );
}

function SessionRunningTotal({ sessionId, summaryHref }: { sessionId: string; summaryHref: string }) {
  const orders = useMenuStore((s) => s.orders);
  const list = useMemo(
    () =>
      orders.filter((o) => o.sessionId === sessionId && o.status !== "annullato"),
    [orders, sessionId],
  );
  const total = list.reduce((a, o) => a + o.total, 0);
  if (list.length === 0) return null;
  return (
    <Link
      href={summaryHref}
      className="block border-b border-pork-ink/10 bg-pork-mustard/15 py-3 text-pork-ink transition-colors hover:bg-pork-mustard/25"
    >
      <div className="container-wide flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">
          Totale al tavolo · {list.length}{" "}
          {list.length === 1 ? "ordine inviato" : "ordini inviati"}
          <span className="ml-2 text-xs font-normal text-pork-ink/50">Vedi riepilogo →</span>
        </p>
        <p className="font-impact text-2xl text-pork-red">{formatEuro(total)}</p>
      </div>
    </Link>
  );
}

function TavoloBody() {
  const hydrated = useHydrated();
  const params = useSearchParams();
  const router = useRouter();
  const tParam = params.get("t");
  const codeParam = params.get("code");

  const tables = useMenuStore((s) => s.tables);
  const sessions = useMenuStore((s) => s.sessions);
  const openSession = useMenuStore((s) => s.openSession);
  const addDiner = useMenuStore((s) => s.addDiner);
  const updateDinerNickname = useMenuStore((s) => s.updateDinerNickname);
  const clearCart = useCartStore((s) => s.clear);
  const cartContext = useCartStore((s) => s.context);
  const setContext = useCartStore((s) => s.setContext);

  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");

  const {
    allowTableOrders,
    dinerSeparationAtTables: dinerSeparation,
  } = useEffectiveFeatures();

  const resolvedTable: Table | undefined = useMemo(() => {
    if (!tParam) return undefined;
    return tables.find((t) => t.id === tParam);
  }, [tables, tParam]);

  const activeSession: TableSession | undefined = useMemo(() => {
    if (codeParam) {
      return selectSessionByCode(sessions, codeParam);
    }
    if (resolvedTable) {
      return selectActiveSession(sessions, resolvedTable.id);
    }
    return undefined;
  }, [codeParam, resolvedTable, sessions]);

  const sessionTable: Table | undefined = useMemo(() => {
    if (resolvedTable) return resolvedTable;
    if (activeSession) return tables.find((t) => t.id === activeSession.tableId);
    return undefined;
  }, [activeSession, resolvedTable, tables]);

  useEffect(() => {
    if (!hydrated) return;
    if (!resolvedTable && !activeSession) return;
    if (resolvedTable && !activeSession) {
      openSession(resolvedTable.id, resolvedTable.seats ?? 4);
    }
  }, [hydrated, resolvedTable, activeSession, openSession]);

  useEffect(() => {
    if (!hydrated || !activeSession || !sessionTable) return;

    const clientId = getClientId();
    const ctx = useCartStore.getState().context;
    const existing = activeSession.diners.find((d) => d.clientId === clientId);
    const currentNick = existing?.nickname ?? "";

    if (
      ctx.sessionId !== activeSession.id ||
      ctx.clientId !== clientId
    ) {
      if (ctx.sessionId && ctx.sessionId !== activeSession.id) {
        clearCart();
      }
      const nextBinding = {
        type: "tavolo" as const,
        tableId: sessionTable.id,
        tableLabel: sessionTable.label,
        sessionId: activeSession.id,
        sessionCode: activeSession.code,
        clientId,
        nickname:
          dinerSeparation && currentNick ? currentNick : undefined,
      };
      if (sameTavoloSessionBinding(ctx, nextBinding)) return;
      setContext(nextBinding);
    } else if (
      dinerSeparation &&
      (ctx.nickname ?? "") !== currentNick
    ) {
      const nextNick = currentNick || undefined;
      if ((ctx.nickname ?? "") === (nextNick ?? "")) return;
      setContext({
        ...ctx,
        nickname: nextNick,
      });
    }
  }, [
    hydrated,
    activeSession,
    sessionTable,
    setContext,
    clearCart,
    dinerSeparation,
  ]);

  if (!hydrated) return null;

  if (!allowTableOrders) {
    return (
      <EmptyCentered>
        <p className="impact-title text-pork-red">Percorso non attivo</p>
        <p className="mt-2 text-pork-ink/60">
          Il menu digitale resta disponibile dalla home.
        </p>
        <Link href="/menu" className="btn-primary mt-6 inline-flex">
          Vai al menu
        </Link>
      </EmptyCentered>
    );
  }

  if (codeParam && !activeSession) {
    return (
      <EmptyCentered>
        <p className="impact-title text-pork-red">Codice non valido.</p>
        <p className="mt-2 text-pork-ink/60">
          Il codice <strong>{codeParam}</strong> non &egrave; pi&ugrave; valido.
        </p>
        <Link href="/tavolo" className="btn-primary mt-6 inline-flex">
          Inserisci un altro codice
        </Link>
      </EmptyCentered>
    );
  }

  if (!resolvedTable && !activeSession) {
    return (
      <EmptyCentered>
        <p className="impact-title text-pork-red">Benvenuto.</p>
        <h1 className="headline mt-2 text-4xl">Unisciti al tuo tavolo.</h1>
        <p className="mt-2 text-pork-ink/60">
          QR sul tavolo oppure <strong>numero tavolo</strong> qui sotto. Se il tavolo
          &egrave; gi&agrave; attivo, servir&agrave; il <strong>codice a 4 cifre</strong>{" "}
          che vedi in sala. Oppure entra solo con il codice.
        </p>

        <div className="mx-auto mt-8 max-w-sm rounded-2xl bg-white p-5 text-left ring-1 ring-pork-ink/10">
          <p className="impact-title text-xs text-pork-red">Numero tavolo</p>
          <TableOrderJoinFlow />
        </div>

        <p className="mt-8 text-sm font-semibold text-pork-ink/50">
          Hai solo il codice?
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const c = joinCode.replace(/\D/g, "");
            if (c.length < 3) return;
            router.replace(`/tavolo?code=${c}`);
          }}
          className="mx-auto mt-3 flex max-w-xs gap-2"
        >
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="1234"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ""))}
            className="flex-1 rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-3 text-center font-impact text-2xl tracking-[0.3em] outline-none focus:border-pork-red"
          />
          <button type="submit" className="btn-primary text-sm">
            <KeyRound size={16} /> Entra
          </button>
        </form>
        <Link
          href="/menu"
          className="mt-6 inline-block text-sm text-pork-ink/60 underline"
        >
          Oppure sfoglia solo il menu →
        </Link>
      </EmptyCentered>
    );
  }

  if (!activeSession || !sessionTable) return null;

  const needsNickname =
    dinerSeparation &&
    !cartContext.nickname &&
    cartContext.sessionId === activeSession.id;

  const tableParam = sessionTable.id.replace(/^tbl-/, "") || sessionTable.id;
  const summaryHref = `/tavolo/${tableParam}`;

  return (
    <>
      {needsNickname && (
        <NicknameGate
          initialSuggestion={`Commensale ${activeSession.diners.length + 1}`}
          onSubmit={(nick) => {
            const clientId = getClientId();
            const alreadyIn = activeSession.diners.some(
              (d) => d.clientId === clientId,
            );
            if (alreadyIn) {
              updateDinerNickname(activeSession.id, clientId, nick);
            } else {
              addDiner(activeSession.id, clientId, nick);
            }
            setContext({
              ...cartContext,
              nickname: nick,
            });
            setNickname(nick);
          }}
        />
      )}

      <SessionBadge
        session={activeSession}
        table={sessionTable}
        nickname={
          dinerSeparation ? nickname || cartContext.nickname : undefined
        }
        dinerSeparation={dinerSeparation}
        summaryHref={summaryHref}
      />

      {!dinerSeparation && (
        <SessionRunningTotal sessionId={activeSession.id} summaryHref={summaryHref} />
      )}

      <InteractiveMenu />
    </>
  );
}

function SessionBadge({
  session,
  table,
  nickname,
  dinerSeparation,
  summaryHref,
}: {
  session: TableSession;
  table: Table;
  nickname?: string;
  dinerSeparation: boolean;
  summaryHref: string;
}) {
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return `/tavolo?code=${session.code}`;
    return `${window.location.origin}/tavolo?code=${session.code}`;
  }, [session.code]);

  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      navigator
        .share({
          title: `ThePork · ${table.label}`,
          text: `Unisciti al mio tavolo ThePork con il codice ${session.code}`,
          url: shareUrl,
        })
        .catch(() => {});
    } else {
      handleCopy();
    }
  }

  return (
    <section className="bg-pork-ink pt-28 pb-10 text-pork-cream md:pt-36">
      <div className="container-wide">
        <div className="flex flex-wrap items-center gap-3">
          <span className="chip-mustard">{table.label}</span>
          <span className="chip bg-pork-cream/10 text-pork-cream/70">
            Ordina dal telefono
          </span>
          {nickname && (
            <span className="chip bg-pork-red text-white">
              <Users size={12} className="mr-1 inline" /> {nickname}
            </span>
          )}
        </div>
        <h1 className="headline mt-4 text-5xl sm:text-6xl lg:text-7xl text-balance">
          Benvenuto al{" "}
          <span className="text-pork-mustard">{table.label.toLowerCase()}</span>.
        </h1>

        <div className="mt-6 grid gap-4 rounded-2xl bg-pork-cream/5 p-4 ring-1 ring-pork-cream/10 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-pork-mustard">
              Codice del tuo tavolo
            </p>
            <p className="font-impact text-5xl tracking-[0.35em] text-pork-mustard">
              {session.code}
            </p>
          </div>
          <p className="text-sm text-pork-cream/80">
            {dinerSeparation
              ? "Condividi il codice: ognuno ordina dal suo telefono, un solo conto."
              : "Condividi il codice con chi &egrave; al tavolo: gli ordini si sommano sullo stesso conto."}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1 rounded-full bg-pork-mustard px-4 py-2 text-sm font-bold text-pork-ink hover:bg-pork-mustard-soft"
            >
              <Copy size={14} />
              {copied ? "Copiato!" : "Condividi"}
            </button>
            <Link
              href={summaryHref}
              className="inline-flex items-center gap-1 rounded-full bg-pork-cream/10 px-4 py-2 text-sm font-bold text-pork-cream hover:bg-pork-cream/20"
            >
              Vedi il conto
            </Link>
          </div>
        </div>

        {dinerSeparation && session.diners.length > 1 && (
          <p className="mt-3 text-xs text-pork-cream/60">
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
  );
}

function EmptyCentered({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-wide py-32 text-center">
      <div className="mx-auto max-w-lg">{children}</div>
    </div>
  );
}

export default function TavoloPage() {
  return (
    <>
      <MenuaryAuthHintGate />
      <Suspense fallback={null}>
        <TavoloBody />
      </Suspense>
    </>
  );
}
