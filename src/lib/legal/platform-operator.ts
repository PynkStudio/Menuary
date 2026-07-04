/**
 * Identità legale dell'operatore dei siti di piattaforma (Menuary, Bizery,
 * Orpheo) e del tenant PynkStudio — oggi ditta individuale, in futuro SRL.
 * I tenant clienti restano titolari dei propri dati con la propria ragione
 * sociale: questa costante NON va usata come fallback per i loro siti.
 */
export const PLATFORM_OPERATOR = {
  legalName: "Pernozzoli Massimo",
  address: "Via Gino Severini, 1 — Milano (MI)",
  piva: "13577530960",
  pec: "massimo.pernozzoli@widipec.it",
} as const;
