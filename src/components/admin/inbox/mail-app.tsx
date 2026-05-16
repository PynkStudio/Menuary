"use client";

import { useState, useTransition, useCallback } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

import { MailSidebar } from "./mail-sidebar";
import { EmailList } from "./email-list";
import { EmailDetail } from "./email-detail";
import { SentDetail } from "./sent-detail";
import { ComposeDrawer } from "./compose-drawer";

import { getInboundEmails, markEmailRead } from "@/lib/email/inbound-queries";
import { getSentEmails } from "@/lib/email/sent-queries";

import type { InboxPage } from "@/lib/email/inbound-queries";
import type { SentPage, SentEmail } from "@/lib/email/sent-queries";
import type { InboundEmail } from "@/lib/email/inbound-types";
import type { MailView, BrandFilter } from "./mail-sidebar";

type Props = {
  initialInbox: InboxPage;
  initialSent: SentPage;
  unreadTotal: number;
  canCompose: boolean;
};

// Adatta SentEmail alla forma che EmailList si aspetta per il pannello inviata
function sentToListItem(e: SentEmail): InboundEmail {
  return {
    id:           e.id,
    created_at:   e.created_at,
    message_id:   e.resend_message_id,
    from_address: e.from_address,
    from_name:    e.from_name,
    to_addresses: e.to_addresses,
    subject:      e.subject,
    text_body:    null,
    html_body:    e.html_body,
    headers:      [],
    attachments:  [],
    brand:        e.brand,
    read:         true,
    starred:      false,
    archived:     false,
  };
}

export function MailApp({ initialInbox, initialSent, unreadTotal, canCompose }: Props) {
  const [view, setView]         = useState<MailView>("inbox");
  const [brand, setBrand]       = useState<BrandFilter>("all");
  const [inbox, setInbox]       = useState(initialInbox);
  const [sent, setSent]         = useState(initialSent);
  const [unread, setUnread]     = useState(unreadTotal);
  const [selectedInbound, setSelectedInbound] = useState<InboundEmail | null>(null);
  const [selectedSent, setSelectedSent]       = useState<SentEmail | null>(null);
  const [composeOpen, setComposeOpen]         = useState(false);
  const [isPending, startTransition]          = useTransition();

  const reload = useCallback(
    (v: MailView = view, b: BrandFilter = brand) => {
      startTransition(async () => {
        if (v === "sent") {
          const fresh = await getSentEmails(b === "all" ? undefined : b);
          setSent(fresh);
        } else {
          const fresh = await getInboundEmails({
            brand:       b === "all" ? "all" : b,
            onlyStarred: v === "starred",
            archived:    v === "archived",
          });
          setInbox(fresh);
          // Aggiorna contatore non lette approssimativo
          if (v === "inbox") {
            setUnread(fresh.emails.filter((e) => !e.read).length);
          }
        }
      });
    },
    [view, brand],
  );

  function handleViewChange(v: MailView) {
    setView(v);
    setSelectedInbound(null);
    setSelectedSent(null);
    reload(v, brand);
  }

  function handleBrandChange(b: BrandFilter) {
    setBrand(b);
    setSelectedInbound(null);
    setSelectedSent(null);
    reload(view, b);
  }

  async function handleSelectInbound(email: InboundEmail) {
    setSelectedInbound(email);
    setSelectedSent(null);
    if (!email.read) {
      await markEmailRead(email.id, true);
      setInbox((prev) => ({
        ...prev,
        emails: prev.emails.map((e) => e.id === email.id ? { ...e, read: true } : e),
      }));
      setUnread((n) => Math.max(0, n - 1));
    }
  }

  function handleSelectSent(item: InboundEmail) {
    const original = sent.emails.find((e) => e.id === item.id) ?? null;
    setSelectedSent(original);
    setSelectedInbound(null);
  }

  const isSentView = view === "sent";
  const listEmails = isSentView
    ? sent.emails.map(sentToListItem)
    : inbox.emails;

  const selectedListId = isSentView ? selectedSent?.id ?? null : selectedInbound?.id ?? null;
  const showDetail = isSentView ? selectedSent !== null : selectedInbound !== null;

  return (
    <>
      <div className="menuary-admin-card overflow-hidden p-0">
        <div className="flex h-[calc(100vh-180px)] min-h-[500px]">
          {/* Sidebar */}
          <div className="hidden lg:flex">
            <MailSidebar
              view={view}
              brand={brand}
              unreadCount={unread}
              canCompose={canCompose}
              onViewChange={handleViewChange}
              onBrandChange={handleBrandChange}
              onCompose={() => setComposeOpen(true)}
            />
          </div>

          {/* Lista */}
          <div className={cn(
            "flex h-full flex-col overflow-hidden border-r border-[var(--ma-line)]",
            showDetail ? "hidden lg:flex lg:w-72 xl:w-80" : "flex-1",
          )}>
            {/* Toolbar lista */}
            <div className="flex items-center justify-between border-b border-[var(--ma-line)] px-4 py-2.5">
              {/* Mobile: filtri brand + vista */}
              <div className="flex flex-wrap gap-1 lg:hidden">
                {(["inbox","sent","starred","archived"] as MailView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => handleViewChange(v)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors capitalize",
                      view === v
                        ? "bg-[var(--ma-accent)] text-white"
                        : "bg-[var(--ma-surface)] text-[var(--ma-muted)]",
                    )}
                  >
                    {v === "inbox" ? "Arrivo" : v === "sent" ? "Inviata" : v === "starred" ? "Stellate" : "Archivio"}
                  </button>
                ))}
              </div>
              <p className="hidden text-xs text-[var(--ma-muted)] lg:block">
                {isSentView ? sent.total : inbox.total} email
              </p>
              <button
                onClick={() => reload()}
                disabled={isPending}
                className="menuary-admin-nav-link !w-auto !p-1.5"
                title="Aggiorna"
              >
                <RefreshCw size={13} className={isPending ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <EmailList
                emails={listEmails}
                selectedId={selectedListId}
                onSelect={isSentView ? handleSelectSent : handleSelectInbound}
              />
            </div>
          </div>

          {/* Dettaglio */}
          {showDetail ? (
            <div className="flex-1 overflow-hidden">
              {isSentView && selectedSent ? (
                <SentDetail
                  email={selectedSent}
                  onClose={() => setSelectedSent(null)}
                />
              ) : selectedInbound ? (
                <EmailDetail
                  email={selectedInbound}
                  onClose={() => setSelectedInbound(null)}
                  onMutated={() => reload()}
                />
              ) : null}
            </div>
          ) : (
            <div className="hidden flex-1 items-center justify-center text-[var(--ma-muted)] lg:flex">
              <div className="text-center">
                <Mail size={36} className="mx-auto mb-2 opacity-25" />
                <p className="text-sm">Seleziona un&apos;email</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: scrivi */}
      {canCompose && (
        <button
          onClick={() => setComposeOpen(true)}
          className="menuary-admin-action-btn fixed bottom-6 right-6 z-40 flex items-center gap-2 shadow-lg lg:hidden"
        >
          ✏️ Scrivi
        </button>
      )}

      <ComposeDrawer
        open={composeOpen}
        canCompose={canCompose}
        defaultBrand={brand === "all" ? "menuary" : brand}
        onClose={() => setComposeOpen(false)}
        onSent={() => { if (view === "sent") reload("sent", brand); }}
      />
    </>
  );
}
