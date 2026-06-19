"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { hasAdminPermission, type SiteadminRole } from "@/lib/admin-permissions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type AdminPushNotificationsProps = {
  role: SiteadminRole | null;
  siteadminId: string | null;
};

type CountSnapshot = {
  inbox: number;
  support: number;
  contracts: number;
  payments: number;
};

type EventRow = Record<string, unknown>;

const ZERO_COUNTS: CountSnapshot = {
  inbox: 0,
  support: 0,
  contracts: 0,
  payments: 0,
};

function notificationAvailable() {
  return typeof window !== "undefined" && "Notification" in window;
}

function getPermission(): NotificationPermission | "unsupported" {
  if (!notificationAvailable()) return "unsupported";
  return Notification.permission;
}

function text(row: EventRow | null | undefined, key: string): string | null {
  const value = row?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberText(row: EventRow | null | undefined, key: string): string | null {
  const value = row?.[key];
  if (typeof value === "number") return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function isAssignedTo(row: EventRow | null | undefined, siteadminId: string | null): boolean {
  return Boolean(siteadminId && text(row, "assigned_to_user_id") === siteadminId);
}

function isOnlineOrWhatsappLead(row: EventRow | null | undefined): boolean {
  const source = (text(row, "source") ?? "").toLowerCase();
  if (!source || source === "manuale" || source === "manual") return false;
  if (source === "form_web" || source.includes("form") || source.includes("online") || source.includes("marketing-site")) return true;
  if (source.includes("whatsapp") || source === "wa") return true;
  if (text(row, "last_whatsapp_at")) return true;
  const notes = (text(row, "notes") ?? "").toLowerCase();
  return notes.includes("whatsapp");
}

function isWhatsappSupportTicket(row: EventRow | null | undefined): boolean {
  return text(row, "source") === "whatsapp_customer_service";
}

function isFresh(row: EventRow | null | undefined, mountedAt: number): boolean {
  if (!row) return true;
  const value = text(row, "updated_at") ?? text(row, "created_at");
  if (!value) return true;
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return true;
  return ts >= mountedAt - 5_000;
}

async function fetchCount(path: string): Promise<number> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) return 0;
  const payload = (await response.json()) as { unread?: number; count?: number };
  return payload.unread ?? payload.count ?? 0;
}

