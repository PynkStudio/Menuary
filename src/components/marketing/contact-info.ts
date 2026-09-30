export const MENUARY_EMAIL = "hello@menuary.it";
export const MENUARY_PHONE_DISPLAY = "+39 351 3768607";
export const MENUARY_PHONE_E164 = "+393513768607";
export const MENUARY_WHATSAPP_NUMBER = "393513768607";

/** Il prefisso [menuary] fa riconoscere in chat che il contatto arriva dal sito food. */
export function menuaryWhatsAppUrl(message: string): string {
  return `https://wa.me/${MENUARY_WHATSAPP_NUMBER}?text=${encodeURIComponent(`[menuary] ${message}`)}`;
}
