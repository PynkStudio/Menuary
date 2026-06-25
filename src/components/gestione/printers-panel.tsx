"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Plug,
  Printer,
  RefreshCw,
  Save,
  TestTube2,
} from "lucide-react";
import { useTenant } from "@/components/core/tenant-provider";
import { useGestioneLocation } from "@/components/gestione/gestione-location-provider";
import type { TenantPrinter } from "@/lib/types";
import { buildTestTicketEscPos } from "@/lib/printing/comanda";
import {
  connectQz,
  isQzConnected,
  listQzPrinters,
  printRawEscPos,
} from "@/lib/printing/qz-client";

type PrinterConnectionUI = "qz" | "sunmi_cloud";

type FormState = {
  name: string;
  connection: PrinterConnectionUI;
  qzPrinterName: string | null;
  deviceSn: string | null;
  charWidth: number;
  copies: number;
  autoPrint: boolean;
  enabled: boolean;
};

const EMPTY: FormState = {
  name: "Cucina",
  connection: "qz",
  qzPrinterName: null,
  deviceSn: null,
  charWidth: 48,
  copies: 1,
  autoPrint: true,
  enabled: true,
};

type QzState = "idle" | "connecting" | "connected" | "error";

export function PrintersPanel() {
  const tenant = useTenant();
  const { activeLocation } = useGestioneLocation();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [qz, setQz] = useState<QzState>("idle");
  const [qzPrinters, setQzPrinters] = useState<string[]>([]);
  const [qzError, setQzError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const savedRef = useRef<FormState | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({ tenantId: tenant.id });
      if (activeLocation) params.set("locationId", activeLocation.id);
      const res = await fetch(`/api/gestione/printers?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        if (!cancelled) setLoaded(true);
        return;
      }
      const { printers } = (await res.json()) as { printers: TenantPrinter[] };
      const def = printers.find((p) => p.isDefault) ?? printers[0];
      if (cancelled) return;
      if (def) {
        const next: FormState = {
          name: def.name,
          connection: def.connection === "sunmi_cloud" ? "sunmi_cloud" : "qz",
          qzPrinterName: def.qzPrinterName,
          deviceSn: def.deviceSn,
          charWidth: def.charWidth,
          copies: def.copies,
          autoPrint: def.autoPrint,
          enabled: def.enabled,
        };
        setForm(next);
        savedRef.current = next;
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeLocation, tenant.id]);

  useEffect(() => {
    void isQzConnected().then((active) => {
      if (active) {
        setQz("connected");
        void listQzPrinters().then(setQzPrinters).catch(() => undefined);
      }
    });
  }, []);

  const connect = useCallback(async () => {
    setQz("connecting");
    setQzError(null);
    try {
      await connectQz();
      const printers = await listQzPrinters();
      setQzPrinters(printers);
      setQz("connected");
    } catch (e) {
      setQz("error");
      setQzError(
        e instanceof Error
          ? e.message
          : "Impossibile connettersi a QZ Tray. Verifica che sia installato e in esecuzione sul PC cassa.",
      );
    }
  }, []);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const params = new URLSearchParams({ tenantId: tenant.id });
      if (activeLocation) params.set("locationId", activeLocation.id);
      const res = await fetch(`/api/gestione/printers?${params.toString()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: tenant.id, locationId: activeLocation?.id ?? null, ...form }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMsg(err.error ?? "Errore salvataggio");
      } else {
        setMsg("Stampante salvata.");
        savedRef.current = form;
      }
    } finally {
      setSaving(false);
    }
  }

  async function testPrint() {
    if (!form.qzPrinterName) {
      setQzError("Seleziona prima una stampante.");
      return;
    }
    setTesting(true);
    setQzError(null);
    try {
      if (qz !== "connected") await connect();
      const ticket = buildTestTicketEscPos({
        ...EMPTY,
        id: "test",
        tenantId: tenant.id,
        locationId: activeLocation?.id ?? null,
        station: null,
        categories: null,
        ...form,
      } as TenantPrinter);
      await printRawEscPos(form.qzPrinterName, ticket, 1);
      setMsg("Comanda di prova inviata.");
    } catch (e) {
      setQzError(e instanceof Error ? e.message : "Stampa di prova fallita.");
    } finally {
      setTesting(false);
    }
  }

  if (!loaded) return <p className="text-sm text-zinc-500">Carico…</p>;

  return (
    <form onSubmit={save} className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Stampanti comande</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Collega la stampante delle comande del locale. Con <strong>QZ Tray</strong>{" "}
          usi una stampante USB sul PC cassa; con una <strong>stampante cloud SUNMI</strong>{" "}
          la stampa è automatica e server-side, senza PC.
        </p>
      </header>

      {/* Connessione QZ Tray (solo per stampanti USB via QZ) */}
      {form.connection === "qz" && (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Plug size={18} /> Ponte di stampa (QZ Tray)
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Apri questa pagina dal computer collegato alla stampante. QZ Tray deve
          essere installato e avviato. Alla prima connessione il PC chiederà di
          autorizzare il collegamento.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={connect}
            disabled={qz === "connecting"}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {qz === "connecting" ? <RefreshCw size={16} className="animate-spin" /> : <Plug size={16} />}
            {qz === "connected" ? "Riconnetti" : qz === "connecting" ? "Connetto…" : "Connetti QZ Tray"}
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold uppercase text-zinc-600">
            {qz === "connected" ? (
              <>
                <CheckCircle2 size={14} className="text-emerald-600" /> Connesso
              </>
            ) : qz === "error" ? (
              <>
                <AlertTriangle size={14} className="text-red-600" /> Errore
              </>
            ) : (
              "Non connesso"
            )}
          </span>
        </div>

        {qzError && (
          <p className="mt-3 flex gap-2 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
            <AlertTriangle size={16} className="shrink-0" /> {qzError}
          </p>
        )}

        <p className="mt-3 text-xs text-zinc-400">
          QZ Tray non installato?{" "}
          <a href="https://qz.io/download/" target="_blank" rel="noreferrer" className="underline">
            Scaricalo qui
          </a>
          .
        </p>
      </section>
      )}

      {/* Stampante */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Printer size={18} /> Stampante del locale
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Una stampante comande per locale. Il supporto a più stampanti per
          reparto (cucina, bar, pizzeria) arriverà in seguito.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Nome / reparto
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              placeholder="Cucina"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Tipo di collegamento
            </span>
            <select
              value={form.connection}
              onChange={(e) => patch("connection", e.target.value as PrinterConnectionUI)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            >
              <option value="qz">USB sul PC cassa (QZ Tray)</option>
              <option value="sunmi_cloud">Stampante cloud SUNMI</option>
            </select>
          </label>

          {form.connection === "qz" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Dispositivo (da QZ Tray)
              </span>
              <select
                value={form.qzPrinterName ?? ""}
                onChange={(e) => patch("qzPrinterName", e.target.value || null)}
                disabled={qz !== "connected"}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">
                  {qz === "connected" ? "— seleziona —" : "Connetti QZ Tray per vedere le stampanti"}
                </option>
                {form.qzPrinterName && !qzPrinters.includes(form.qzPrinterName) && (
                  <option value={form.qzPrinterName}>{form.qzPrinterName} (salvata)</option>
                )}
                {qzPrinters.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
                SN stampante SUNMI
              </span>
              <input
                type="text"
                value={form.deviceSn ?? ""}
                onChange={(e) => patch("deviceSn", e.target.value || null)}
                placeholder="es. P1234567890"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Larghezza carta
            </span>
            <select
              value={form.charWidth}
              onChange={(e) => patch("charWidth", Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            >
              <option value={48}>80 mm (48 caratteri)</option>
              <option value={32}>58 mm (32 caratteri)</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Copie
            </span>
            <input
              type="number"
              min={1}
              max={5}
              value={form.copies}
              onChange={(e) => patch("copies", Math.max(1, Math.min(5, Number(e.target.value) || 1)))}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
          </label>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.autoPrint}
              onChange={(e) => patch("autoPrint", e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium">Stampa automatica</span>
              <span className="block text-xs text-zinc-500">
                {form.connection === "sunmi_cloud"
                  ? "Stampa la comanda appena un ordine viene accettato. Server-side: nessun PC da tenere acceso."
                  : "Stampa la comanda appena arriva un nuovo ordine (richiede la pagina Operativo → Ordini aperta sul PC cassa)."}
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => patch("enabled", e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium">Stampante attiva</span>
              <span className="block text-xs text-zinc-500">Disattiva per sospendere la stampa.</span>
            </span>
          </label>
        </div>

        {form.connection === "qz" ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={testPrint}
              disabled={testing || !form.qzPrinterName}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 disabled:opacity-50"
            >
              <TestTube2 size={16} /> {testing ? "Stampo…" : "Stampa di prova"}
            </button>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">
            La stampante cloud SUNMI stampa lato server appena un ordine viene
            accettato: collega il device dal portale SUNMI e inserisci qui il suo SN.
            La stampa di prova dal browser non è disponibile per le cloud.
          </p>
        )}
      </section>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 font-medium text-white disabled:opacity-50"
        >
          <Save size={16} /> {saving ? "Salvo…" : "Salva stampante"}
        </button>
        {msg && <span className="text-sm text-zinc-600">{msg}</span>}
      </div>
    </form>
  );
}
