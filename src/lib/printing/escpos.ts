// Costruzione di comande in ESC/POS (testo + comandi di controllo) come stringa
// "latin1" da inviare a QZ Tray con format 'plain'. Nessuna dipendenza: ESC/POS
// è universale tra le stampanti termiche da scontrino/comanda.
//
// Gli accenti italiani vengono "ripiegati" in ASCII (è→e, à→a, …): le code-page
// ESC/POS variano per modello e una comanda di cucina resta leggibile in ASCII.
// TODO(codepage): selezionare CP858/CP1252 per stampare gli accenti reali quando
// si conosce il modello della stampante.

const ESC = "\x1b";
const GS = "\x1d";

export const CMD = {
  init: `${ESC}@`,
  boldOn: `${ESC}E\x01`,
  boldOff: `${ESC}E\x00`,
  alignLeft: `${ESC}a\x00`,
  alignCenter: `${ESC}a\x01`,
  alignRight: `${ESC}a\x02`,
  sizeNormal: `${GS}!\x00`,
  sizeDoubleHeight: `${GS}!\x01`,
  sizeDoubleWidth: `${GS}!\x10`,
  sizeDouble: `${GS}!\x11`,
  cut: `${GS}V\x00`,
  partialCut: `${GS}V\x01`,
} as const;

export function feed(lines = 1): string {
  return `${ESC}d${String.fromCharCode(Math.max(0, Math.min(255, lines)))}`;
}

const ACCENT_MAP: Record<string, string> = {
  à: "a", á: "a", â: "a", ä: "a",
  è: "e", é: "e", ê: "e", ë: "e",
  ì: "i", í: "i", î: "i", ï: "i",
  ò: "o", ó: "o", ô: "o", ö: "o",
  ù: "u", ú: "u", û: "u", ü: "u",
  ç: "c", ñ: "n",
  À: "A", È: "E", É: "E", Ì: "I", Ò: "O", Ù: "U",
  "€": "EUR", "“": '"', "”": '"', "’": "'", "‘": "'", "–": "-", "—": "-",
};

export function asciiFold(input: string): string {
  return input.replace(/[^\x00-\x7f]/g, (ch) => ACCENT_MAP[ch] ?? "?");
}

/** Riga "etichetta .... valore" giustificata alla larghezza data. */
export function justify(left: string, right: string, width: number): string {
  const l = asciiFold(left);
  const r = asciiFold(right);
  const gap = width - l.length - r.length;
  if (gap <= 1) return `${l} ${r}`;
  return `${l}${" ".repeat(gap)}${r}`;
}

/** Manda a capo un testo lungo rispettando la larghezza in caratteri. */
export function wrap(text: string, width: number): string[] {
  const words = asciiFold(text).split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    if (line.length + (line ? 1 : 0) + w.length > width) {
      if (line) out.push(line);
      line = w.length > width ? w.slice(0, width) : w;
    } else {
      line = line ? `${line} ${w}` : w;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [""];
}

/** Riga di separazione (trattini) a tutta larghezza. */
export function rule(width: number): string {
  return "-".repeat(width);
}
