// Fixture per il pannello /gestione quando l'host è demo.menuary.it /
// demo.bizery.it. Sono numeri "verosimili" calcolati a partire da oggi così
// la demo non sembra mai stantia. I dati di scrittura restano gestiti da
// demo-mode.ts (localStorage); qui produciamo solo letture deterministiche.

import type { Database } from "@/lib/database.types";

type OrderStatus = Database["public"]["Enums"]["order_status"];
type OrderType = Database["public"]["Enums"]["order_type"];

export type DemoOrder = {
  id: string;
  code: string;
  status: OrderStatus;
  type: OrderType;
  total: number;
  customer_name: string | null;
  table_label: string | null;
  pickup_time: string | null;
  desired_time: string | null;
  notes: string | null;
  created_at: string;
  dine_option: string | null;
  confirmation_expires_at: string | null;
  auto_accepted: boolean | null;
  customer_phone: string | null;
  delivery_address: string | null;
  fulfillment_type: string | null;
};

export type DemoOrderLine = { order_id: string; name: string; qty: number; variant_label: string | null };

const FOOD_ITEMS = [
  { name: "Pizza Margherita", price: 7.5 },
  { name: "Pizza Diavola", price: 9.0 },
  { name: "Pizza Capricciosa", price: 10.5 },
  { name: "Tagliere salumi misti", price: 14.0 },
  { name: "Burger Pulled Pork", price: 12.0 },
  { name: "Patatine fritte", price: 4.5 },
  { name: "Tiramisù della casa", price: 5.0 },
  { name: "Birra media", price: 5.5 },
  { name: "Coca cola 33cl", price: 3.5 },
  { name: "Acqua naturale 50cl", price: 1.5 },
];

const SERVICE_ITEMS = [
  { name: "Taglio uomo", price: 18.0 },
  { name: "Taglio + barba", price: 28.0 },
  { name: "Colore + piega", price: 65.0 },
  { name: "Manicure", price: 22.0 },
  { name: "Pedicure", price: 28.0 },
  { name: "Massaggio rilassante 50'", price: 55.0 },
];

const CUSTOMER_NAMES = [
  "Marco Rossi", "Sara Bianchi", "Luca Esposito", "Giulia Romano", "Andrea Conti",
  "Francesca Greco", "Matteo Ricci", "Chiara Marino", "Davide Gallo", "Elena Bruno",
  "Stefano Costa", "Martina Ferrari", "Alessio De Luca", "Valentina Russo",
];

const RES_TAGS = [
  ["bambini"], ["compleanno"], ["allergie"], [], [], ["finestra"], [],
];

const RES_NOTES = [
  "Compleanno, vorremmo torta a sorpresa.",
  "Allergia ai latticini, grazie.",
  "Tavolo vicino alla finestra se possibile.",
  null, null,
  "Arriveremo 10 min in ritardo.",
  null,
];

function isoDay(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
}

function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length];
}

// ---------- Ordini ----------

