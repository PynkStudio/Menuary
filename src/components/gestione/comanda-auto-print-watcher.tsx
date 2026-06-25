"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Plug, Printer, RefreshCw } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Order, TenantPrinter } from "@/lib/types";
import { buildComandaEscPos } from "@/lib/printing/comanda";
import { connectQz, isQzConnected, printRawEscPos } from "@/lib/printing/qz-client";

// Postazione di stampa comande (modulo printStations).
//
// Va tenuta aperta sul PC cassa collegato alla stampante. Stampa AUTOMATICAMENTE
// le comande degli ordini accettati (entrati in cucina) di QUALSIASI canale
// (sito / WhatsApp / Retell), perché legge la coda server `orders`.
//
// Trigger: evento realtime su `orders` → "drain" della coda. In più un drain
// all'avvio e un poll di sicurezza periodico (in caso di evento perso).
// Dedup: server-side (`comanda_printed_at`) + set di sessione anti doppione.

type QzState = "idle" | "connecting" | "connected" | "error";

const SAFETY_POLL_MS = 25_000;

export function ComandaAutoPrintWatcher({
  tenantId,
  locationId,
}: {
  tenantId: string;
  locationId: string | null;
}) {
  const [qz, setQz] = useState<QzState>("idle");
  const [printedCount, setPrintedCount] = useState(0);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const drainingRef = useRef(false);
  const printedSessionRef = useRef<Set<string>>(new Set());
  const debounceRef = useRef<number | null>(null);

  const ensureConnected = useCallback(async () => {
    if (await isQzConnected()) {
      setQz("connected");
      return true;
    }
    setQz("connecting");
    try {
      await connectQz();
      setQz("connected");
      return true;
    } catch (e) {
      setQz("error");
      setError(e instanceof Error ? e.message : "QZ Tray non raggiungibile.");
      return false;
    }
  }, []);

  const drain = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    try {
      const params = new URLSearchParams({ tenantId });
      if (locationId) params.set("locationId", locationId);
      const res = await fetch(`/api/gestione/printers/queue?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const { printer, orders } = (await res.json()) as { printer: TenantPrinter | null; orders: Order[] };
      if (!printer?.qzPrinterName || !orders?.length) return;

      const fresh = orders.filter((o) => !printedSessionRef.current.has(o.id));
      if (!fresh.length) return;

      if (!(await ensureConnected())) return;

      const printed: string[] = [];
      for (const order of fresh) {
        try {
          await printRawEscPos(printer.qzPrinterName, buildComandaEscPos(order, printer), printer.copies);
          printedSessionRef.current.add(order.id);
          printed.push(order.id);
          setLastCode(order.code);
        } catch (e) {
          setError(e instanceof Error ? e.message : "Stampa comanda fallita.");
          break; // stampante non risponde: interrompi, riprova al prossimo giro
        }
      }

      if (printed.length) {
        setPrintedCount((n) => n + printed.length);
        setError(null);
        await fetch(`/api/gestione/printers/queue?tenantId=${tenantId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId, orderIds: printed }),
        }).catch(() => undefined);
      }
    } finally {
      drainingRef.current = false;
    }
  }, [tenantId, locationId, ensureConnected]);

  const scheduleDrain = useCallback(() => {
    if (debounceRef.current != null) return;
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
      void drain();
    }, 800);
  }, [drain]);

  useEffect(() => {
    void ensureConnected().then(() => void drain());

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`comanda-print-${tenantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `tenant_id=eq.${tenantId}` },
        scheduleDrain,
      )
      .subscribe();

    const safety = window.setInterval(() => void drain(), SAFETY_POLL_MS);

    return () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
      window.clearInterval(safety);
      void supabase.removeChannel(channel);
    };
  }, [tenantId, drain, ensureConnected, scheduleDrain]);

  return (
    <div
      className="ga-card"
      style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 14px" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
        <Printer size={16} /> Stampa comande
      </span>

      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          opacity: 0.85,
        }}
      >
        {qz === "connected" ? (
          <>
            <CheckCircle2 size={14} color="#059669" /> Attiva
          </>
        ) : qz === "connecting" ? (
          <>
            <RefreshCw size={14} className="animate-spin" /> Connetto…
          </>
        ) : qz === "error" ? (
          <>
            <AlertTriangle size={14} color="#dc2626" /> Errore
          </>
        ) : (
          "In avvio"
        )}
      </span>

      {printedCount > 0 && (
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {printedCount} stampate{lastCode ? ` · ultima #${lastCode}` : ""}
        </span>
      )}

      {qz === "error" && (
        <button
          type="button"
          onClick={() => void ensureConnected().then(() => void drain())}
          className="ga-btn"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          <Plug size={13} /> Riconnetti
        </button>
      )}

      {error && qz === "error" && <span style={{ fontSize: 12, color: "#dc2626" }}>{error}</span>}
    </div>
  );
}
