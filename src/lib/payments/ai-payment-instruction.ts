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
      text: `Pagamento solo online. Conferma l'ordine al cliente e informa che riceverà via messaggio il link per completare il pagamento; l'ordine è confermato dopo il pagamento. Non offrire il pagamento ${word}.`,
      onlineAvailable: true,
      onSiteAvailable: false,
      shouldAsk: false,
    };
  }

  // Caso 3: entrambi → non chiedere, manda il riepilogo. Il cliente potrà scegliere sul link.
  return {
    text: `Non chiedere mai al cliente come preferisce pagare. Dopo la conferma dell'ordine, comunica solo il riepilogo e informa che riceverà un messaggio WhatsApp con il link al riepilogo dell'ordine.`,
    onlineAvailable: true,
    onSiteAvailable: true,
    shouldAsk: false,
  };
}