export function demoOrders(vertical: "food" | "services"): { orders: DemoOrder[]; lines: Map<string, DemoOrderLine[]> } {
  const items = vertical === "services" ? SERVICE_ITEMS : FOOD_ITEMS;
  const now = Date.now();
  const lines = new Map<string, DemoOrderLine[]>();

  // Mix realistico: 1 pending, 2 nuovi, 2 in preparazione, 2 pronti, 5 storici.
  const seeds: { status: OrderStatus; type: OrderType; offsetMin: number; auto?: boolean; pending?: boolean }[] = [
    { status: "pending_confirmation", type: "asporto", offsetMin: -1, pending: true },
    { status: "nuovo", type: "asporto", offsetMin: -4, auto: true },
    { status: "nuovo", type: "tavolo", offsetMin: -7 },
    { status: "in_preparazione", type: "tavolo", offsetMin: -12 },
    { status: "in_preparazione", type: "asporto", offsetMin: -18 },
    { status: "pronto", type: "asporto", offsetMin: -25 },
    { status: "pronto", type: "tavolo", offsetMin: -28 },
    { status: "consegnato", type: "tavolo", offsetMin: -55 },
    { status: "consegnato", type: "asporto", offsetMin: -90 },
    { status: "consegnato", type: "tavolo", offsetMin: -120 },
    { status: "consegnato", type: "asporto", offsetMin: -160 },
    { status: "annullato", type: "asporto", offsetMin: -200 },
  ];

  const orders: DemoOrder[] = seeds.map((s, i) => {
    const id = `demo-ord-${i + 1}`;
    const code = `#${(1240 + i).toString()}`;
    // 1-3 righe per ordine.
    const lineCount = 1 + (i % 3);
    const olines: DemoOrderLine[] = [];
    let total = 0;
    for (let k = 0; k < lineCount; k++) {
      const item = pick(items, i * 3 + k);
      const qty = 1 + ((i + k) % 2);
      total += item.price * qty;
      olines.push({ order_id: id, name: item.name, qty, variant_label: null });
    }
    lines.set(id, olines);

    return {
      id,
      code,
      status: s.status,
      type: s.type,
      total: Math.round(total * 100) / 100,
      customer_name: pick(CUSTOMER_NAMES, i + 3),
      table_label: s.type === "tavolo" ? `Tavolo ${2 + (i % 8)}` : null,
      pickup_time: s.type === "asporto" && (s.status === "nuovo" || s.status === "in_preparazione" || s.status === "pronto" || s.status === "pending_confirmation")
        ? new Date(now + (15 + (i % 4) * 5) * 60_000).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
        : null,
      desired_time: s.type === "asporto" && (s.status === "nuovo" || s.status === "in_preparazione" || s.status === "pronto" || s.status === "pending_confirmation")
        ? new Date(now + (15 + (i % 4) * 5) * 60_000).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
        : null,
      notes: i === 1 ? "Senza cipolla" : i === 4 ? "Cottura ben cotta" : null,
      created_at: new Date(now + s.offsetMin * 60_000).toISOString(),
      dine_option: s.type === "tavolo" ? "dine_in" : "takeaway",
      confirmation_expires_at: s.pending ? new Date(now + 110_000).toISOString() : null,
      auto_accepted: s.auto ?? false,
      customer_phone: s.type === "asporto" && i % 2 === 0
        ? `+39 ${340 + (i % 10)} ${(1000000 + i * 13579).toString().slice(0, 7)}`
        : null,
      delivery_address: null,
      fulfillment_type: s.type === "asporto" ? "takeaway" : null,
    };
  });

  return { orders, lines };
}

// ---------- Prenotazioni / appuntamenti ----------

export type DemoReservation = {
  id: string;
  customer_name: string;
  customer_phone: string;
  covers: number;
  reservation_date: string;
  reservation_time: string;
  notes: string | null;
  status: string;
  table_id: string | null;
  assigned_area: string | null;
  special_request_tags: string[];
  channel: string;
  service_id: string | null;
  duration_minutes: number | null;
  service: { name: string; duration_minutes: number | null } | null;
};

export function demoReservations(vertical: "food" | "services"): DemoReservation[] {
  const services = vertical === "services" ? SERVICE_ITEMS : null;
  const statuses = ["confirmed", "confirmed", "pending_manual", "confirmed", "auto_proposed", "confirmed", "seated", "confirmed", "no_show", "confirmed"];
  const dayOffsets = [0, 0, 0, 0, 1, 1, -1, 2, -2, 3];
  const times = ["12:30", "13:15", "20:00", "20:30", "13:00", "21:00", "13:00", "20:30", "20:00", "12:45"];

  return statuses.map((status, i): DemoReservation => {
    const svc = services ? pick(services, i) : null;
    const duration = vertical === "services" ? 30 + (i % 3) * 15 : null;
    return {
      id: `demo-res-${i + 1}`,
      customer_name: pick(CUSTOMER_NAMES, i),
      customer_phone: `+39 ${340 + (i % 10)} ${(1000000 + i * 13579).toString().slice(0, 7)}`,
      covers: vertical === "services" ? 1 : 2 + (i % 5),
      reservation_date: isoDay(dayOffsets[i]),
      reservation_time: times[i],
      notes: pick(RES_NOTES, i),
      status,
      table_id: status === "confirmed" || status === "seated" ? `demo-table-${i}` : null,
      assigned_area: i % 2 === 0 ? "Sala interna" : "Dehors",
      special_request_tags: pick(RES_TAGS, i),
      channel: i % 3 === 0 ? "web" : i % 3 === 1 ? "phone" : "ai_phone",
      service_id: svc ? `demo-svc-${i}` : null,
      duration_minutes: duration,
      service: svc ? { name: svc.name, duration_minutes: duration } : null,
    };
  });
}

