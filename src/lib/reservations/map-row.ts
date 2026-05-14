import type { Reservation, ReservationStatus } from "@/store/restaurant-services-store";

export type ReservationRequestRow = {
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_phone: string;
  covers: number;
  reservation_date: string;
  reservation_time: string;
  notes: string | null;
  status: string;
  table_id: string | null;
  assigned_area: string | null;
};

function mapStatus(status: string): ReservationStatus {
  switch (status) {
    case "confirmed":
    case "confermata":
      return "confermata";
    case "seated":
    case "seduta":
      return "seduta";
    case "no_show":
      return "no_show";
    case "rejected":
      return "rejected";
    case "pending_manual":
    case "auto_proposed":
      return "nuova";
    default:
      return "nuova";
  }
}

export function mapReservationRequestRow(row: ReservationRequestRow): Reservation {
  return {
    id: row.id,
    customer: row.customer_name,
    phone: row.customer_phone,
    covers: row.covers,
    date: row.reservation_date,
    time: row.reservation_time,
    tableLabel: row.table_id ?? row.assigned_area ?? "",
    notes: row.notes ?? undefined,
    status: mapStatus(row.status),
  };
}
