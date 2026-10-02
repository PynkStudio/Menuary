import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PynkAgendaCall } from "@/components/admin-pynkstudio/pynk-agenda-call";
import { getAgenda, getPynkStaffIdentity, PYNK_AGENDA_SCOPE, pynkSlotLabel } from "@/lib/agenda-runtime";

export const metadata: Metadata = {
  title: "Videocall · PynkStudio Admin",
};

export const dynamic = "force-dynamic";

// L'accesso è già protetto dal middleware admin; il token LiveKit lo rilascia
// comunque solo a un siteadmin abilitato (authorizeHost in agenda-runtime).
export default async function PynkAdminAgendaCallPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const agenda = getAgenda();
  const [booking, staff] = await Promise.all([agenda.getBooking(bookingId), getPynkStaffIdentity()]);
  if (!booking || booking.scope !== PYNK_AGENDA_SCOPE || !staff) notFound();
  return (
    <PynkAgendaCall
      bookingId={booking.id}
      guestName={agenda.guestDisplayName(booking)}
      staffName={staff.name}
      topic={booking.topic}
      slotLabel={pynkSlotLabel(booking)}
      email={booking.email}
      phone={booking.phone}
      isVideo={booking.location === "video"}
      status={booking.status}
    />
  );
}
