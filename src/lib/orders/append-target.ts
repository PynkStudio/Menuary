// Parser client-safe del parametro `back` usato per l'"aggiungi all'ordine":
// il checkout passa /menu?back=<url-checkout>, e menu → carrello → /ordina
// devono riconoscere l'ordine target per appendere le righe invece di crearne uno nuovo.

export type AppendTarget = {
  /** href relativo del checkout a cui tornare (path + query, es. /kimos/checkout/AB12?t=…) */
  href: string;
  /** codice ordine */
  code: string;
  /** public token dell'ordine */
  token: string;
};

export function parseAppendTarget(backParam: string | null | undefined): AppendTarget | null {
  if (!backParam) return null;
  try {
    const parsed = new URL(backParam, "https://menuary.local");
    // Accetta sia /checkout/<code> sia /<slug>/checkout/<code> (preview).
    const match = parsed.pathname.match(/\/checkout\/([^/]+)$/);
    const token = parsed.searchParams.get("t");
    if (!match?.[1] || !token) return null;
    return {
      href: `${parsed.pathname}${parsed.search}`,
      code: decodeURIComponent(match[1]),
      token,
    };
  } catch {
    return null;
  }
}
