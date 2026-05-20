import { notFound } from "next/navigation";
import { Power, Plus, ArrowDown, ArrowUp, Banknote, CreditCard } from "lucide-react";
import { TENANTS } from "@/lib/tenant-registry";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { openCashSession, closeCashSession, addCashMovement } from "./actions";

type Session = {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  status: string;
  note: string | null;
};

type Movement = {
  id: string;
  session_id: string;
  kind: string;
  method: string;
  amount: number;
  note: string | null;
  created_at: string;
};

const KIND_LABEL: Record<string, string> = {
  sale: "Vendita",
  refund: "Reso",
  cash_in: "Versamento",
  cash_out: "Prelievo",
  adjustment: "Rettifica",
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Contanti",
  card: "Carta",
  voucher: "Voucher",
  other: "Altro",
};

async function fetchCassa(tenantSlug: string): Promise<{ session: Session | null; movements: Movement[]; recent: Session[] }> {
  const svc = createSupabaseServiceClient();
  if (!svc) return { session: null, movements: [], recent: [] };

  const { data: openRow } = await svc
    .from("cash_sessions")
    .select("id, opened_at, closed_at, opening_amount, closing_amount, expected_amount, status, note")
    .eq("tenant_id", tenantSlug)
    .eq("status", "open")
    .maybeSingle();

  const movements: Movement[] = openRow
    ? ((await svc
        .from("cash_movements")
        .select("id, session_id, kind, method, amount, note, created_at")
        .eq("session_id", openRow.id)
        .order("created_at", { ascending: false })
        .limit(100)
      ).data ?? []) as Movement[]
    : [];

  const { data: recent } = await svc
    .from("cash_sessions")
    .select("id, opened_at, closed_at, opening_amount, closing_amount, expected_amount, status, note")
    .eq("tenant_id", tenantSlug)
    .eq("status", "closed")
    .order("opened_at", { ascending: false })
    .limit(10);

  return { session: openRow as Session | null, movements, recent: (recent ?? []) as Session[] };
}

function formatCurrency(n: number | null): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n ?? 0);
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function sumByMethod(movements: Movement[]): { cash: number; card: number; other: number } {
  let cash = 0, card = 0, other = 0;
  for (const m of movements) {
    const sign = m.kind === "refund" || m.kind === "cash_out" ? -1 : 1;
    const a = sign * Number(m.amount);
    if (m.method === "cash") cash += a;
    else if (m.method === "card") card += a;
    else other += a;
  }
  return { cash, card, other };
}

