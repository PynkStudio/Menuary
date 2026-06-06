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
  /** Valuta del mercato corrente */
  currency?: string;
  /** Testo costo di attivazione, es. "da €690" */
  setup_from: string;
  /** Feature visibili sul sito (bullet list) */
  marketing_items: string[];
  /** Evidenziato nella griglia piani */
  is_featured?: boolean;
  /** Label CTA */
  cta_label?: string;
  /** Se il piano supporta l'add-on AI (default true) */
  ai_addon?: boolean;
};

export type PricingAddon = {
  slug: string;
  marketing_name: string;
  tagline: string;
  description: string;
  monthly: number;
  currency?: string;
  minPlan: string;
  setup_from?: string;
  items: string[];
  minutesNote: string;
  settings: {
    includedMinutes?: number;
    overageMode?: "cost" | "fixed";
    voiceCloning?: boolean;
    channels?: string[];
    languages?: string[];
  };
};

/** Integrazione AI: add-on disponibile dai piani Prenotazioni e Operatività */
export const AI_ADDON: PricingAddon = {
  slug: "ai-phone",
  marketing_name: "Assistente vocale AI",
  tagline: "IA al telefono · 24/7",
  monthly: 60,
  minPlan: "prenotazioni" as const,
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
  settings: {
    includedMinutes: 120,
    overageMode: "cost",
    voiceCloning: true,
    channels: ["phone"],
    languages: ["it", "en", "fr", "es", "de"],
  },
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
    ai_addon: false,
    marketing_items: [
      "Sito su misura, dominio personalizzato",
      "Multilingua incluso · IT EN FR DE ES",
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
    ai_addon: true,
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
    price_monthly: 199,
    setup_from: "da €1.990",
    ai_addon: true,
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

// ─── Piani Bizery (verticale services) ───────────────────────────────────────
// Prezzi identici a Menuary; copy adattato per studi e aziende di servizi.
// "prenotazioni" diventa "Appuntamenti" in display, slug invariato.

export const BIZERY_PRICING_PLANS: PricingPlan[] = [
  {
    slug: "presenza",
    marketing_name: "Presenza",
    tagline: "La tua attività online",
    description:
      "Per chi vuole essere trovato bene e fare una prima impressione professionale. Sito su misura, Google Maps integrato e presenza digitale gestita in un posto solo.",
    price_annual: 39,
    price_monthly: 49,
    setup_from: "da €690",
    ai_addon: false,
    marketing_items: [
      "Sito aziendale su misura, dominio personalizzato",
      "Multilingua incluso · IT EN FR DE ES",
      "Listino servizi digitale aggiornabile",
      "Recensioni Google integrate sul sito",
      "Orari, festività e info su Google Maps",
      "Hosting, SSL, backup inclusi",
      "Aggiornamenti tecnici continui",
    ],
  },
  {
    slug: "prenotazioni",
    marketing_name: "Appuntamenti",
    tagline: "Presenza + prenotazioni",
    description:
      "Tutto di Presenza più un sistema completo per raccogliere e gestire appuntamenti. Conferme automatiche, calendario, WhatsApp — senza caos.",
    price_annual: 89,
    price_monthly: 99,
    setup_from: "da €1.190",
    ai_addon: true,
    is_featured: true,
    cta_label: "Inizia con Appuntamenti",
    marketing_items: [
      "Tutto di Presenza",
      "Prenotazioni & appuntamenti online",
      "Conferme e reminder automatici via email",
      "Calendario appuntamenti",
      "Click-to-WhatsApp",
      "Pannello richieste",
    ],
  },
  {
    slug: "operativita",
    marketing_name: "Operatività",
    tagline: "Gestionale completo",
    description:
      "Per chi vuole trasformare l'azienda in un'operazione efficiente. CRM, analytics, gestione costi, multi-sede e pannello staff tutto integrato.",
    price_annual: 169,
    price_monthly: 199,
    setup_from: "da €1.990",
    ai_addon: true,
    marketing_items: [
      "Tutto di Appuntamenti",
      "CRM clienti & analytics",
      "Gestione costi e margini per servizio",
      "Multi-sede con un account",
      "Pannello staff & ruoli",
      "Dashboard operativa",
    ],
  },
];

// ─── Piani Orpheo (verticale creative) ──────────────────────────────────────
// Slug dedicati per poterli gestire da admin.menuary.it senza confliggere con
// i piani Menuary/Bizery già presenti nella tabella platform_packages.

export const ORPHEO_PRICING_PLANS: PricingPlan[] = [
  {
    slug: "orpheo-presenza",
    marketing_name: "Presenza",
    tagline: "Profilo e press kit",
    description:
      "Per artisti e professionisti creativi che vogliono una presenza ufficiale curata: sito, bio, press kit, opere principali e contatti media/booking.",
    price_annual: 49,
    price_monthly: 59,
    setup_from: "da €790",
    ai_addon: false,
    marketing_items: [
      "Sito ufficiale su misura, dominio personalizzato",
      "Bio breve/lunga, foto ufficiali e press kit",
      "Catalogo opere essenziale",
      "Link social, streaming, vendita e provider",
      "Recensioni e citazioni selezionate",
      "Hosting, SSL, backup inclusi",
    ],
  },
  {
    slug: "orpheo-pro",
    marketing_name: "Pro",
    tagline: "Presenza + opportunità",
    description:
      "Per gestire opportunità, richieste professionali, eventi e materiali promozionali in un unico pannello condiviso con manager, ufficio stampa o agente.",
    price_annual: 119,
    price_monthly: 139,
    setup_from: "da €1.490",
    ai_addon: true,
    is_featured: true,
    cta_label: "Inizia con Pro",
    marketing_items: [
      "Tutto di Presenza",
      "CRM contatti professionali e media",
      "Pipeline opportunità, booking ed eventi",
      "Asset manager per foto, video e documenti",
      "Reputation & reviews da provider rilevanti",
      "Permessi per collaboratori",
    ],
  },
  {
    slug: "orpheo-management",
    marketing_name: "Management",
    tagline: "Operatività creativa completa",
    description:
      "Per artisti strutturati, autori, musicisti, attori, registi, collettivi e team che devono coordinare opere, contratti, diritti, fanbase e analytics.",
    price_annual: 219,
    price_monthly: 249,
    setup_from: "da €2.490",
    ai_addon: true,
    marketing_items: [
      "Tutto di Pro",
      "Diritti, licenze, territori e scadenze",
      "Royalty e rendicontazioni per opera/canale",
      "Fanbase, newsletter e segmenti audience",
      "Dashboard performance opere, eventi e campagne",
      "Multi-identità, team e ruoli avanzati",
    ],
  },
];

/**
 * Sovrappone la copy Bizery sui dati di prezzo provenienti dal DB.
 * I prezzi vengono sempre dal DB; nomi, descrizioni e feature list
 * vengono dalla costante BIZERY_PRICING_PLANS.
 */
export function mergeBizeryPlans(dbPlans: PricingPlan[]): PricingPlan[] {
  return BIZERY_PRICING_PLANS.map((base) => {
    const fromDb = dbPlans.find((p) => p.slug === base.slug);
    if (!fromDb) return base;
    return {
      ...base,
      price_annual: fromDb.price_annual,
      price_monthly: fromDb.price_monthly,
      currency: fromDb.currency,
      setup_from: fromDb.setup_from,
      is_featured: fromDb.is_featured ?? base.is_featured,
    };
  });
}

export function mergeOrpheoPlans(dbPlans: PricingPlan[]): PricingPlan[] {
  return ORPHEO_PRICING_PLANS.map((base) => {
    const fromDb = dbPlans.find((p) => p.slug === base.slug);
    if (!fromDb) return base;
    return {
      ...base,
      price_annual: fromDb.price_annual,
      price_monthly: fromDb.price_monthly,
      currency: fromDb.currency,
      setup_from: fromDb.setup_from,
      is_featured: fromDb.is_featured ?? base.is_featured,
    };
  });
}
