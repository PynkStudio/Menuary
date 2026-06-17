import "server-only";

// L'agente vocale (Retell TTS) storpia numeri letti come cifre grezze: codici
// ordine ("R-1023") e prezzi ("€12,50") vengono pronunciati male. Qui generiamo
// versioni "parlate" in italiano da passare all'agente come variabili dedicate,
// così la pronuncia non dipende dall'LLM.

const UNITS = [
  "zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove",
  "dieci", "undici", "dodici", "tredici", "quattordici", "quindici", "sedici",
  "diciassette", "diciotto", "diciannove",
];

const TENS = ["", "", "venti", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta"];

function below100(n: number): string {
  if (n < 20) return UNITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  // Elisione vocale davanti a "uno"/"otto": venti+uno=ventuno, trenta+otto=trentotto.
  const tens = u === 1 || u === 8 ? TENS[t].slice(0, -1) : TENS[t];
  const unit = u === 3 ? "tré" : UNITS[u];
  return tens + (u ? unit : "");
}

function below1000(n: number): string {
  if (n < 100) return below100(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  const hundreds = h === 1 ? "cento" : `${UNITS[h]}cento`;
  return hundreds + (r ? below100(r) : "");
}

export function integerToItalianWords(n: number): string {
  const value = Math.abs(Math.trunc(n));
  if (value === 0) return "zero";
  if (value < 1000) return below1000(value);
  const th = Math.floor(value / 1000);
  const r = value % 1000;
  const thousands = th === 1 ? "mille" : `${below1000(th)}mila`;
  return thousands + (r ? below1000(r) : "");
}

/** Prezzo in euro → parole, es. 12.5 → "dodici euro e cinquanta". */
export function euroToItalianWords(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const euros = Math.floor(safe);
  const cents = Math.round((safe - euros) * 100);
  const base = `${integerToItalianWords(euros)} euro`;
  return cents === 0 ? base : `${base} e ${integerToItalianWords(cents)}`;
}

/**
 * Codice ordine → lettura cifra per cifra, la più chiara al telefono.
 * "R-1023" → "R uno zero due tre". Le lettere restano invariate, i separatori
 * vengono rimossi.
 */
export function orderCodeToSpoken(code: string): string {
  return code
    .split("")
    .map((ch) => {
      if (ch >= "0" && ch <= "9") return UNITS[Number(ch)];
      if (ch === "-" || ch === " " || ch === "_") return null;
      return ch;
    })
    .filter(Boolean)
    .join(" ");
}
