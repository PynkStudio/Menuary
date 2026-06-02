export function GET() {
  const vcard = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "FN:Massimo Pernozzoli",
    "N:Pernozzoli;Massimo;;;",
    "TITLE:Direttore Tecnico",
    "ORG:Bizery",
    "TEL;TYPE=CELL:+393513768607",
    "EMAIL:massimo@menuary.it",
    "URL:https://bizery.it",
    "END:VCARD",
  ].join("\r\n");

  return new Response(vcard, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": 'attachment; filename="massimo-pernozzoli.vcf"',
    },
  });
}