// ---------- Analytics ----------

export type DemoAnalytics = {
  total30: number;
  total7: number;
  avg30: number;
  ordersCount30: number;
  ordersCount7: number;
  reservationsCount30: number;
  reviewsCount: number;
  avgRating: number | null;
  byDay: [string, { count: number; total: number }][];
  top: [string, number][];
};

export function demoAnalytics(vertical: "food" | "services"): DemoAnalytics {
  const now = new Date();
  // 7 giorni con variazione realistica (weekend più alto).
  const byDay: [string, { count: number; total: number }][] = [];
  let total7 = 0;
  let count7 = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const iso = d.toISOString().slice(0, 10);
    const dow = d.getDay(); // 0 dom, 6 sab
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    const base = isWeekend ? 38 : 22;
    const count = base + ((i * 7) % 9);
    const avg = vertical === "services" ? 42 : 28;
    const total = Math.round(count * avg * 100) / 100;
    byDay.push([iso, { count, total }]);
    total7 += total;
    count7 += count;
  }

  const ordersCount30 = count7 * 4 + 18;
  const total30 = total7 * 4 + 1240;
  const avg30 = total30 / ordersCount30;

  const items = vertical === "services" ? SERVICE_ITEMS : FOOD_ITEMS;
  const top: [string, number][] = items.slice(0, 5).map((it, i) => [it.name, 48 - i * 7]);

  return {
    total30: Math.round(total30 * 100) / 100,
    total7: Math.round(total7 * 100) / 100,
    avg30: Math.round(avg30 * 100) / 100,
    ordersCount30,
    ordersCount7: count7,
    reservationsCount30: vertical === "services" ? 142 : 88,
    reviewsCount: 14,
    avgRating: 4.7,
    byDay,
    top,
  };
}

// ---------- Cassa ----------

export type DemoCashSession = {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  status: string;
  note: string | null;
};

export type DemoCashMovement = {
  id: string;
  session_id: string;
  kind: string;
  method: string;
  amount: number;
  note: string | null;
  created_at: string;
};

export function demoCassa(): { session: DemoCashSession; movements: DemoCashMovement[]; recent: DemoCashSession[] } {
  const now = new Date();
  const opened = new Date(now);
  opened.setHours(11, 30, 0, 0);
  const sessionId = "demo-cash-open";

  const seeds: { kind: string; method: string; amount: number; offsetMin: number; note?: string }[] = [
    { kind: "sale", method: "card", amount: 32.5, offsetMin: -210 },
    { kind: "sale", method: "cash", amount: 18.0, offsetMin: -190 },
    { kind: "sale", method: "card", amount: 47.0, offsetMin: -160 },
    { kind: "sale", method: "cash", amount: 12.5, offsetMin: -140 },
    { kind: "sale", method: "card", amount: 28.0, offsetMin: -120 },
    { kind: "cash_out", method: "cash", amount: 20.0, offsetMin: -90, note: "Pagato fornitore pane" },
    { kind: "sale", method: "card", amount: 54.5, offsetMin: -65 },
    { kind: "refund", method: "card", amount: 7.5, offsetMin: -40, note: "Bevanda sostituita" },
    { kind: "sale", method: "cash", amount: 23.0, offsetMin: -20 },
    { kind: "sale", method: "card", amount: 41.0, offsetMin: -5 },
  ];

  const movements: DemoCashMovement[] = seeds.map((s, i) => ({
    id: `demo-mov-${i + 1}`,
    session_id: sessionId,
    kind: s.kind,
    method: s.method,
    amount: s.amount,
    note: s.note ?? null,
    created_at: new Date(now.getTime() + s.offsetMin * 60_000).toISOString(),
  }));

  const session: DemoCashSession = {
    id: sessionId,
    opened_at: opened.toISOString(),
    closed_at: null,
    opening_amount: 100,
    closing_amount: null,
    expected_amount: null,
    status: "open",
    note: null,
  };

  const recent: DemoCashSession[] = [-1, -2, -3].map((d, i) => {
    const oa = new Date(now); oa.setDate(oa.getDate() + d); oa.setHours(11, 30, 0, 0);
    const ca = new Date(oa); ca.setHours(23, 30, 0, 0);
    const expected = 420 + i * 35;
    const closing = expected + (i === 1 ? -8 : i === 2 ? 5 : 0);
    return {
      id: `demo-cash-${i}`,
      opened_at: oa.toISOString(),
      closed_at: ca.toISOString(),
      opening_amount: 100,
      closing_amount: closing,
      expected_amount: expected,
      status: "closed",
      note: null,
    };
  });

  return { session, movements, recent };
}

