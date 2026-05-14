/**
 * Fonte unica di verità per i piani commerciali Menuary.
 *
 * - price_annual   = canone mensile con pagamento annuale (esposto sul sito)
 * - price_monthly  = canone mensile con pagamento mensile (più alto)
 * - setup_from     = costo una tantum di attivazione (IVA esclusa)
 *
 * Tutti i prezzi sono IVA esclusa.
 * Il contratto è annuale; non è previsto il recesso anticipato.
 * È possibile cambiare piano in qualsiasi momento.
 *
 * In produzione questi dati sono gestibili dall'admin (platform_packages su Supabase).
 * Quando il collegamento DB sarà attivo, sostituire PRICING_PLANS con una fetch
 * server-side da platform_packages dove is_active = true, order by sort_order.
 */

export type PricingPlan = {
  /** Slug univoco — corrisponde a platform_packages.slug */
  slug: string;

  /** Nome commerciale esposto al cliente */
  marketing_name: string;

  /** Sottotitolo breve */
  tagline: string;

  /** Descrizione estesa per la pricing page */
  description: string;

  /** Canone mensile con pagamento annuale (IVA esclusa) */
  price_annual: number;

  /** Canone mensile con pagamento mensile (IVA esclusa) */
  price_monthly: number;

  /** Testo costo di attivazione, es. "da € 690" */
  setup_from: string;

  /** Feature visibili sul sito (bullet list) */
  marketing_items: string[];

  /** Evidenziato nella griglia piani */
  is_featured?: boolean;

  /** Label CTA */
  cta_label?: string;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    slug: "vetrina",
    marketing_name: "Vetrina",
    tagline: "Solo il sito",
    description:
      "Per chi vuole essere scelto meglio online. La forma minima: identità, menu e contatti curati.",
    price_annual: 39,
    price_monthly: 49,
    setup_from: "da € 690",
    marketing_items: [
      "Sito su misura, dominio personalizzato",
      "Menu digitale aggiornabile",
      "Recensioni, foto, orari, contatti",
      "Hosting, SSL, backup inclusi",
      "Aggiornamenti tecnici continui",
    ],
  },
  {
    slug: "operativita",
    marketing_name: "Operatività",
    tagline: "Sito + gestionale",
    description:
      "Per locali che vogliono trasformare il sito in uno strumento di lavoro. Più richieste, meno errori, margini sotto controllo.",
    price_annual: 82,
    price_monthly: 99,
    setup_from: "da € 1.490",
    marketing_items: [
      "Tutto di Vetrina",
      "Prenotazioni · ordini · delivery",
      "Magazzino con alert sotto soglia",
      "Food cost & margini in tempo reale",
      "CRM clienti e analytics",
      "Pannello staff, cucina, cassa",
    ],
    is_featured: true,
    cta_label: "Inizia con Operatività",
  },
  {
    slug: "autopilota",
    marketing_name: "Autopilota",
    tagline: "Gestionale + IA",
    description:
      "Per chi vuole un'assistente IA che risponde al telefono 24/7, gestisce prenotazioni e ordini con la voce del locale.",
    price_annual: 249,
    price_monthly: 299,
    setup_from: "da € 1.990",
    marketing_items: [
      "Tutto di Operatività",
      "IA al telefono 24/7",
      "Prenotazioni e ordini autonomi",
      "Cloning vocale opzionale",
      "Multilingua nativa (IT, EN, FR, ES, DE)",
      "Supporto prioritario dedicato",
    ],
  },
];

/** Mesi gratuiti effettivi scegliendo il piano annuale (arrotondato) */
export function freeMonths(plan: PricingPlan): number {
  const annualTotal = plan.price_annual * 12;
  const monthlyTotal = plan.price_monthly * 12;
  return Math.round((monthlyTotal - annualTotal) / plan.price_monthly);
}

/** Risparmio annuale scegliendo fatturazione annuale */
export function annualSaving(plan: PricingPlan): number {
  return (plan.price_monthly - plan.price_annual) * 12;
}
