import "server-only";

import { timingSafeEqual } from "node:crypto";
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

export function countPdfPages(buffer: Buffer): number {
  const str = buffer.toString("latin1");
  const match = str.match(/\/Count\s+(\d+)/);
  return match ? Math.max(1, parseInt(match[1], 10)) : 1;
}

/**
 * Genera campi firma + data per il Cliente (unico firmatario su Documenso)
 * su tutte le pagine dove compaiono blocchi firma.
 *
 * Il contratto ha questa struttura:
 *   - corpo principale (clausole + vessatorie + firme: entrambe le parti)
 *   - N allegati, ciascuno con firme Cliente + Fornitore in calce
 *
 * Il Cliente firma:
 *   1. Firma principale + vessatorie sul corpo (ultima pagina prima degli allegati)
 *   2. Firma su ogni allegato (pagina dell'allegato)
 *
 * Le pagine di firma sono le ultime (1 + attachmentCount) pagine del PDF.
 *
 * Posizionamento (coordinate percentuali 0-100):
 *   - Firma vessatorie: colonna destra, Y ~68
 *   - Firma principale: colonna destra, Y ~83
 *   - Data sotto ogni firma: Y +7
 */
export function buildSignatureFields(
  totalPages: number,
  clienteEmail: string,
  clienteName: string,
  attachmentPageCount: number,
): EnvelopeRecipient[] {
  const sigCount = 1 + attachmentPageCount;
  const startPage = Math.max(1, totalPages - sigCount + 1);
  const sigPages: number[] = [];
  for (let i = 0; i < sigCount; i++) {
    const p = startPage + i;
    if (p >= 1 && p <= totalPages) sigPages.push(p);
  }

  let idCounter = 0;
  const fields: DocumensoField[] = [];

  for (const page of sigPages) {
    const id0 = idCounter++;
    const id1 = idCounter++;

    // Firma vessatorie (destra)
    fields.push(
      { type: "SIGNATURE", page, positionX: 58, positionY: 68, width: 28, height: 5, identifier: id0 },
      { type: "DATE", page, positionX: 58, positionY: 75, width: 20, height: 3, identifier: id0 },
    );
    // Firma principale (destra)
    fields.push(
      { type: "SIGNATURE", page, positionX: 58, positionY: 83, width: 28, height: 5, identifier: id1 },
      { type: "DATE", page, positionX: 58, positionY: 90, width: 20, height: 3, identifier: id1 },
    );
  }

  return [
    {
      email: clienteEmail,
      name: clienteName,
      role: "SIGNER",
      signingOrder: 1,
      fields,
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

  formData.append("payload", JSON.stringify(payload));

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
  signingUrl: string | null;
};

export async function distributeEnvelope(
  envelopeId: string,
): Promise<DistributeResult> {
  const result = await request<{
    id: string;
    recipients?: Array<{ signingUrl?: string }>;
  }>("/envelope/distribute", {
    body: { envelopeId },
  });

  const signingUrl = result.recipients?.[0]?.signingUrl ?? null;
  return { envelopeId: result.id, signingUrl };
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