export type DemoPendingOrder = {
  id: string;
  code: string;
  customer_name: string | null;
  total: number;
  confirmation_expires_at: string | null;
  created_at: string;
};

export function demoPendingOrders(): DemoPendingOrder[] {
  const now = Date.now();
  return [
    {
      id: "demo-ord-1",
      code: "#1240",
      customer_name: "Marco Rossi",
      total: 24.5,
      confirmation_expires_at: new Date(now + 110_000).toISOString(),
      created_at: new Date(now - 60_000).toISOString(),
    },
  ];
}

// ---------- Tavoli ----------

export type DemoTable = { id: string; label: string; area: string; seats: number | null };
export type DemoTableSession = { id: string; table_id: string; opened_at: string; declared_covers: number | null; code: string };

export function demoTavoli(vertical: "food" | "services"): { tables: DemoTable[]; openByTable: Map<string, DemoTableSession> } {
  if (vertical === "services") {
    const tables: DemoTable[] = [
      { id: "t-p1", label: "Postazione 1", area: "Sala taglio", seats: 1 },
      { id: "t-p2", label: "Postazione 2", area: "Sala taglio", seats: 1 },
      { id: "t-p3", label: "Postazione 3", area: "Sala taglio", seats: 1 },
      { id: "t-c1", label: "Cabina A", area: "Cabine estetica", seats: 1 },
      { id: "t-c2", label: "Cabina B", area: "Cabine estetica", seats: 1 },
    ];
    const now = Date.now();
    const open = new Map<string, DemoTableSession>();
    open.set("t-p1", { id: "ts-1", table_id: "t-p1", opened_at: new Date(now - 22 * 60_000).toISOString(), declared_covers: 1, code: "S1" });
    open.set("t-c1", { id: "ts-2", table_id: "t-c1", opened_at: new Date(now - 48 * 60_000).toISOString(), declared_covers: 1, code: "S2" });
    return { tables, openByTable: open };
  }

  const tables: DemoTable[] = [
    { id: "t-1", label: "T1", area: "Sala interna", seats: 2 },
    { id: "t-2", label: "T2", area: "Sala interna", seats: 4 },
    { id: "t-3", label: "T3", area: "Sala interna", seats: 4 },
    { id: "t-4", label: "T4", area: "Sala interna", seats: 6 },
    { id: "t-5", label: "T5", area: "Sala interna", seats: 2 },
    { id: "t-d1", label: "D1", area: "Dehors", seats: 4 },
    { id: "t-d2", label: "D2", area: "Dehors", seats: 4 },
    { id: "t-d3", label: "D3", area: "Dehors", seats: 2 },
  ];
  const now = Date.now();
  const open = new Map<string, DemoTableSession>();
  open.set("t-2", { id: "ts-1", table_id: "t-2", opened_at: new Date(now - 35 * 60_000).toISOString(), declared_covers: 3, code: "T2-A" });
  open.set("t-4", { id: "ts-2", table_id: "t-4", opened_at: new Date(now - 18 * 60_000).toISOString(), declared_covers: 5, code: "T4-A" });
  open.set("t-d1", { id: "ts-3", table_id: "t-d1", opened_at: new Date(now - 72 * 60_000).toISOString(), declared_covers: 4, code: "D1-A" });
  return { tables, openByTable: open };
}

// ---------- Kiosk ----------

