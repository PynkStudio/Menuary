import type { ContractData } from "./menuary-contract";

export type ContractStatus =
  | "draft"
  | "sent"
  | "signed"
  | "countersigned"
  | "expired"
  | "cancelled";

export type StoredContract = {
  id: string;
  numero: string;
  data: ContractData;
  clauseOverrides: Record<string, string>;
  status: ContractStatus;
  leadId: string | null;
  packageSlug: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  signedAt: string | null;
  expiresAt: string | null; // sent + 5 days
  signedFileName: string | null;
  signedFileDataUrl: string | null; // file PDF controfirmato (base64 data URL)
  subscriptionId: string | null;
};

const STORAGE_KEY = "menuary.contracts.v1";

function read(): StoredContract[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredContract[];
  } catch {
    return [];
  }
}

function write(list: StoredContract[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function listContracts(): StoredContract[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getContract(id: string): StoredContract | null {
  return read().find((c) => c.id === id) ?? null;
}

export function saveContract(
  data: ContractData,
  clauseOverrides: Record<string, string>,
  opts: {
    leadId: string | null;
    packageSlug: string | null;
    id?: string;
  },
): StoredContract {
  const list = read();
  const now = new Date().toISOString();
  const existing = opts.id ? list.find((c) => c.id === opts.id) : null;

  const contract: StoredContract = existing
    ? {
        ...existing,
        data,
        clauseOverrides,
        leadId: opts.leadId,
        packageSlug: opts.packageSlug,
        numero: data.numero,
        updatedAt: now,
      }
    : {
        id: cryptoRandomId(),
        numero: data.numero,
        data,
        clauseOverrides,
        status: "draft",
        leadId: opts.leadId,
        packageSlug: opts.packageSlug,
        createdAt: now,
        updatedAt: now,
        sentAt: null,
        signedAt: null,
        expiresAt: null,
        signedFileName: null,
        signedFileDataUrl: null,
        subscriptionId: null,
      };

  const next = existing
    ? list.map((c) => (c.id === contract.id ? contract : c))
    : [contract, ...list];
  write(next);
  return contract;
}

export function markSent(id: string): StoredContract | null {
  const list = read();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const now = new Date();
  const exp = new Date(now);
  exp.setDate(exp.getDate() + 5);
  list[idx] = {
    ...list[idx],
    status: "sent",
    sentAt: now.toISOString(),
    expiresAt: exp.toISOString(),
    updatedAt: now.toISOString(),
  };
  write(list);
  return list[idx];
}

export function attachSignedFile(
  id: string,
  fileName: string,
  dataUrl: string,
): StoredContract | null {
  const list = read();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  list[idx] = {
    ...list[idx],
    status: "countersigned",
    signedFileName: fileName,
    signedFileDataUrl: dataUrl,
    signedAt: now,
    updatedAt: now,
  };
  write(list);
  return list[idx];
}

export function setStatus(id: string, status: ContractStatus): StoredContract | null {
  const list = read();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], status, updatedAt: new Date().toISOString() };
  write(list);
  return list[idx];
}

export function deleteContract(id: string) {
  write(read().filter((c) => c.id !== id));
}

export function linkSubscription(id: string, subscriptionId: string) {
  const list = read();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return;
  list[idx] = {
    ...list[idx],
    subscriptionId,
    updatedAt: new Date().toISOString(),
  };
  write(list);
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Bozza",
  sent: "Inviato",
  signed: "Firmato (in attesa di controparte)",
  countersigned: "Controfirmato",
  expired: "Scaduto (>5gg)",
  cancelled: "Annullato",
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-800",
  signed: "bg-amber-100 text-amber-800",
  countersigned: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
};
