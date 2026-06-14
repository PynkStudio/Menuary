import "server-only";

import { timingSafeEqual } from "node:crypto";
import { inflateSync } from "node:zlib";
const BASE_URL = process.env.DOCUMENSO_API_URL ?? "https://app.documenso.com/api/v2";

function apiToken(): string {
  const token = process.env.DOCUMENSO_API_TOKEN;
  if (!token) throw new Error("DOCUMENSO_API_TOKEN non configurato");
  return token;
}

async function request<T>(
  path: string,
  opts: { method?: string; body?: unknown; formData?: FormData } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken()}`,
  };
  let body: BodyInit | undefined;

  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method ?? (body ? "POST" : "GET"),
    headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Documenso ${res.status}: ${text}`);
  }

  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  return res as unknown as T;
}

// ─── Create envelope ────────────────────────────────────────────────────────

export type DocumensoField = {
  type: "SIGNATURE" | "DATE";
  page: number;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  identifier: number;
};

export type EnvelopeRecipient = {
  email: string;
  name: string;
  role: "SIGNER";
  signingOrder: number;
  fields: DocumensoField[];
};

export type CreateEnvelopeInput = {
  title: string;
  pdfBuffer: Buffer;
  pdfFileName: string;
  recipients: EnvelopeRecipient[];
  externalId?: string;
  subject?: string;
  message?: string;
};

export type CreateEnvelopeResult = {
  envelopeId: string;
};

// ─── PDF marker parser ─────────────────────────────────────────────────────
// I marker XSIGNC_...X sono inseriti nel PDF da menuary-contract-pdf.tsx
// come testo invisibile (1pt, bianco, opacity 0). Il parser li trova nei
// content stream decompressi decodificando gli hex string dei TJ operator
// e ne estrae pagina + coordinate.

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARKER_RE = /XSIGN[CF]_[A-Z0-9_]+X/;

type MarkerHit = {
  marker: string;
  page: number;
  xPt: number;
  yPt: number;
};

export function countPdfPages(buffer: Buffer): number {
  const str = buffer.toString("latin1");
  const match = str.match(/\/Count\s+(\d+)/);
  return match ? Math.max(1, parseInt(match[1], 10)) : 1;
}

function decodeHexString(hex: string): string {
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    result += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return result;
}

function decodeTJText(tjLine: string): string {
  let decoded = "";
  const hexParts = tjLine.match(/<([0-9a-fA-F]+)>/g);
  if (hexParts) {
    for (const part of hexParts) {
      const hex = part.slice(1, -1);
      decoded += decodeHexString(hex);
    }
  }
  const parenParts = tjLine.match(/\(([^)]*)\)/g);
  if (parenParts) {
    for (const part of parenParts) {
      decoded += part.slice(1, -1);
    }
  }
  return decoded;
}

function inflateStream(raw: Buffer): Buffer {
  try {
    return inflateSync(raw);
  } catch {
    return raw;
  }
}

function extractStreams(pdf: Buffer): Buffer[] {
  const streams: Buffer[] = [];
  let pos = 0;

  while (pos < pdf.length) {
    const si1 = pdf.indexOf(Buffer.from("stream\r\n"), pos);
    const si2 = pdf.indexOf(Buffer.from("stream\n"), pos);
    let streamStart: number;
    let offset: number;
    if (si1 === -1 && si2 === -1) break;
    if (si1 === -1) { streamStart = si2; offset = 7; }
    else if (si2 === -1) { streamStart = si1; offset = 8; }
    else if (si1 < si2) { streamStart = si1; offset = 8; }
    else { streamStart = si2; offset = 7; }

    const dataStart = streamStart + offset;
    const ei1 = pdf.indexOf(Buffer.from("\nendstream"), dataStart);
    const ei2 = pdf.indexOf(Buffer.from("\r\nendstream"), dataStart);
    let dataEnd: number;
    if (ei1 === -1 && ei2 === -1) break;
    if (ei1 === -1) dataEnd = ei2;
    else if (ei2 === -1) dataEnd = ei1;
    else dataEnd = Math.min(ei1, ei2);

    streams.push(inflateStream(pdf.subarray(dataStart, dataEnd)));
    pos = dataEnd + 10;
  }
  return streams;
}