export type DemoKioskDevice = {
  id: string;
  name: string;
  location_id: string | null;
  pairing_code: string;
  device_token: string | null;
  enabled: boolean;
  paired_at: string | null;
  last_seen_at: string | null;
  config: {
    languages: string[];
    default_language: string;
    steps: { language_picker: boolean; dine_in_takeaway: boolean; table_number: boolean; customer_name: boolean };
    payments: { cash: boolean; stripe_qr: boolean; satispay: boolean; pos: boolean };
  };
};

export function demoKiosks(): { devices: DemoKioskDevice[]; locations: { id: string; name: string; slug: string }[] } {
  const now = Date.now();
  return {
    devices: [
      {
        id: "demo-k-1",
        name: "Kiosk ingresso",
        location_id: null,
        pairing_code: "K7M2QX",
        device_token: "demo-token-1",
        enabled: true,
        paired_at: new Date(now - 1000 * 60 * 60 * 24 * 9).toISOString(),
        last_seen_at: new Date(now - 30_000).toISOString(),
        config: {
          languages: ["it", "en"],
          default_language: "it",
          steps: { language_picker: true, dine_in_takeaway: true, table_number: true, customer_name: false },
          payments: { cash: true, stripe_qr: true, satispay: false, pos: false },
        },
      },
      {
        id: "demo-k-2",
        name: "Kiosk dehors",
        location_id: null,
        pairing_code: "P3W9HF",
        device_token: "demo-token-2",
        enabled: true,
        paired_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
        last_seen_at: new Date(now - 1000 * 60 * 8).toISOString(),
        config: {
          languages: ["it", "en"],
          default_language: "it",
          steps: { language_picker: false, dine_in_takeaway: false, table_number: false, customer_name: true },
          payments: { cash: false, stripe_qr: true, satispay: false, pos: false },
        },
      },
    ],
    locations: [],
  };
}

// ---------- Turni ----------

export type DemoShift = {
  id: string;
  employee_id: string;
  start_at: string;
  end_at: string;
  role: string | null;
  status: string;
  note: string | null;
};

export type DemoEmployee = {
  user_id: string;
  display_name: string | null;
  email: string;
  role: string;
};

export function demoTurni(): { shifts: DemoShift[]; employees: DemoEmployee[] } {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);

  const employees: DemoEmployee[] = [
    { user_id: "demo-emp-1", display_name: "Giulia Romano", email: "giulia@menuary.demo", role: "cameriere" },
    { user_id: "demo-emp-2", display_name: "Luca Esposito", email: "luca@menuary.demo", role: "cuoco" },
    { user_id: "demo-emp-3", display_name: "Sara Bianchi", email: "sara@menuary.demo", role: "cameriere" },
    { user_id: "demo-emp-4", display_name: "Andrea Conti", email: "andrea@menuary.demo", role: "barista" },
  ];

  // Pianificazione realistica: pranzo 11-15, cena 18-23, chiuso lunedì.
  const plan: { empIdx: number; dayOfs: number; startH: number; endH: number; role: string }[] = [
    { empIdx: 0, dayOfs: 1, startH: 11, endH: 15, role: "sala" },
    { empIdx: 1, dayOfs: 1, startH: 10, endH: 15, role: "cucina" },
    { empIdx: 2, dayOfs: 1, startH: 18, endH: 23, role: "sala" },
    { empIdx: 1, dayOfs: 1, startH: 18, endH: 23, role: "cucina" },

    { empIdx: 0, dayOfs: 2, startH: 11, endH: 15, role: "sala" },
    { empIdx: 3, dayOfs: 2, startH: 11, endH: 15, role: "bar" },
    { empIdx: 2, dayOfs: 2, startH: 18, endH: 23, role: "sala" },

    { empIdx: 0, dayOfs: 3, startH: 18, endH: 23, role: "sala" },
    { empIdx: 1, dayOfs: 3, startH: 18, endH: 23, role: "cucina" },
    { empIdx: 3, dayOfs: 3, startH: 18, endH: 23, role: "bar" },

    { empIdx: 2, dayOfs: 4, startH: 11, endH: 15, role: "sala" },
    { empIdx: 1, dayOfs: 4, startH: 11, endH: 15, role: "cucina" },
    { empIdx: 0, dayOfs: 4, startH: 18, endH: 23, role: "sala" },
    { empIdx: 3, dayOfs: 4, startH: 18, endH: 23, role: "bar" },

    { empIdx: 2, dayOfs: 5, startH: 11, endH: 15, role: "sala" },
    { empIdx: 0, dayOfs: 5, startH: 18, endH: 23, role: "sala" },
    { empIdx: 1, dayOfs: 5, startH: 18, endH: 23, role: "cucina" },
    { empIdx: 3, dayOfs: 5, startH: 18, endH: 23, role: "bar" },

    { empIdx: 0, dayOfs: 6, startH: 11, endH: 23, role: "sala" },
    { empIdx: 2, dayOfs: 6, startH: 11, endH: 23, role: "sala" },
    { empIdx: 1, dayOfs: 6, startH: 10, endH: 23, role: "cucina" },
  ];

  const shifts: DemoShift[] = plan.map((p, i) => {
    const start = new Date(from); start.setDate(from.getDate() + p.dayOfs); start.setHours(p.startH, 0, 0, 0);
    const end = new Date(start); end.setHours(p.endH, 0, 0, 0);
    return {
      id: `demo-sh-${i + 1}`,
      employee_id: employees[p.empIdx].user_id,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      role: p.role,
      status: "planned",
      note: null,
    };
  });

  return { shifts, employees };
}

