// TODO(google-reserve): aggiungere `getAvailableSlots(tenantId, date, covers)` che restituisce
// gli slot disponibili nel formato Maps Booking API (AvailabilityFeed).
// Questa funzione verrà chiamata dal nuovo endpoint `/api/google-reserve/[tenantId]/availability`
// che Google interroga periodicamente per aggiornare i blocchi prenotabili su Maps.
// Ref: https://developers.google.com/maps-booking/reference/rest/v1/availabilities

// TODO(google-reserve): aggiungere `buildBookingFromGooglePayload(payload)` che normalizza
// il body della richiesta Google (CreateBookingRequest) nel formato interno CreateBody,
// così da poter riusare tutta la logica di assegnazione tavolo già presente nel POST route.

/** Parole chiave che forzano approvazione manuale (prenotazioni). */
const SPECIAL_KEYWORDS =
  /\b(esterno|terrazzo|dehor|vista mare|vista|bambini|seggiolone|compleanno|privat|sala separata|accessibilit[aà]|carrozzina)\b/i;

export function reservationNeedsManualApproval(notes: string, tags: string[]): boolean {
  if (tags.length > 0) return true;
  return SPECIAL_KEYWORDS.test(notes.trim());
}

export type TableForPlanner = {
  id: string;
  label: string;
  seats: number | null;
  area: string;
};

export type ReservationSlot = {
  tableId: string | null;
  covers: number;
  reservationDate: string;
  reservationTime: string;
  status: string;
};

/**
 * Assegna un tavolo: capacità >= coperti, preferenza "riempi una sala" (area con più coperti già assegnati).
 */
export function suggestTableForReservation(
  tables: TableForPlanner[],
  existing: ReservationSlot[],
  covers: number,
): { tableId: string | null; assignedArea: string | null } {
  const minSeats = Math.max(1, covers);
  const candidates = tables.filter((t) => (t.seats ?? 0) >= minSeats);
  if (candidates.length === 0) return { tableId: null, assignedArea: null };

  const loadByArea = new Map<string, number>();
  for (const r of existing) {
    if (!r.tableId || r.status === "rejected" || r.status === "no_show") continue;
    const table = tables.find((t) => t.id === r.tableId);
    const area = table?.area ?? "Sala";
    loadByArea.set(area, (loadByArea.get(area) ?? 0) + r.covers);
  }

  candidates.sort((a, b) => {
    const la = loadByArea.get(a.area) ?? 0;
    const lb = loadByArea.get(b.area) ?? 0;
    if (lb !== la) return lb - la;
    return (b.seats ?? 0) - (a.seats ?? 0);
  });

  const pick = candidates[0];
  return { tableId: pick.id, assignedArea: pick.area };
}