export function AdminPushNotifications({ role, siteadminId }: AdminPushNotificationsProps) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const countsRef = useRef<CountSnapshot | null>(null);
  const mountedAtRef = useRef(Date.now());

  const canInbox = hasAdminPermission(role, "inbox:view");
  const canSupport = hasAdminPermission(role, "support:manage");
  const canCrm = hasAdminPermission(role, "crm:view");
  const canSubscriptions = hasAdminPermission(role, "subscriptions:view");
  const canNotify = canInbox || canSupport || canCrm || canSubscriptions;

  const enabled = permission === "granted";
  const blocked = permission === "denied";

  useEffect(() => {
    setPermission(getPermission());
  }, []);

  const notify = useCallback(
    (title: string, body: string, tag: string, url: string) => {
      if (!notificationAvailable() || Notification.permission !== "granted") return;
      const notification = new Notification(title, {
        body,
        tag,
        icon: "/favicons/menuary/icon.svg",
      });
      notification.onclick = () => {
        window.focus();
        window.location.assign(url);
      };
    },
    [],
  );

  const refreshCounts = useCallback(async () => {
    if (!canNotify) return;
    const next: CountSnapshot = { ...ZERO_COUNTS };
    if (canInbox) next.inbox = await fetchCount("/api/admin/inbox/unread?assigned=me");
    if (canSupport) next.support = await fetchCount("/api/admin/support/active-count");
    if (canSubscriptions) {
      const [contracts, payments] = await Promise.all([
        fetchCount("/api/admin/contracts/attention"),
        fetchCount("/api/admin/payments/invoice-tasks"),
      ]);
      next.contracts = contracts;
      next.payments = payments;
    }

    const prev = countsRef.current;
    countsRef.current = next;
    if (!prev) return;
    if (next.inbox > prev.inbox) notify("Nuova mail", "C'e una nuova email nella posta in arrivo.", "admin-inbox", "/admin/inbox");
    if (next.support > prev.support) notify("Nuovo ticket supporto", "C'e un ticket aperto che richiede attenzione.", "admin-support", "/admin/supporto");
    if (next.contracts > prev.contracts) notify("Contratto da controfirmare", "Un contratto richiede un aggiornamento operativo.", "admin-contracts", "/admin/contratti");
    if (next.payments > prev.payments) notify("Pagamento da fatturare", "Un pagamento completato richiede la fattura.", "admin-payments", "/admin/abbonamenti");
  }, [canInbox, canNotify, canSubscriptions, canSupport, notify]);

  useEffect(() => {
    if (!canNotify) return;
    void refreshCounts();
    const interval = window.setInterval(() => void refreshCounts(), 25_000);
    window.addEventListener("focus", refreshCounts);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshCounts);
    };
  }, [canNotify, refreshCounts]);

  useEffect(() => {
    if (!canNotify) return;
    const supabase = createSupabaseBrowserClient();
    const mountedAt = mountedAtRef.current;
    const channel = supabase.channel("platform-admin-notifications");

    if (canInbox && siteadminId) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inbound_emails" },
        (payload) => {
          const row = payload.new as EventRow | undefined;
          if (!isFresh(row, mountedAt) || !isAssignedTo(row, siteadminId)) return;
          window.dispatchEvent(new Event("inbox:refresh"));
          notify("Nuova mail", text(row, "subject") ?? text(row, "from_address") ?? "Nuova email ricevuta.", `admin-inbox-${text(row, "id") ?? Date.now()}`, "/admin/inbox");
        },
      );
    }

    if (canSupport) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_tickets" },
        (payload) => {
          const row = payload.new as EventRow | undefined;
          if (!isFresh(row, mountedAt)) return;
          window.dispatchEvent(new Event("support:refresh"));
          const isWhatsapp = isWhatsappSupportTicket(row);
          notify(
            isWhatsapp ? "Nuovo messaggio WhatsApp" : "Nuovo ticket supporto",
            text(row, "subject") ?? "Nuova richiesta di supporto.",
            `admin-support-${text(row, "id") ?? Date.now()}`,
            isWhatsapp ? "/admin/messaggi-wa" : "/admin/supporto",
          );
        },
      );
    }

    if (canCrm) {
      channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "platform_leads" },
        (payload) => {
          const row = payload.new as EventRow | undefined;
          if (!isFresh(row, mountedAt) || !isOnlineOrWhatsappLead(row)) return;
          window.dispatchEvent(new Event("lead-attention:refresh"));
          notify("Nuovo lead", text(row, "business_name") ?? "Nuovo lead da form online o WhatsApp.", `admin-lead-${text(row, "id") ?? Date.now()}`, "/admin/crm");
        },
      );
    }

    if (canSubscriptions) {
      channel
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "platform_contracts" },
          (payload) => {
            const row = payload.new as EventRow | undefined;
            if (!isFresh(row, mountedAt)) return;
            window.dispatchEvent(new Event("contracts:refresh"));
            const numero = text(row, "numero");
            const status = text(row, "status");
            notify("Contratto aggiornato", `${numero ? `Contratto ${numero}` : "Un contratto"}${status ? `: ${status}` : ""}.`, `admin-contract-${text(row, "id") ?? Date.now()}`, "/admin/contratti");
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "platform_payments" },
          (payload) => {
            const row = payload.new as EventRow | undefined;
            if (!isFresh(row, mountedAt)) return;
            window.dispatchEvent(new Event("payments:refresh"));
            const amount = numberText(row, "amount");
            const status = text(row, "status");
            notify("Pagamento aggiornato", `${amount ? `${amount} ` : ""}${status ? `stato ${status}` : "Aggiornamento pagamento"}.`, `admin-payment-${text(row, "id") ?? Date.now()}`, "/admin/abbonamenti");
          },
        );
    }

    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [canCrm, canInbox, canNotify, canSubscriptions, canSupport, notify, siteadminId]);

  async function requestPermission() {
    if (!notificationAvailable()) {
      setPermission("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  }

  const label = useMemo(() => {
    if (!canNotify) return "Notifiche non disponibili";
    if (permission === "unsupported") return "Notifiche non supportate";
    if (blocked) return "Notifiche bloccate dal browser";
    if (enabled) return "Notifiche admin attive";
    return "Attiva notifiche admin";
  }, [blocked, canNotify, enabled, permission]);

  if (!canNotify) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (!enabled && !blocked) void requestPermission();
      }}
      className={cn("menuary-admin-nav-link mx-3 mb-1", enabled && "text-[var(--ma-accent)]")}
      aria-pressed={enabled}
      title={label}
    >
      {enabled ? <Bell size={18} /> : <BellOff size={18} />}
      {label}
    </button>
  );
}
