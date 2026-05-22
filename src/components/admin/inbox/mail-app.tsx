"use client";

import { useState, useTransition, useCallback } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

import { MailSidebar } from "./mail-sidebar";
import { EmailList } from "./email-list";
import { EmailDetail } from "./email-detail";
import { SentDetail } from "./sent-detail";
import { ComposeDrawer, type ComposeAttachment } from "./compose-drawer";

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
  unreadMine: number;
  currentSiteadminId: string | null;
  canCompose: boolean;
};

type ComposePrefill = {
  to?: string;
  subject?: string;
  body?: string;
  brand?: InboundEmail["brand"];
  attachments?: ComposeAttachment[];
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
    brand:                e.brand,
    read:                 true,
    starred:              false,
    archived:             false,
    lead_id:              e.lead_id,
    assigned_to_user_id:  null,
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function quoteText(text: string): string {
  return text.split(/\r?\n/).map((line) => `> ${line}`).join("\n");
}

function replySubject(subject: string): string {
  return /^re:/i.test(subject.trim()) ? subject : `Re: ${subject}`;
}

function buildReplyBody(email: InboundEmail): string {
  const original = email.text_body ?? (email.html_body ? htmlToText(email.html_body) : "");
  const from = email.from_name ? `${email.from_name} <${email.from_address}>` : email.from_address;
  const date = new Date(email.created_at).toLocaleString("it-IT", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return `\n\nIl ${date}, ${from} ha scritto:\n${quoteText(original)}`;
}

function composeBrandFromFilter(filter: BrandFilter): InboundEmail["brand"] {
  return filter === "bizery" ? "bizery" : "menuary";
}

export function MailApp({ initialInbox, initialSent, unreadTotal, unreadMine, currentSiteadminId, canCompose }: Props) {
  const [view, setView]         = useState<MailView>("inbox");
  const [brand, setBrand]       = useState<BrandFilter>("all");
  const [inbox, setInbox]       = useState(initialInbox);
  const [sent, setSent]         = useState(initialSent);
  const [unread, setUnread]     = useState(unreadTotal);
  const [unreadMyCount, setUnreadMyCount] = useState(unreadMine);
  const [selectedInbound, setSelectedInbound] = useState<InboundEmail | null>(null);
  const [selectedSent, setSelectedSent]       = useState<SentEmail | null>(null);
  const [composeOpen, setComposeOpen]         = useState(false);
  const [composePrefill, setComposePrefill]   = useState<ComposePrefill>({});
  const [isPending, startTransition]          = useTransition();

  const reload = useCallback(
    (v: MailView = view, b: BrandFilter = brand) => {
      startTransition(async () => {
        if (v === "sent") {
          const fresh = await getSentEmails(b);
          setSent(fresh);
        } else {
          const fresh = await getInboundEmails({
            brand:             b,
            onlyStarred:       v === "starred",
            archived:          v === "archived",
            assignedToUserId:  v === "mine" && currentSiteadminId ? currentSiteadminId : undefined,
          });
          setInbox(fresh);
          if (v === "inbox") setUnread(fresh.emails.filter((e) => !e.read).length);
          if (v === "mine")   setUnreadMyCount(fresh.emails.filter((e) => !e.read).length);
        }
      });
    },
    [view, brand, currentSiteadminId],
  );

  function handleAssigned(emailId: string, siteadminId: string | null) {
    setInbox((prev) => ({
      ...prev,
      emails: prev.emails.map((e) =>
        e.id === emailId ? { ...e, assigned_to_user_id: siteadminId } : e,
      ),
    }));
    if (selectedInbound?.id === emailId) {
      setSelectedInbound((prev) => prev ? { ...prev, assigned_to_user_id: siteadminId } : prev);
    }
  }

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

  function openBlankCompose() {
    setComposePrefill({});
    setComposeOpen(true);
  }

  function handleReply(email: InboundEmail) {
    setComposePrefill({
      to: email.from_address,
      subject: replySubject(email.subject),
      body: buildReplyBody(email),
      brand: email.brand,
    });
    setComposeOpen(true);
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
              unreadMine={unreadMyCount}
              canCompose={canCompose}
              onViewChange={handleViewChange}
              onBrandChange={handleBrandChange}
              onCompose={openBlankCompose}
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
                {(["inbox","mine","sent","starred","archived"] as MailView[]).map((v) => (
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
                    {v === "inbox" ? "Arrivo" : v === "mine" ? "Le mie" : v === "sent" ? "Inviata" : v === "starred" ? "Stellate" : "Archivio"}
                  </button>
                ))}
                {(["all","menuary","bizery","support"] as BrandFilter[]).map((b) => (
                  <button
                    key={b}
                    onClick={() => handleBrandChange(b)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                      brand === b
                        ? "bg-[var(--ma-line)] text-[var(--ma-ink)]"
                        : "bg-[var(--ma-surface)] text-[var(--ma-muted)]",
                    )}
                  >
                    {b === "all" ? "Tutte" : b === "menuary" ? "Menuary" : b === "bizery" ? "Bizery" : "Supporto"}
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
                  onReply={handleReply}
                  onAssigned={handleAssigned}
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
          onClick={openBlankCompose}
          className="menuary-admin-action-btn fixed bottom-6 right-6 z-40 flex items-center gap-2 shadow-lg lg:hidden"
        >
          ✏️ Scrivi
        </button>
      )}

      <ComposeDrawer
        open={composeOpen}
        canCompose={canCompose}
        defaultBrand={composePrefill.brand ?? composeBrandFromFilter(brand)}
        initialTo={composePrefill.to}
        initialSubject={composePrefill.subject}
        initialBody={composePrefill.body}
        initialAttachments={composePrefill.attachments}
        onClose={() => setComposeOpen(false)}
        onSent={() => { if (view === "sent") reload("sent", brand); }}
      />
    </>
  );
}
