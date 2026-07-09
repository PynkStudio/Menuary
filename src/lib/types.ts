import type {
  MenuItem,
  MenuCategory,
  MenuAvailability,
  PriceFormat,
  MenuTag,
  MenuBundleSlot,
  MenuVariantGroup,
  MenuAllergen,
  MenuServiceNoteKey,
  PiccanteLevel,
  MenuIngredient,
} from "./menu-data";

export type {
  MenuItem,
  MenuCategory,
  MenuAvailability,
  PriceFormat,
  MenuTag,
  MenuBundleSlot,
  MenuVariantGroup,
  MenuAllergen,
  MenuServiceNoteKey,
  PiccanteLevel,
  MenuIngredient,
};

export type BundlePick = {
  slotId: string;
  slotLabel: string;
  choiceItemId: string;
  choiceName: string;
};

export type VariantSelection = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
};

export type Extra = {
  id: string;
  name: string;
  price: number;
};

export type AdminMenuItem = MenuItem & {
  categoryId: string;
  order: number;
  available: boolean;
  ingredients?: MenuIngredient[];
  extras?: Extra[];
};

export type TenantMenuTagDefinition = {
  id: string;
  label: string;
};

export type { ExtraList } from "./extra-lists";

export type AdminMenuCategory = Omit<MenuCategory, "items"> & {
  order: number;
};

export type MenuDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type MenuOrderChannel =
  | "site"
  | "phone"
  | "whatsapp"
  | "online"
  | "table"
  | "product_reservation";

export type AdminMenuListVisibility = {
  /** Giorni locali: 0 domenica, 1 lunedi, ... 6 sabato. Vuoto = tutti i giorni. */
  days?: MenuDay[];
  /** HH:mm locale. Vuoto = nessun limite di inizio. */
  startTime?: string;
  /** HH:mm locale. Vuoto = nessun limite di fine. Supporta fasce che passano mezzanotte. */
  endTime?: string;
  /** Tavoli abilitati. Vuoto = tutti i tavoli. */
  tableIds?: string[];
  /** Canali/punti di esposizione abilitati. Assente = tutti i canali per compatibilita con i menu esistenti. */
  channels?: MenuOrderChannel[];
};

export type AdminMenuList = {
  id: string;
  name: string;
  description?: string;
  order: number;
  enabled: boolean;
  itemIds: string[];
  visibility: AdminMenuListVisibility;
};

export type OrderType = "tavolo" | "asporto";

/** Modalità di servizio per ordini senza tavolo numerato.
 *  - `dine_in`: il cliente consuma in loco (vassoio).
 *  - `takeaway`: il cliente ritira al bancone (sacchetto).
 *  - `delivery`: consegna a domicilio. */
export type OrderDineOption = "dine_in" | "takeaway" | "delivery";

export type OrderStatus =
  | "pending_confirmation"
  | "expired"
  | "nuovo"
  | "in_preparazione"
  | "pronto"
  | "in_consegna"
  | "consegnato"
  | "annullato";

export type OrderLine = {
  itemId: string;
  /** Categoria menu (ordine su display cucina). */
  categoryId?: string;
  name: string;
  qty: number;
  variantLabel?: string;
  unitPrice: number;
  lineTotal: number;
  removedIngredients?: string[];
  addedExtras?: Array<{ id: string; name: string; price: number }>;
  variantSelections?: VariantSelection[];
  note?: string;
  bundlePicks?: BundlePick[];
  /** Todo cucina: la riga è stata preparata. Toggle dal KDS. */
  prepared?: boolean;
};

export type Order = {
  id: string;
  code: string;
  createdAt: string;
  type: OrderType;
  table?: number;
  tableLabel?: string;
  sessionId?: string;
  sessionCode?: string;
  dinerClientId?: string;
  dinerNickname?: string;
  customerName?: string;
  customerEmail?: string;
  pickupTime?: string;
  notes?: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  /** Solo per ordini senza tavolo numerato. */
  dineOption?: OrderDineOption;
  /** Timestamp ISO. Se status === "pending_confirmation", scadenza attesa cliente. */
  confirmationExpiresAt?: string;
  confirmedAt?: string;
  /** true se passato auto-accept senza intervento staff. */
  autoAccepted?: boolean;
  /** Metodo di pagamento scelto (telefono/checkout). */
  paymentMethod?: PaymentMethod;
  /** Stato pagamento DB: "pending" | "paid" | "not_required" | "failed" | "expired". */
  paymentStatus?: string;
};