// ---------- Dashboard KPI ----------

export function demoDashboardKpis(vertical: "food" | "services"): { reservationsToday: number; reviews7d: number; staffActive: number } {
  return {
    reservationsToday: vertical === "services" ? 9 : 14,
    reviews7d: 4,
    staffActive: 5,
  };
}

// ---------- Billing ----------

export type BillingPlan = {
  name: string;
  tier: "starter" | "pro" | "business";
  monthlyPrice: number;
  includedModules: string[];
  nextBillingDate: string;
  paymentMethod: { type: "stripe" | "bonifico"; last4?: string; bankName?: string };
  status: "active" | "past_due" | "canceled";
};

export type BillingInvoice = {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  description: string;
  pdfUrl?: string;
};

export function demoBillingPlan(vertical: "food" | "services" | "creative"): BillingPlan {
  if (vertical === "creative") {
    return {
      name: "Orpheo Pro",
      tier: "pro",
      monthlyPrice: 49,
      includedModules: [
        "Sito autore",
        "Catalogo opere",
        "Booking eventi",
        "Reputation",
        "Fanbase e community",
      ],
      nextBillingDate: "2026-07-05",
      paymentMethod: {
        type: "stripe",
        last4: "4242",
      },
      status: "active",
    };
  }

  return {
    name: vertical === "services" ? "Bizery Pro" : "Menuary Pro",
    tier: "pro",
    monthlyPrice: 49,
    includedModules: [
      vertical === "services" ? "Listino prezzi" : "Menu online",
      vertical === "services" ? "Appuntamenti" : "Prenotazioni",
      "Google Business",
      "Analytics",
      "Staff",
    ],
    nextBillingDate: "2026-07-05",
    paymentMethod: {
      type: "stripe",
      last4: "4242",
    },
    status: "active",
  };
}

export function demoBillingInvoices(): BillingInvoice[] {
  return [
    {
      id: "INV-2026-06",
      date: "2026-06-01",
      amount: 49,
      status: "paid",
      description: "Piano Pro – Giugno 2026",
    },
    {
      id: "INV-2026-05",
      date: "2026-05-01",
      amount: 49,
      status: "paid",
      description: "Piano Pro – Maggio 2026",
    },
    {
      id: "INV-2026-04",
      date: "2026-04-01",
      amount: 49,
      status: "paid",
      description: "Piano Pro – Aprile 2026",
    },
    {
      id: "INV-2026-03",
      date: "2026-03-01",
      amount: 49,
      status: "paid",
      description: "Piano Pro – Marzo 2026",
    },
    {
      id: "INV-2026-02",
      date: "2026-02-01",
      amount: 49,
      status: "paid",
      description: "Piano Pro – Febbraio 2026",
    },
    {
      id: "INV-2026-01",
      date: "2026-01-01",
      amount: 39,
      status: "paid",
      description: "Piano Starter – Gennaio 2026 (upgrade in corso)",
    },
  ];
}
