import type { AgendaVideoCallLabels } from "@pynkstudio/agendaapp/video/react";
import type { PynkCopy } from "@/lib/pynkstudio-i18n";

// Le etichette con formattazione (orari, nomi) sono funzioni nel pacchetto:
// qui le si costruisce a partire dalle stringhe del copy.
export function pynkVideoLabels(c: PynkCopy["videocallPage"]["labels"]): Partial<AgendaVideoCallLabels> {
  const { tooEarlyLead, tooEarlyTail, presentingSuffix, ...plain } = c;
  return {
    ...plain,
    presenting: (name) => `${name} ${presentingSuffix}`,
    tooEarly: (opensAt) =>
      `${tooEarlyLead} ${new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" }).format(opensAt)}${tooEarlyTail}`,
  };
}
