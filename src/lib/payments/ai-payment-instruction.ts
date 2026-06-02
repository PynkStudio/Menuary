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

function deliveryWord(vertical: "food" | "services"): string {
  return vertical === "services" ? "al momento dell'appuntamento" : "al ritiro o alla consegna";
}

export function buildAiPaymentInstruction(
  input: BuildPaymentInstructionInput,
): AiPaymentInstruction {
  const effectiveOnline =
    input.paymentsModuleEnabled && input.stripeReady && input.policy !== "on_site_only";
  const effectiveOnSite = input.policy !== "online_only" || !effectiveOnline;
  const word = deliveryWord(input.vertical);

  // Caso 1: online non realmente disponibile → comunica pagamento sul posto.
  if (!effectiveOnline) {
    return {
      text: `Pagamento ${word}. Conferma al cliente che riceverà un riepilogo dell'ordine via messaggio e che il pagamento avverrà ${word}; non proporre il pagamento online.`,
      onlineAvailable: false,
      onSiteAvailable: true,
      shouldAsk: false,
    };
  }

  // Caso 2: solo online.
  if (input.policy === "online_only") {
    return {
      text: `Pagamento solo online. Informa il cliente che riceverà via messaggio il riepilogo dell'ordine con il link di pagamento sicuro; l'ordine sarà confermato dopo il pagamento. Non offrire il pagamento ${word}.`,
      onlineAvailable: true,
      onSiteAvailable: false,
      shouldAsk: false,
    };
  }

  // Caso 3: entrambi → chiedi la preferenza.
  return {
    text: `Chiedi al cliente se preferisce pagare online (riceverà il link via messaggio) oppure ${word}. In entrambi i casi gli verrà inviato il riepilogo dell'ordine via messaggio.`,
    onlineAvailable: true,
    onSiteAvailable: true,
    shouldAsk: true,
  };
}
