import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioVideocallPage, type PynkVideocallState } from "@/components/tenants/pynkstudio/pages/videocall";
import { getAgenda, PYNK_AGENDA_SCOPE, pynkGuestCookieName, pynkSlotLabel } from "@/lib/agenda-runtime";

export const dynamic = "force-dynamic";

// Link personale dell'ospite: mai indicizzato, mai in sitemap.
export const metadata: Metadata = {
  title: { absolute: "Videocall — PYNK STUDIO" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function VideocallRoute({
  params,
  searchParams,
}: {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  await requirePynkstudioTenant();
  const [{ bookingId }, { t: tokenInUrl }] = await Promise.all([params, searchParams]);
  // Un token nell'URL della pagina finirebbe nei tracker: passa da /accedi.
  if (tokenInUrl) redirect(`/it/videocall/${encodeURIComponent(bookingId)}/accedi?t=${encodeURIComponent(tokenInUrl)}`);
  const t = (await cookies()).get(pynkGuestCookieName(bookingId))?.value;

  const agenda = getAgenda();
  let state: PynkVideocallState = { kind: "invalid" };
  if (t && agenda.verifyManageToken(bookingId, t)) {
    const booking = await agenda.getBooking(bookingId);
    if (booking && booking.scope === PYNK_AGENDA_SCOPE) {
      if (booking.status === "cancelled") state = { kind: "cancelled" };
      else if (booking.location !== "video") state = { kind: "not_video" };
      else
        state = {
          kind: "ready",
          bookingId,
          token: t,
          name: booking.name,
          slotLabel: pynkSlotLabel(booking),
          topic: booking.topic,
        };
    }
  }

  return <PynkStudioVideocallPage state={state} />;
}
