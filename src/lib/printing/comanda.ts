import type { Order, OrderLine, TenantPrinter } from "@/lib/types";
import { CMD, asciiFold, feed, justify, rule, wrap } from "./escpos";

// Costruzione della comanda di cucina in ESC/POS a partire da un Order.
//
// F2/TODO(multi-printer): quando il routing per reparto sarà attivo, filtrare le
// righe per `printer.station` / `printer.categories` riusando il raggruppamento
// di lib/kitchen-merge (groupKitchenOrderLines). Per ora la comanda contiene
// tutte le righe dell'ordine su un'unica stampante.

function originLabel(order: Order): string {
  if (order.tableLabel) return `TAVOLO ${order.tableLabel}`;
  if (order.table != null) return `TAVOLO ${order.table}`;
  switch (order.dineOption) {
    case "takeaway":
      return "ASPORTO";
    case "delivery":
      return "DELIVERY";
    case "dine_in":
      return "MANGIA QUI";
    default:
      return order.type ? String(order.type).toUpperCase() : "ORDINE";
  }
}

// Riga pagamento per la comanda: stato (pagato/non pagato) + metodo (contanti/carta).
// Chi consegna deve sapere se portare il POS: senza metodo indicato lo diciamo, invece
// di presumere i contanti.
function paymentLabel(order: Order): string {
  const paid = order.paymentStatus === "paid";
  if (paid) return "PAGATO";
  if (order.tableLabel || order.table != null) return "DA PAGARE";
  const isDelivery = order.dineOption === "delivery" || String(order.type) === "delivery" || Boolean(order.deliveryAddress);
  const when = isDelivery ? "ALLA CONSEGNA" : "AL RITIRO";
  if (order.paymentMethod === "on_delivery_card") return `DA PAGARE ${when}: CARTA (POS)`;
  if (order.paymentMethod === "on_delivery_cash") return `DA PAGARE ${when}: CONTANTI`;
  return `DA PAGARE ${when}: CHIEDERE CONTANTI O CARTA`;
}

// La comanda esce in cucina in Italia, ma il dispatch gira su server UTC.
const COMANDA_TIMEZONE = "Europe/Rome";

