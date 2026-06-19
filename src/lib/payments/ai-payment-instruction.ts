import "server-only";

import type { AiPaymentMethodsPolicy } from "@/lib/retell/settings";

// Costruisce la frase operativa che inietteremo nel prompt Retell (e WA) come
// dynamic variable `payment_instruction`. La logica combina:
//   - feature flag tenant `payments`
//   - stato Stripe Connect (chargesEnabled)
//   - policy scelta dal tenant in impostazioni AI (online_only|on_site_only|both)
// e produce una sola frase chiara da dire al cliente.

export type BuildPaymentInstructionInput = {
  /** Tenant ha il modulo Stripe attivo nei feature flag. */
  paymentsModuleEnabled: boolean;
  /** Account Stripe collegato e con incassi attivi. */
  stripeReady: boolean;
  /** Policy scelta dal tenant nelle impostazioni AI. */
  policy: AiPaymentMethodsPolicy;
  /** Vertical del tenant: cambia "consegna/ritiro" vs "appuntamento". */
  vertical: "food" | "services";
};

/** Risultato esposto sia come stringa (per il prompt) sia come flag strutturati. */
export type AiPaymentInstruction = {
  /** Frase pronta da iniettare in `dynamic_variables.payment_instruction`. */
  text: string;
  /** Online effettivamente disponibile (cliente può scegliere). */
  onlineAvailable: boolean;
  /** Sul posto/alla consegna disponibile. */
  onSiteAvailable: boolean;
  /** L'agente deve esplicitamente chiedere quale metodo preferisce. */
  shouldAsk: boolean;
};

export function buildAiPaymentInstruction(
  input: BuildPaymentInstructionInput,
): AiPaymentInstruction {
  const effectiveOnline =
    input.paymentsModuleEnabled && input.stripeReady && input.policy !== "on_site_only";

  return {
    text: `Non proporre spontaneamente il metodo di pagamento e non chiedere come il cliente vuole pagare. Se il cliente chiede come pagare, rispondi che ricevera un link su WhatsApp dove trovera tutte le istruzioni per il pagamento. Dopo la conferma dell'ordine di solo che arrivera un messaggio su WhatsApp con il link.`,
    onlineAvailable: effectiveOnline,
    onSiteAvailable: input.policy !== "online_only" || !effectiveOnline,
    shouldAsk: false,
  };
}
