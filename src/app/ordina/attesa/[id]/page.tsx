"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/lib/types";

type Phase = "loading" | "waiting" | "confirmed" | "rejected" | "expired" | "error";

export default function AttesaPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const orderId = params?.id;

  const [phase, setPhase] = useState<Phase>("loading");
  const [order, setOrder] = useState<Order | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const tickRef = useRef<number | null>(null);

  // Mappa stato DB → fase UI.
  const applyStatus = useCallback(
    (next: Pick<Order, "status" | "confirmationExpiresAt">) => {
      const status: OrderStatus = next.status;
      if (status === "nuovo" || status === "in_preparazione" || status === "pronto" || status === "consegnato") {
        setPhase("confirmed");
      } else if (status === "annullato") {
        setPhase("rejected");
      } else if (status === "expired") {
        setPhase("expired");
      } else if (status === "pending_confirmation") {
        setPhase("waiting");
        if (next.confirmationExpiresAt) {
          const ms = new Date(next.confirmationExpiresAt).getTime() - Date.now();
          setSecondsLeft(Math.max(0, Math.ceil(ms / 1000)));
        }
      }
    },
    [],
  );

  // Initial fetch.
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setPhase("error");
          return;
        }
        const data: Order = await res.json();
        if (cancelled) return;
        setOrder(data);
        applyStatus(data);
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, applyStatus]);

  // Countdown locale durante pending.
  useEffect(() => {
    if (phase !== "waiting") {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s == null) return s;
        if (s <= 1) {
          // Scadenza locale: marchiamo expired in UI; lo stato vero arriverà via realtime
          // o sarà già aggiornato lato server al prossimo confirm.
          setPhase("expired");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [phase]);

  // Realtime subscribe sulla riga ordine.
  useEffect(() => {
    if (!orderId) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
        (payload) => {
          const next = payload.new as {
            status: OrderStatus;
            confirmation_expires_at: string | null;
          };
          applyStatus({
            status: next.status,
            confirmationExpiresAt: next.confirmation_expires_at ?? undefined,
          });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId, applyStatus]);

  // Redirect automatico a conferma quando confermato.
  useEffect(() => {
    if (phase === "confirmed" && orderId) {
      const t = window.setTimeout(() => {
        router.replace(`/ordina/conferma?id=${orderId}`);
      }, 1500);
      return () => window.clearTimeout(t);
    }
  }, [phase, orderId, router]);

  return (
    <div className="min-h-screen bg-pork-cream pb-32 pt-32 md:pt-40">
      <div className="container-wide max-w-2xl text-center">
        {phase === "loading" && <LoadingState />}
        {phase === "waiting" && (
          <WaitingState code={order?.code} secondsLeft={secondsLeft ?? 0} />
        )}
        {phase === "confirmed" && <ConfirmedState code={order?.code} />}
        {phase === "rejected" && <RejectedState />}
        {phase === "expired" && <ExpiredState />}
        {phase === "error" && <ErrorState />}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <p className="impact-title text-pork-ink/60">Carico l&apos;ordine…</p>
  );
}

function WaitingState({ code, secondsLeft }: { code?: string; secondsLeft: number }) {
  const mm = Math.floor(secondsLeft / 60).toString().padStart(1, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");
  return (
    <>
      <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-pork-mustard text-pork-ink animate-pulse">
        <Clock size={40} />
      </div>
      <h1 className="headline mt-6 text-5xl sm:text-6xl">In attesa di conferma</h1>
      <p className="mt-4 text-lg text-pork-ink/70">
        Il ristorante sta verificando il tuo ordine.
        <br />
        Riceverai conferma a breve.
      </p>
      {code && (
        <p className="mt-3 text-sm text-pork-ink/50">
          Codice ordine:{" "}
          <span className="font-impact text-pork-red text-lg">{code}</span>
        </p>
      )}
      <div className="mt-8 inline-flex items-baseline gap-2 rounded-full bg-pork-ink px-6 py-3 text-pork-cream">
        <span className="text-xs uppercase tracking-wide text-pork-cream/60">
          Tempo restante
        </span>
        <span className="font-impact text-2xl tabular-nums">
          {mm}:{ss}
        </span>
      </div>
      <p className="mx-auto mt-6 max-w-md text-xs text-pork-ink/50">
        Non chiudere questa pagina. Aggiorneremo lo stato automaticamente.
      </p>
    </>
  );
}

function ConfirmedState({ code }: { code?: string }) {
  return (
    <>
      <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white">
        <CheckCircle2 size={40} />
      </div>
      <h1 className="headline mt-6 text-5xl sm:text-6xl">Ordine confermato!</h1>
      <p className="mt-4 text-lg text-pork-ink/70">
        Il locale ha preso in carico il tuo ordine{code ? ` ${code}` : ""}. Ti
        portiamo al riepilogo…
      </p>
    </>
  );
}

function RejectedState() {
  return (
    <>
      <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-pork-red text-pork-cream">
        <XCircle size={40} />
      </div>
      <h1 className="headline mt-6 text-5xl sm:text-6xl">Ordine non accettato</h1>
      <p className="mt-4 text-lg text-pork-ink/70">
        Il ristorante non ha potuto accettare l&apos;ordine in questo momento.
        Nessun pagamento è stato effettuato.
      </p>
      <Link href="/menu" className="btn-primary mt-8 inline-flex">
        Torna al menu
      </Link>
    </>
  );
}

function ExpiredState() {
  return (
    <>
      <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-pork-ink/10 text-pork-ink">
        <AlertTriangle size={40} />
      </div>
      <h1 className="headline mt-6 text-5xl sm:text-6xl">Tempo scaduto</h1>
      <p className="mt-4 text-lg text-pork-ink/70">
        Il locale non ha confermato in tempo. Riprova più tardi o contatta
        direttamente il ristorante.
      </p>
      <Link href="/menu" className="btn-primary mt-8 inline-flex">
        Torna al menu
      </Link>
    </>
  );
}

function ErrorState() {
  return (
    <>
      <p className="impact-title text-pork-red">Ordine non trovato.</p>
      <Link href="/menu" className="btn-primary mt-6 inline-flex">
        Torna al menu
      </Link>
    </>
  );
}