/**
 * Metodo di pagamento dell'ordine:
 *  - online            → paga adesso con carta (Stripe); ordine confermato al pagamento.
 *  - on_delivery_cash  → paga alla consegna in contanti.
 *  - on_delivery_card  → paga alla consegna con carta (POS).
 */
export type PaymentMethod = "online" | "on_delivery_cash" | "on_delivery_card";

export type TenantOrderSettings = {
  id: string;
  tenantId: string;
  locationId: string | null;
  takeawayEnabled: boolean;
  dineInEnabled: boolean;
  deliveryEnabled: boolean;
  takeawayWindowBeforeOpenMin: number | null;
  takeawayWindowBeforeCloseMin: number | null;
  dineInWindowBeforeOpenMin: number | null;
  dineInWindowBeforeCloseMin: number | null;
  deliveryWindowBeforeOpenMin: number | null;
  deliveryWindowBeforeCloseMin: number | null;
  autoAcceptEnabled: boolean;
  autoAcceptMaxTotal: number | null;
  autoAcceptMaxItems: number | null;
  autoAcceptOnlyReturning: boolean;
  autoAcceptNoNotes: boolean;
  autoAcceptMinNoticeMinutes: number | null;
  pendingTimeoutSeconds: number;
  /** Tempo medio di gestione ordine (min): la prima consegna possibile è adesso + questo. */
  avgHandlingMinutes: number;
};

// ─── Stampanti comande (modulo printStations) ───────────────────────────────
// Ponte verso la stampante: QZ Tray locale sul PC cassa (vedi lib/printing).
// Schema predisposto multi-stampante (station/categories) ma la UI gestisce
// una sola stampante per locale. TODO(multi-printer).
export type PrinterConnection = "qz" | "network_eposprint" | "printnode" | "sunmi_cloud" | "sunmi_pos";
export type PrinterStation = "cucina" | "bar" | "pizzeria" | "banco";

export type TenantPrinter = {
  id: string;
  tenantId: string;
  locationId: string | null;
  name: string;
  connection: PrinterConnection;
  /** Nome stampante come visto da QZ Tray sull'OS (es. "EPSON TM-T20III"). */
  qzPrinterName: string | null;
  /** Numero di serie del device cloud (es. SUNMI SN). Per QZ resta null. */
  deviceSn: string | null;
  /** TODO(multi-printer): routing per reparto. null = stampa tutto. */
  station: PrinterStation | null;
  /** TODO(multi-printer): routing per categorie menu. null/[] = nessun filtro. */
  categories: string[] | null;
  /** Caratteri per riga: 48 = 80mm, 32 = 58mm. */
  charWidth: number;
  copies: number;
  autoPrint: boolean;
  isDefault: boolean;
  enabled: boolean;
};

export type Table = {
  id: string;
  label: string;
  seats?: number;
  createdAt: number;
};

export type SessionDiner = {
  clientId: string;
  nickname: string;
  joinedAt: number;
};

export type TableSession = {
  id: string;
  tableId: string;
  code: string;
  status: "aperta" | "chiusa";
  openedAt: number;
  closedAt?: number;
  /** Coperti dichiarati allo staff in apertura sessione (QR usa posti tavolo). */
  declaredCovers?: number;
  diners: SessionDiner[];
};

export type CartLine = {
  lineId: string;
  itemId: string;
  /** Allineato alla categoria prodotto in menu. */
  categoryId?: string;
  name: string;
  qty: number;
  variantKey?: string;
  variantLabel?: string;
  basePrice: number;
  unitPrice: number;
  removedIngredients?: string[];
  addedExtras?: Array<{ id: string; name: string; price: number }>;
  variantSelections?: VariantSelection[];
  note?: string;
  bundlePicks?: BundlePick[];
};