export default async function CassaPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((t) => t.id === tenantSlug);
  if (!tenant) return null;
  const auth = await authorizeGestione(tenantSlug);
  if (!auth.ok) notFound();

  const data = auth.isDemo
    ? { session: null as Session | null, movements: [] as Movement[], recent: [] as Session[] }
    : await fetchCassa(tenantSlug);

  const totals = sumByMethod(data.movements);

  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">Operatività</span>
        <h1 className="ga-heading">Cassa</h1>
        <p className="ga-lead">Apertura, chiusura e movimenti del registro di cassa per la giornata.</p>
      </header>

      {data.session ? (
        <>
          <section className="ga-card">
            <div className="ga-section-head">
              <h2 className="ga-section-title">Sessione aperta</h2>
              <span className="ga-section-hint">Aperta il {formatDateTime(data.session.opened_at)}</span>
            </div>
            <div className="ga-kpi-grid">
              <div className="ga-kpi">
                <span className="ga-kpi-label">Fondo iniziale</span>
                <span className="ga-kpi-value">{formatCurrency(data.session.opening_amount)}</span>
              </div>
              <div className="ga-kpi">
                <span className="ga-kpi-label">Contanti netti</span>
                <span className="ga-kpi-value">{formatCurrency(totals.cash)}</span>
              </div>
              <div className="ga-kpi">
                <span className="ga-kpi-label">Carta</span>
                <span className="ga-kpi-value">{formatCurrency(totals.card)}</span>
              </div>
              <div className="ga-kpi">
                <span className="ga-kpi-label">Atteso in cassa</span>
                <span className="ga-kpi-value">
                  {formatCurrency(Number(data.session.opening_amount) + totals.cash)}
                </span>
              </div>
            </div>
          </section>

          <section className="ga-card">
            <div className="ga-section-head">
              <h2 className="ga-section-title">Nuovo movimento</h2>
            </div>
            <form action={addCashMovement} className="ga-form-inline">
              <input type="hidden" name="tenantSlug" value={tenantSlug} />
              <input type="hidden" name="sessionId" value={data.session.id} />
              <select name="kind" className="ga-select" defaultValue="sale">
                {Object.entries(KIND_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
              <select name="method" className="ga-select" defaultValue="cash">
                {Object.entries(METHOD_LABEL).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0.01"
                placeholder="Importo €"
                required
                className="ga-input"
              />
              <input type="text" name="note" placeholder="Note (opz.)" className="ga-input" />
              <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                <Plus size={14} strokeWidth={2.4} /> Aggiungi
              </button>
            </form>
          </section>

          <section className="ga-card">
            <div className="ga-section-head">
              <h2 className="ga-section-title">Movimenti</h2>
              <span className="ga-section-hint">{data.movements.length} registrati</span>
            </div>
            {data.movements.length === 0 ? (
              <div className="ga-empty">Nessun movimento registrato.</div>
            ) : (
              <div className="ga-movements">
                {data.movements.map((m) => {
                  const out = m.kind === "refund" || m.kind === "cash_out";
                  return (
                    <div key={m.id} className="ga-movement">
                      <span className="ga-movement-icon" data-out={out}>
                        {out ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
                      </span>
                      <div>
                        <div className="ga-movement-kind">{KIND_LABEL[m.kind] ?? m.kind}</div>
                        <div className="ga-movement-meta">
                          {m.method === "cash" ? <Banknote size={12} /> : <CreditCard size={12} />}
                          {METHOD_LABEL[m.method] ?? m.method}
                          {m.note && ` · ${m.note}`}
                          {` · ${formatDateTime(m.created_at)}`}
                        </div>
                      </div>
                      <span className="ga-movement-amount" data-out={out}>
                        {out ? "-" : "+"}{formatCurrency(Number(m.amount))}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="ga-card">
            <div className="ga-section-head">
              <h2 className="ga-section-title">Chiudi cassa</h2>
            </div>
            <form action={closeCashSession} className="ga-form-inline">
              <input type="hidden" name="tenantSlug" value={tenantSlug} />
              <input type="hidden" name="sessionId" value={data.session.id} />
              <input
                type="number"
                name="closingAmount"
                step="0.01"
                min="0"
                placeholder="Contati a fine giornata €"
                required
                className="ga-input"
              />
              <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
                <Power size={14} strokeWidth={2.4} /> Chiudi sessione
              </button>
            </form>
          </section>
        </>
      ) : (
        <section className="ga-card">
          <div className="ga-section-head">
            <h2 className="ga-section-title">Apri cassa</h2>
            <span className="ga-section-hint">Nessuna sessione aperta</span>
          </div>
          <form action={openCashSession} className="ga-form-inline">
            <input type="hidden" name="tenantSlug" value={tenantSlug} />
            <input
              type="number"
              name="openingAmount"
              step="0.01"
              min="0"
              defaultValue="0"
              placeholder="Fondo iniziale €"
              className="ga-input"
            />
            <button type="submit" className="ga-btn ga-btn-primary" disabled={auth.isDemo}>
              <Power size={14} strokeWidth={2.4} /> Apri sessione
            </button>
          </form>
        </section>
      )}

      {data.recent.length > 0 && (
        <section className="ga-card">
          <div className="ga-section-head">
            <h2 className="ga-section-title">Storico recenti</h2>
            <span className="ga-section-hint">Ultime 10 sessioni chiuse</span>
          </div>
          <div className="ga-movements">
            {data.recent.map((s) => {
              const diff = (s.closing_amount ?? 0) - (s.expected_amount ?? 0);
              return (
                <div key={s.id} className="ga-movement">
                  <span className="ga-movement-icon">
                    <Power size={14} />
                  </span>
                  <div>
                    <div className="ga-movement-kind">
                      Sessione del {formatDateTime(s.opened_at)}
                    </div>
                    <div className="ga-movement-meta">
                      Atteso {formatCurrency(s.expected_amount)} · Contato {formatCurrency(s.closing_amount)}
                    </div>
                  </div>
                  <span className="ga-movement-amount" data-out={diff < 0}>
                    {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
