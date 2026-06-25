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
function paymentLabel(order: Order): string {
  const paid = order.paymentStatus === "paid";
  if (order.paymentMethod === "on_delivery_cash") return paid ? "PAGATO · CONTANTI" : "NON PAGATO · CONTANTI";
  if (order.paymentMethod === "on_delivery_card") return paid ? "PAGATO · CARTA" : "NON PAGATO · CARTA";
  if (order.paymentMethod === "online") return paid ? "PAGATO · CARTA" : "NON PAGATO · CARTA (online)";
  // Metodo non specificato: ci basiamo sul solo stato.
  return paid ? "PAGATO" : "NON PAGATO";
}

function lineBlock(line: OrderLine, width: number): string {
  const head = `${line.qty}x ${line.name}${line.variantLabel ? ` (${line.variantLabel})` : ""}`;
  const parts: string[] = [CMD.boldOn + asciiFold(head) + CMD.boldOff + "\n"];

  for (const extra of line.addedExtras ?? []) {
    parts.push(`  + ${asciiFold(extra.name)}\n`);
  }
  // removedIngredients sono id: senza il menu non risolviamo i nomi qui.
  // TODO(comanda): risolvere i nomi degli ingredienti rimossi col menu del tenant.
  if ((line.removedIngredients ?? []).length > 0) {
    parts.push(`  - senza: ${line.removedIngredients!.length} ingred.\n`);
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
    ? createdAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
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
  out += asciiFold(originLabel(order)) + "\n";
  out += CMD.sizeNormal + CMD.boldOff;
  out += CMD.alignLeft;
  out += justify(`#${asciiFold(order.code ?? "")}`, time, w) + "\n";
  if (order.customerName) out += asciiFold(order.customerName) + "\n";
  if (order.pickupTime) out += `Ritiro: ${asciiFold(order.pickupTime)}\n`;
  out += rule(w) + "\n";

  // Comanda di variazione: niente righe piatti, solo il nuovo stato pagamento ben visibile.
  if (isUpdate) {
    out += CMD.alignCenter + CMD.sizeDouble + CMD.boldOn;
    out += asciiFold(paymentLabel(order)) + "\n";
    out += CMD.sizeNormal + CMD.boldOff + CMD.alignLeft;
    out += feed(1) + CMD.cut;
    return out;
  }

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
