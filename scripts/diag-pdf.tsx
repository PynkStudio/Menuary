import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { MenuaryContractPdf } from "../src/lib/contracts/menuary-contract-pdf";
import { freshContractData, normalizeContractData } from "../src/lib/contracts/menuary-contract";
import { inflateSync } from "node:zlib";

function inflate(raw: Buffer): Buffer { try { return inflateSync(raw); } catch { return raw; } }

function extractStreams(pdf: Buffer): Buffer[] {
  const out: Buffer[] = []; let pos = 0;
  while (pos < pdf.length) {
    const si1 = pdf.indexOf(Buffer.from("stream\r\n"), pos);
    const si2 = pdf.indexOf(Buffer.from("stream\n"), pos);
    let ss: number, off: number;
    if (si1 === -1 && si2 === -1) break;
    if (si1 === -1) { ss = si2; off = 7; } else if (si2 === -1) { ss = si1; off = 8; }
    else if (si1 < si2) { ss = si1; off = 8; } else { ss = si2; off = 7; }
    const ds = ss + off;
    const ei1 = pdf.indexOf(Buffer.from("\nendstream"), ds);
    const ei2 = pdf.indexOf(Buffer.from("\r\nendstream"), ds);
    let de: number;
    if (ei1 === -1 && ei2 === -1) break;
    if (ei1 === -1) de = ei2; else if (ei2 === -1) de = ei1; else de = Math.min(ei1, ei2);
    out.push(inflate(pdf.subarray(ds, de))); pos = de + 10;
  }
  return out;
}

async function main() {
  const data = normalizeContractData(freshContractData("menuary"));
  const buf = await renderToBuffer(<MenuaryContractPdf data={data} overrides={{}} />);
  const pdf = Buffer.from(buf);
  const latin = pdf.toString("latin1");

  // Conteggio reale pagine PDF
  const pageObjs = (latin.match(/\/Type\s*\/Page[^s]/g) || []).length;
  const mediaBoxes = latin.match(/\/MediaBox\s*\[[^\]]*\]/g) || [];
  console.log("=== PDF: /Type/Page objs =", pageObjs, " MediaBox count =", mediaBoxes.length);
  console.log("MediaBox sample:", mediaBoxes[0]);

  function decodeTJ(tj: string): string {
    let d = "";
    const hp = tj.match(/<([0-9a-fA-F]+)>/g);
    if (hp) for (const p of hp) { const h = p.slice(1, -1); for (let i=0;i<h.length;i+=2) d += String.fromCharCode(parseInt(h.substr(i,2),16)); }
    const pp = tj.match(/\(([^)]*)\)/g);
    if (pp) for (const p of pp) d += p.slice(1, -1);
    return d;
  }

  const streams = extractStreams(pdf);
  let textStreamIdx = 0;
  streams.forEach((s) => {
    const t = s.toString("latin1");
    const hasText = t.includes("Tj") || t.includes("TJ");
    if (!hasText) return;
    textStreamIdx++;
    const lines = t.split(/\r?\n/);
    // raccogli operatori posizionali, decodifica i TJ, segnala i marker
    const out: string[] = [];
    let markerHere = false;
    for (const line of lines) {
      const tr = line.trim();
      if (!tr) continue;
      const isPos = /\s(Tm|Td|TD|T\*|cm)$/.test(tr) || tr === "BT" || tr === "ET" || tr === "q" || tr === "Q";
      const isShow = / (TJ|Tj)$/.test(tr);
      if (isShow) {
        const dec = decodeTJ(tr);
        const m = dec.match(/XSIGN[CF]_[A-Z0-9_]+/);
        if (m) { out.push(`>>>> MARKER ${m[0]}`); markerHere = true; }
      } else if (isPos) {
        out.push(tr.slice(0, 90));
      }
    }
    if (!markerHere) return;
    if (textStreamIdx !== 2) return;
    console.log(`\n===== RAW text-stream #${textStreamIdx} (first 60 non-empty lines) =====`);
    let printed = 0;
    for (const line of lines) {
      const tr = line.trim();
      if (!tr) continue;
      const dec = / (TJ|Tj)$/.test(tr) ? decodeTJ(tr) : "";
      const tag = /XSIGN/.test(dec) ? "  <<<MARKER " + (dec.match(/XSIGN[CF]_[A-Z0-9_]+/)||[])[0] : "";
      console.log(tr.slice(0, 80) + tag);
      if (++printed > 4000) break;
    }
  });
}
main().catch((e) => { console.error(e); process.exit(1); });