// Matrice affine 2D: [a, b, c, d, tx, ty]
type M = [number, number, number, number, number, number];
const IDENTITY: M = [1, 0, 0, 1, 0, 0];

function mulMatrix(m1: M, m2: M): M {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function transformPoint(m: M, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function findMarkersInPdf(pdfBuffer: Buffer): MarkerHit[] {
  const streams = extractStreams(pdfBuffer);
  const hits: MarkerHit[] = [];
  let pageNumber = 0;

  for (const stream of streams) {
    const text = stream.toString("latin1");
    if (!text.includes("Tj") && !text.includes("TJ")) continue;

    pageNumber++;

    let ctm: M = [...IDENTITY];
    const ctmStack: M[] = [];
    let lastTmTx = 0;
    let lastTmTy = 0;

    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === "q") {
        ctmStack.push([...ctm]);
        continue;
      }
      if (trimmed === "Q") {
        if (ctmStack.length > 0) ctm = ctmStack.pop()!;
        continue;
      }

      // cm: "a b c d tx ty cm" — CTM' = cm_matrix × CTM
      const cmMatch = trimmed.match(
        /^(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+cm$/,
      );
      if (cmMatch) {
        const cm: M = [
          parseFloat(cmMatch[1]), parseFloat(cmMatch[2]),
          parseFloat(cmMatch[3]), parseFloat(cmMatch[4]),
          parseFloat(cmMatch[5]), parseFloat(cmMatch[6]),
        ];
        ctm = mulMatrix(cm, ctm);
        continue;
      }

      // Tm: "a b c d tx ty Tm"
      const tmMatch = trimmed.match(
        /^(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+(-?[\d.e+-]+)\s+Tm$/,
      );
      if (tmMatch) {
        lastTmTx = parseFloat(tmMatch[5]);
        lastTmTy = parseFloat(tmMatch[6]);
        continue;
      }

      // TJ/Tj: decodifica il testo e cerca il marker
      if (trimmed.endsWith(" TJ") || trimmed.endsWith(" Tj")) {
        const decoded = decodeTJText(trimmed);
        const m = decoded.match(MARKER_RE);
        if (m) {
          const [absX, absY] = transformPoint(ctm, lastTmTx, lastTmTy);
          hits.push({
            marker: m[0],
            page: pageNumber,
            xPt: absX,
            yPt: absY,
          });
        }
      }
    }
  }
  return hits;
}

function ptToPercent(xPt: number, yPt: number): { x: number; y: number } {
  return {
    x: (xPt / A4_WIDTH) * 100,
    y: (1 - yPt / A4_HEIGHT) * 100,
  };
}

export function buildSignatureFields(
  pdfBuffer: Buffer,
  clienteEmail: string,
  clienteName: string,
  fornitoreEmail: string,
  fornitoreName: string,
): EnvelopeRecipient[] {
  const markers = findMarkersInPdf(pdfBuffer);

  const clienteFields: DocumensoField[] = [];
  const fornitoreFields: DocumensoField[] = [];

  if (markers.length === 0) {
    console.warn("[documenso] No XSIGN markers found in PDF, using fallback");
    const totalPages = countPdfPages(pdfBuffer);
    clienteFields.push(
      { type: "SIGNATURE", page: totalPages, positionX: 55, positionY: 75, width: 30, height: 5, identifier: 0 },
      { type: "DATE", page: totalPages, positionX: 55, positionY: 82, width: 20, height: 3, identifier: 0 },
    );
    fornitoreFields.push(
      { type: "SIGNATURE", page: totalPages, positionX: 8, positionY: 75, width: 30, height: 5, identifier: 0 },
      { type: "DATE", page: totalPages, positionX: 8, positionY: 82, width: 20, height: 3, identifier: 0 },
    );
  } else {
    for (const hit of markers) {
      const pos = ptToPercent(hit.xPt, hit.yPt);
      const isFornitore = hit.marker.startsWith("XSIGNF_");
      const target = isFornitore ? fornitoreFields : clienteFields;

      target.push({
        type: "SIGNATURE",
        page: hit.page,
        positionX: pos.x,
        positionY: pos.y,
        width: 30,
        height: 5,
        identifier: 0,
      });
      target.push({
        type: "DATE",
        page: hit.page,
        positionX: pos.x,
        positionY: pos.y + 6,
        width: 20,
        height: 3,
        identifier: 0,
      });
    }
  }

  console.log("[documenso] Cliente fields:", clienteFields.length, "Fornitore fields:", fornitoreFields.length);

  return [
    {
      email: clienteEmail,
      name: clienteName,
      role: "SIGNER",
      signingOrder: 1,
      fields: clienteFields,
    },
    {
      email: fornitoreEmail,
      name: fornitoreName,
      role: "SIGNER",
      signingOrder: 2,
      fields: fornitoreFields,
    },
  ];
}

export async function createEnvelope(
  input: CreateEnvelopeInput,
): Promise<CreateEnvelopeResult> {
  const formData = new FormData();

  const payload = {
    type: "DOCUMENT",
    title: input.title,
    ...(input.externalId ? { externalId: input.externalId } : {}),
    recipients: input.recipients.map((r) => ({
      email: r.email,
      name: r.name,
      role: r.role,
      signingOrder: r.signingOrder,
      fields: r.fields,
    })),
    meta: {
      subject: input.subject ?? `Firma contratto: ${input.title}`,
      message:
        input.message ??
        "Clicca il link qui sotto per visionare e firmare il contratto elettronicamente.",
      distributionMethod: "NONE",
      signingOrder: "SEQUENTIAL",
    },
  };

  const payloadStr = JSON.stringify(payload);
  console.log("[documenso] createEnvelope payload:", payloadStr);
  formData.append("payload", payloadStr);

  const blob = new Blob([input.pdfBuffer], { type: "application/pdf" });
  formData.append("files", blob, input.pdfFileName);

  const result = await request<{ id: string }>("/envelope/create", {
    formData,
  });

  return { envelopeId: result.id };
}

// ─── Distribute (send for signing) ──────────────────────────────────────────

export type DistributeResult = {
  envelopeId: string;
  signingUrls: Array<{ email: string; signingUrl: string }>;
};

export async function distributeEnvelope(
  envelopeId: string,
): Promise<DistributeResult> {
  const result = await request<{
    id: string;
    recipients?: Array<{ email?: string; signingUrl?: string }>;
  }>("/envelope/distribute", {
    body: { envelopeId },
  });

  const signingUrls = (result.recipients ?? [])
    .filter((r) => r.signingUrl)
    .map((r) => ({ email: r.email ?? "", signingUrl: r.signingUrl! }));

  return { envelopeId: result.id, signingUrls };
}

// ─── Get envelope ────────────────────────────────────────────────────────────

export type EnvelopeStatus = "DRAFT" | "PENDING" | "COMPLETED" | "REJECTED";

export type EnvelopeDetails = {
  id: string;
  status: EnvelopeStatus;
  completedAt: string | null;
  recipients: Array<{
    id: number;
    email: string;
    signingStatus: string;
    signingUrl?: string;
  }>;
  items: Array<{ id: string }>;
};

export async function getEnvelope(
  envelopeId: string,
): Promise<EnvelopeDetails> {
  return request<EnvelopeDetails>(`/envelope/${envelopeId}`);
}

// ─── Download signed document ────────────────────────────────────────────────

export async function downloadSignedDocument(
  envelopeItemId: string,
): Promise<Buffer> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken()}`,
  };
  const res = await fetch(
    `${BASE_URL}/envelope/item/${envelopeItemId}/download`,
    { headers },
  );
  if (!res.ok) {
    throw new Error(`Documenso download failed: ${res.status}`);
  }
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// ─── Webhook verification ────────────────────────────────────────────────────

export function verifyDocumensoWebhook(
  receivedSecret: string | null,
): boolean {
  const expectedSecret = process.env.DOCUMENSO_WEBHOOK_SECRET;
  if (!expectedSecret || !receivedSecret) return false;
  const a = Buffer.from(receivedSecret);
  const b = Buffer.from(expectedSecret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type DocumensoWebhookPayload = {
  event: string;
  payload: {
    id: number;
    externalId?: string | null;
    title: string;
    status: string;
    completedAt?: string | null;
    recipients?: Array<{
      id: number;
      email: string;
      signingStatus: string;
    }>;
  };
  createdAt: string;
  webhookEndpoint: string;
};
