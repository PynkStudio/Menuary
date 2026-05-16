/**
 * Fonte unica di verità per i piani commerciali Menuary.
 *
 * - price_annual   = canone mensile equivalente con pagamento annuale anticipato
 * - price_monthly  = canone mensile con fatturazione mensile (più alto)
 * - setup_from     = costo una tantum di attivazione (IVA esclusa)
 *
 * Contratto annuale con pagamento anticipato di 12 mesi.
 * Disdetta: il rinnovo automatico si può interrompere con 30 giorni di preavviso.
 *   Il contratto scade naturalmente al termine del periodo pagato.
 * Upgrade: attivo immediatamente, in qualsiasi momento.
 * Downgrade: possibile, parte dal rinnovo successivo.
 * Attivazione: sito e servizi online entro 7 giorni dalla firma del contratto.
 *
 * Tutti i prezzi sono IVA esclusa.
 *
 * In produzione questi dati sono gestibili dall'admin (platform_packages su Supabase).
 * La funzione fetchPricingPlans() in marketing-data.ts legge da Supabase con
 * fallback su PRICING_PLANS se il DB non è raggiungibile.
 *
 * Mapping DB → tipo:
 *   platform_packages.price_monthly          → PricingPlan.price_annual
 *   platform_packages.price_monthly_billing  → PricingPlan.price_monthly
 *   platform_packages.price_yearly           → solo calcolo, non esposto direttamente
 */

export type PricingPlan = {
  /** Slug univoco — corrisponde a platform_packages.slug */
  slug: string;
  /** Nome commerciale esposto al cliente */
  marketing_name: string;
  /** Sottotitolo breve */
  tagline: string;
  /** Descrizione per la pricing page */
  description: string;
  /** Canone mensile equivalente con pagamento annuale anticipato (IVA esclusa) */
  price_annual: number;
  /** Canone mensile con fatturazione mensile (IVA esclusa) */
  price_monthly: number;
  /** Testo costo di attivazione, es. "da €690" */
  setup_from: string;
  /** Feature visibili sul sito (bullet list) */
  marketing_items: string[];
  /** Evidenziato nella griglia piani */
  is_featured?: boolean;
  /** Label CTA */
  cta_label?: string;
};

/** Integrazione AI: add-on disponibile per tutti i piani */
export const AI_ADDON = {
  monthly: 60,
  description:
    "Assistente IA al telefono disponibile 24/7. Risponde con la voce e il tono del tuo locale, prende prenotazioni e le scrive in agenda, accetta ordini d'asporto, suggerisce i piatti del giorno e gestisce le richieste fuori orario.",
  items: [
    "Risponde al telefono 24/7 con la voce del locale",
    "Prenotazioni autonome direttamente in agenda",
    "Ordini d'asporto e gestione richieste fuori orario",
    "Suggerisce piatti del giorno e promozioni",
    "Cloning vocale opzionale",
    "Multilingua nativa: IT, EN, FR, ES, DE",
  ],
  minutesNote:
    "Ogni piano include una quota mensile di minuti. Superata la soglia, gli addebiti sono a prezzo di costo — senza nessun markup da parte nostra.",
} as const;

export const PRICING_PLANS: PricingPlan[] = [
  {
    slug: "presenza",
    marketing_name: "Presenza",
    tagline: "Il tuo locale online",
    description:
      "Per chi vuole essere trovato bene e presentarsi al meglio. Sito professionale, Google Maps integrato e gestione centralizzata della presenza locale.",
    price_annual: 39,
    price_monthly: 49,
    setup_from: "da €690",
    marketing_items: [
      "Sito su misura, dominio personalizzato",
      "Menu digitale aggiornabile",
      "Recensioni Google integrate sul sito",
      "Orari, festività e info su Google Maps",
      "Hosting, SSL, backup inclusi",
      "Aggiornamenti tecnici continui",
    ],
  },
  {
    slug: "prenotazioni",
    marketing_name: "Prenotazioni",
    tagline: "Presenza + prenotazioni",
    description:
      "Tutto di Presenza più un sistema completo per raccogliere e gestire prenotazioni senza caos. Conferme automatiche, calendario di sala, WhatsApp.",
    price_annual: 89,
    price_monthly: 99,
    setup_from: "da €1.190",
    marketing_items: [
      "Tutto di Presenza",
      "Prenotazioni online",
      "Conferme e reminder automatici via email",
      "Calendario di sala",
      "Click-to-WhatsApp",
      "Pannello richieste",
    ],
    is_featured: true,
    cta_label: "Inizia con Prenotazioni",
  },
  {
    slug: "operativita",
    marketing_name: "Operatività",
    tagline: "Gestionale completo",
    description:
      "Per chi vuole trasformare il locale in un'operazione efficiente. Ordini, delivery, CRM, analytics e dashboard operativa tutto integrato.",
    price_annual: 169,
    price_monthly: 299,
    setup_from: "da €1.990",
    marketing_items: [
      "Tutto di Prenotazioni",
      "Ordini sala & asporto",
      "Delivery integrato",
      "CRM clienti & analytics",
      "Dashboard operativa",
      "Gestione staff e cucina",
    ],
  },
];

/** Risparmio annuale scegliendo fatturazione annuale anticipata */
export function annualSaving(plan: PricingPlan): number {
  return (plan.price_monthly - plan.price_annual) * 12;
}
