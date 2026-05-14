"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UtensilsCrossed } from "lucide-react";
import {
  useMenuStore,
  selectActiveSession,
} from "@/store/menu-store";
import { useCartStore } from "@/store/cart-store";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { resolveTableFromCustomerInput } from "@/lib/table-resolve";
import { getClientId } from "@/lib/client-id";
import { NicknameGate } from "@/components/modules/table-orders/nickname-gate";
import type { Table, TableSession } from "@/lib/types";

export type TableJoinBehavior = "tavolo-page" | "menu-page";

type Props = {
  /** Dopo navigazione riuscita (es. chiudi modale). */
  onDone?: () => void;
  className?: string;
  joinBehavior?: TableJoinBehavior;
};

export function TableOrderJoinFlow({
  onDone,
  className,
  joinBehavior = "tavolo-page",
}: Props) {
  const router = useRouter();
  const tables = useMenuStore((s) => s.tables);
  const sessions = useMenuStore((s) => s.sessions);
  const openSession = useMenuStore((s) => s.openSession);
  const addDiner = useMenuStore((s) => s.addDiner);
  const updateDinerNickname = useMenuStore((s) => s.updateDinerNickname);

  const { dinerSeparationAtTables: dinerSeparation } = useEffectiveFeatures();

  const [step, setStep] = useState<"table" | "code">("table");
  const [tableInput, setTableInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [resolvedTable, setResolvedTable] = useState<Table | null>(null);
  const [error, setError] = useState("");

  const [menuPasskey, setMenuPasskey] = useState("");
  const [menuNicknameCtx, setMenuNicknameCtx] = useState<{
    table: Table;
    session: TableSession;
  } | null>(null);

  function reset() {
    setStep("table");
    setTableInput("");
    setCodeInput("");
    setResolvedTable(null);
    setError("");
    setMenuPasskey("");
    setMenuNicknameCtx(null);
  }

  function bindCartToSession(table: Table, session: TableSession) {
    const clientId = getClientId();
    const existing = session.diners.find((d) => d.clientId === clientId);
    const currentNick = existing?.nickname ?? "";

    const ctx = useCartStore.getState().context;
    if (ctx.sessionId && ctx.sessionId !== session.id) {
      useCartStore.getState().clear();
    }

    useCartStore.getState().setContext({
      type: "tavolo",
      tableId: table.id,
      tableLabel: table.label,
      sessionId: session.id,
      sessionCode: session.code,
      clientId,
      nickname:
        dinerSeparation && currentNick ? currentNick : undefined,
    });
  }

  function submitTable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const table = resolveTableFromCustomerInput(tables, tableInput);
    if (!table) {
      setError("Tavolo non trovato. Prova il numero (es. 3) o il nome esatto.");
      return;
    }
    const active = selectActiveSession(sessions, table.id);
    if (!active) {
      router.push(`/tavolo?t=${encodeURIComponent(table.id)}`);
      reset();
      onDone?.();
      return;
    }
    setResolvedTable(table);
    setStep("code");
    setCodeInput("");
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!resolvedTable) {
      setStep("table");
      return;
    }
    const active = selectActiveSession(sessions, resolvedTable.id);
    if (!active) {
      router.push(`/tavolo?t=${encodeURIComponent(resolvedTable.id)}`);
      reset();
      onDone?.();
      return;
    }
    const c = codeInput.replace(/\D/g, "");
    if (c.length < 4) {
      setError("Inserisci le 4 cifre del codice.");
      return;
    }
    if (c !== active.code) {
      setError("Codice non valido per questo tavolo.");
      return;
    }
    router.push(`/tavolo?code=${c}`);
    reset();
    onDone?.();
  }

  function submitMenuUnified(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const table = resolveTableFromCustomerInput(tables, tableInput);
    if (!table) {
      setError("Tavolo non trovato. Prova il numero (es. 3) o il nome esatto.");
      return;
    }

    let active = selectActiveSession(
      useMenuStore.getState().sessions,
      table.id,
    );

    if (!active) {
      active = openSession(table.id, table.seats ?? 4);
    } else {
      const pk = menuPasskey.replace(/\D/g, "");
      if (pk.length < 4) {
        setError("Inserisci il codice a 4 cifre.");
        return;
      }
      if (pk !== active.code) {
        setError("Codice non corretto per questo tavolo.");
        return;
      }
    }

    const clientId = getClientId();
    const existing = active.diners.find((d) => d.clientId === clientId);
    const currentNick = existing?.nickname ?? "";

    if (dinerSeparation && !currentNick) {
      setMenuNicknameCtx({ table, session: active });
      return;
    }

    bindCartToSession(table, active);
    reset();
    onDone?.();
  }

  function finishMenuNickname(nick: string) {
    if (!menuNicknameCtx) return;
    const { table, session } = menuNicknameCtx;
    const clientId = getClientId();
    const alreadyIn = session.diners.some((d) => d.clientId === clientId);
    if (alreadyIn) {
      updateDinerNickname(session.id, clientId, nick);
    } else {
      addDiner(session.id, clientId, nick);
    }

    const fresh = selectActiveSession(useMenuStore.getState().sessions, table.id);
    if (!fresh) {
      setError("Tavolo non più attivo. Riprova.");
      setMenuNicknameCtx(null);
      return;
    }

    bindCartToSession(table, fresh);
    reset();
    onDone?.();
  }

  if (joinBehavior === "menu-page") {
    if (menuNicknameCtx) {
      return (
        <div className={className}>
          <NicknameGate
            embedded
            initialSuggestion={`Commensale ${menuNicknameCtx.session.diners.length + 1}`}
            onSubmit={finishMenuNickname}
          />
        </div>
      );
    }

    return (
      <div className={className}>
        <form onSubmit={submitMenuUnified} className="space-y-3">
          <label className="block text-left">
            <span className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
              Numero tavolo
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="es. 3 oppure Tavolo 3"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-3 text-center font-impact text-2xl outline-none focus:border-pork-red"
            />
          </label>
          <label className="block text-left">
            <span className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
              Codice (4 cifre)
            </span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="solo se il tavolo è già attivo"
              value={menuPasskey}
              onChange={(e) =>
                setMenuPasskey(e.target.value.replace(/\D/g, ""))
              }
              className="mt-1 w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-3 text-center font-impact text-2xl tracking-[0.3em] outline-none focus:border-pork-red"
            />
            <span className="mt-1 block text-xs text-pork-ink/50">
              Primi seduti? Lascia vuoto. Già al tavolo? Il codice che vedi in sala.
            </span>
          </label>
          {error && (
            <p className="text-center text-sm font-semibold text-pork-red">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
          >
            <UtensilsCrossed size={16} /> Conferma
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={className}>
      {step === "table" ? (
        <form onSubmit={submitTable} className="space-y-3">
          <label className="block text-left">
            <span className="text-xs font-bold uppercase tracking-wide text-pork-ink/50">
              Numero o nome tavolo
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="es. 3 oppure Tavolo 3"
              value={tableInput}
              onChange={(e) => setTableInput(e.target.value)}
              className="mt-1 w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-3 text-center font-impact text-2xl outline-none focus:border-pork-red"
            />
          </label>
          {error && (
            <p className="text-center text-sm font-semibold text-pork-red">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
          >
            <UtensilsCrossed size={16} /> Continua
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-3">
          <p className="text-left text-sm text-pork-ink/70">
            Su <strong>{resolvedTable?.label}</strong> &egrave; gi&agrave; aperto un
            ordine. Inserisci il codice a 4 cifre che vedi in sala.
          </p>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="0000"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl border-2 border-pork-ink/10 bg-white px-3 py-3 text-center font-impact text-2xl tracking-[0.3em] outline-none focus:border-pork-red"
          />
          {error && (
            <p className="text-center text-sm font-semibold text-pork-red">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost flex-1 text-sm"
              onClick={() => {
                setStep("table");
                setCodeInput("");
                setError("");
                setResolvedTable(null);
              }}
            >
              Indietro
            </button>
            <button
              type="submit"
              className="btn-primary flex flex-1 items-center justify-center gap-2 text-sm"
            >
              <KeyRound size={16} /> Entra
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