// desired_time arriva come "HH:MM", "YYYY-MM-DD HH:MM" o ISO: in comanda serve una
// forma breve e inequivocabile, con la data solo quando non è oggi.
function formatRequestedTime(raw: string): string {
  const value = raw.trim();
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: COMANDA_TIMEZONE });
  const local = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/);
  if (local) {
    const [, y, m, d, hh, mm] = local;
    const time = `${hh.padStart(2, "0")}:${mm}`;
    return `${y}-${m}-${d}` === today ? time : `${d}/${m} ${time}`;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const day = date.toLocaleDateString("sv-SE", { timeZone: COMANDA_TIMEZONE });
      const time = date.toLocaleTimeString("it-IT", { timeZone: COMANDA_TIMEZONE, hour: "2-digit", minute: "2-digit" });
      if (day === today) return time;
      const [, m, d] = day.split("-");
      return `${d}/${m} ${time}`;
    }
  }
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}`;
  return value;
}

function lineBlock(line: OrderLine, width: number): string {
  const head = `${line.qty}x ${line.name}`;
  const parts: string[] = [CMD.boldOn + asciiFold(head) + CMD.boldOff + "\n"];

  // Il checkout del sito e il telefono mettono già il formato nel nome ("Margherita
  // (Gigante)"): ripeterlo sotto confonde la lettura.
  if (line.variantLabel && !line.name.includes(`(${line.variantLabel})`)) {
    parts.push(`  - variante: ${asciiFold(line.variantLabel)}\n`);
  }
  for (const extra of line.addedExtras ?? []) {
    parts.push(`  + ${asciiFold(extra.name)}\n`);
  }
  for (const removed of line.removedIngredients ?? []) {
    parts.push(`  - senza ${asciiFold(removed)}\n`);
  }
  if (line.note) {
    for (const w of wrap(`>> ${line.note}`, width)) parts.push(`  ${w}\n`);
  }
  return parts.join("");
}

export function buildComandaEscPos(order: Order, printer: TenantPrinter, opts?: { variant?: "new" | "payment_update" }): string {
  const w = printer.charWidth || 48;
  const isUpdate = opts?.variant === "payment_update";
  const createdAt = order.createdAt ? new Date(order.createdAt) : null;
  const time = createdAt
    ? createdAt.toLocaleTimeString("it-IT", { timeZone: COMANDA_TIMEZONE, hour: "2-digit", minute: "2-digit" })
    : "";

  let out = CMD.init;
  // Banner di "variazione pagamento": testata distinta e riconoscibile rispetto alla
  // comanda originale, così la cucina non la scambia per un nuovo ordine.
  if (isUpdate) {
    out += CMD.alignCenter + CMD.sizeDouble + CMD.boldOn;
    out += "** VARIAZIONE **\n";
    out += "PAGAMENTO\n";
    out += CMD.sizeNormal + CMD.boldOff;
    out += rule(w) + "\n";
    out += CMD.alignLeft;
  }
  out += CMD.alignCenter + CMD.sizeDouble + CMD.boldOn;
  out += "MENUARY\n";
  out += CMD.sizeNormal + CMD.boldOff;
  out += `Ordine N. ${asciiFold(order.code ?? "")}\n`;
  out += CMD.alignLeft;
  out += justify(asciiFold(originLabel(order)), time, w) + "\n";
  out += rule(w) + "\n";
  // Orario richiesto in grande: è la prima cosa che la cucina deve leggere.
  const requested = order.desiredTime || order.pickupTime;
  if (requested) {
    const isDelivery = order.dineOption === "delivery" || String(order.type) === "delivery" || Boolean(order.deliveryAddress);
    out += CMD.sizeDoubleHeight + CMD.boldOn;
    out += asciiFold(`${isDelivery ? "CONSEGNA" : "RITIRO"} ORE ${formatRequestedTime(requested)}`) + "\n";
    out += CMD.sizeNormal + CMD.boldOff;
  }
  if (order.customerName) out += `Cliente: ${asciiFold(order.customerName)}\n`;
  if (order.deliveryAddress) {
    for (const wline of wrap(asciiFold(order.deliveryAddress), w)) out += `${wline}\n`;
  }
  if (order.deliveryDoorbell) out += CMD.boldOn + `Citofono: ${asciiFold(order.deliveryDoorbell)}` + CMD.boldOff + "\n";
  if (order.deliveryFloor) out += `Piano: ${asciiFold(order.deliveryFloor)}\n`;
  if (order.deliveryNotes) {
    for (const wline of wrap(`Note consegna: ${order.deliveryNotes}`, w)) out += `${wline}\n`;
  }
  if (order.customerPhone) out += `Tel: ${asciiFold(order.customerPhone)}\n`;
  out += rule(w) + "\n";

  // Comanda di variazione: niente righe piatti, solo il nuovo stato pagamento ben visibile.
  if (isUpdate) {
    out += CMD.alignCenter + CMD.sizeDouble + CMD.boldOn;
    out += asciiFold(paymentLabel(order)) + "\n";
    out += CMD.sizeNormal + CMD.boldOff + CMD.alignLeft;
    out += feed(1) + CMD.cut;
    return out;
  }

  out += CMD.boldOn + "ORDINE:\n" + CMD.boldOff;
  for (const line of order.lines ?? []) {
    out += lineBlock(line, w);
  }

  if (order.notes) {
    out += rule(w) + "\n";
    out += CMD.boldOn + "NOTE ORDINE:\n" + CMD.boldOff;
    for (const wline of wrap(order.notes, w)) out += wline + "\n";
  }

  // Riga pagamento sempre in fondo, in evidenza.
  out += rule(w) + "\n";
  out += justify("Totale:", `EUR ${Number(order.total).toFixed(2).replace(".", ",")}`, w) + "\n";
  out += CMD.boldOn + asciiFold(paymentLabel(order)) + CMD.boldOff + "\n";

  out += feed(1) + CMD.cut;
  return out;
}

export function buildTestTicketEscPos(printer: TenantPrinter): string {
  const w = printer.charWidth || 48;
  let out = CMD.init;
  out += CMD.alignCenter + CMD.sizeDouble + CMD.boldOn;
  out += "TEST STAMPA\n";
  out += CMD.sizeNormal + CMD.boldOff;
  out += CMD.alignLeft + rule(w) + "\n";
  out += `Stampante: ${asciiFold(printer.name)}\n`;
  if (printer.qzPrinterName) out += `Device: ${asciiFold(printer.qzPrinterName)}\n`;
  out += `Larghezza: ${w} caratteri\n`;
  out += justify("Riga di prova", "OK", w) + "\n";
  out += rule(w) + "\n";
  out += "Se leggi questo, la stampa funziona.\n";
  out += feed(1) + CMD.cut;
  return out;
}
