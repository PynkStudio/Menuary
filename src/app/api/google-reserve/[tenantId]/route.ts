// TODO(google-reserve): questo file è il punto di ingresso per le chiamate
// di Google Actions Center (Maps Booking API) sul singolo tenant.
//
// Una volta approvati come partner, Google chiamerà questi endpoint:
//
//   GET  /api/google-reserve/[tenantId]/availability
//        → restituisce gli slot prenotabili nel formato AvailabilityFeed.
//          Usare `getAvailableSlots()` da engine.ts (da implementare).
//
//   POST /api/google-reserve/[tenantId]/booking
//        → crea una prenotazione ricevuta da Google. Usare `buildBookingFromGooglePayload()`
//          (da implementare in engine.ts) + la logica INSERT già presente nel POST di
//          /api/tenant/[tenantId]/reservations/route.ts, con channel: "google_reserve".
//
//   PATCH /api/google-reserve/[tenantId]/booking/[bookingId]
//        → aggiorna o cancella una prenotazione Google. Sincronizzare lo status
//          con la tabella reservation_requests (campo status → "rejected" per cancellazioni).
//
// Autenticazione: Google firma le richieste con un JWT (Bearer token).
// Verificare con la chiave pubblica Google prima di processare qualsiasi payload.
// Ref: https://developers.google.com/maps-booking/reference/rest/v1/bookings
//
// Tutti gli endpoint devono rispondere entro 5s (SLA Google Actions Center).

export {};
