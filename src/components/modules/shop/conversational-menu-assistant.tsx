"use client";

import { FormEvent, KeyboardEvent, useId, useState } from "react";
import { MessageCircle, Plus, Send } from "lucide-react";
import type { MenuOrderChannel } from "@/lib/types";

type Message = { role: "user" | "assistant"; content: string };
type Suggestion = { itemId: string; reason: string };

export function ConversationalMenuAssistant({
  tenantId, channel, tableId, locale, cartItemIds, favoriteItemIds = [], itemNames, onAdd,
}: {
  tenantId: string;
  channel: MenuOrderChannel;
  tableId?: string | null;
  locale: string;
  cartItemIds: string[];
  favoriteItemIds?: string[];
  itemNames: Record<string, string>;
  onAdd: (itemId: string) => void;
}) {
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personalized, setPersonalized] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    const nextMessages = [...messages, { role: "user" as const, content }];
    setInput("");
    setMessages(nextMessages);
    setSuggestions([]);
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tenantId,
          channel,
          tableId: tableId ?? null,
          locale,
          cartItemIds,
          favoriteItemIds,
          messages: nextMessages,
        }),
      });
      const payload = (await response.json()) as {
        reply?: string;
        suggestions?: Suggestion[];
        personalized?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.reply) throw new Error(payload.error || "assistant_failed");
      setMessages((current) => [...current, { role: "assistant", content: payload.reply! }]);
      setSuggestions((payload.suggestions ?? []).filter((suggestion) => itemNames[suggestion.itemId]));
      setPersonalized(payload.personalized === true);
    } catch {
      setError("Non riesco a rispondere in questo momento. Puoi comunque continuare a sfogliare il menu.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <section className="mx-5 mb-4 rounded-2xl border border-pork-ink/15 bg-white/70 p-4 text-pork-ink">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
        aria-controls={`${inputId}-panel`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-2 font-semibold">
          <MessageCircle size={19} aria-hidden="true" />
          Chiedi al menu
        </span>
        <span className="text-xs text-pork-ink/60">{open ? "Chiudi" : "Consigli, allergeni, abbinamenti"}</span>
      </button>

      {open && (
        <div id={`${inputId}-panel`} className="mt-3 border-t border-pork-ink/10 pt-3">
          <div className="max-h-64 space-y-2 overflow-y-auto" role="log" aria-live="polite">
            {messages.length === 0 && (
              <p className="text-sm text-pork-ink/65">Scrivi cosa ti piace, cosa vuoi evitare o quanto vuoi spendere.</p>
            )}
            {messages.map((message, index) => (
              <p
                key={`${message.role}-${index}`}
                className={message.role === "user"
                  ? "ml-8 rounded-xl bg-pork-ink px-3 py-2 text-sm text-pork-cream"
                  : "mr-4 rounded-xl bg-pork-cream px-3 py-2 text-sm"}
              >
                {message.content}
              </p>
            ))}
            {loading && <p className="text-sm text-pork-ink/60">Sto leggendo il menu…</p>}
          </div>

          {suggestions.length > 0 && (
            <div className="mt-3 space-y-2" aria-label="Piatti suggeriti">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.itemId}
                  type="button"
                  className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-pork-ink/10 bg-white px-3 py-2 text-left"
                  onClick={() => {
                    onAdd(suggestion.itemId);
                    setSuggestions((current) => current.filter((item) => item.itemId !== suggestion.itemId));
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm">{itemNames[suggestion.itemId]}</strong>
                    <span className="block text-xs text-pork-ink/60">{suggestion.reason}</span>
                  </span>
                  <Plus size={18} aria-hidden="true" />
                </button>
              ))}
            </div>
          )}

          <form action="/api/ai/assistant" method="post" className="mt-3 flex items-end gap-2" onSubmit={submit}>
            <label htmlFor={inputId} className="sr-only">La tua domanda sul menu</label>
            <textarea
              id={inputId}
              name="message"
              rows={2}
              maxLength={800}
              value={input}
              onChange={(event) => { setInput(event.target.value); setError(null); }}
              onKeyDown={handleKeyDown}
              placeholder="Es. Sono vegetariano e vorrei qualcosa di leggero"
              enterKeyHint="send"
              className="min-h-12 min-w-0 flex-1 resize-y rounded-xl border border-pork-ink/20 bg-white px-3 py-2 text-base outline-none focus-visible:ring-2 focus-visible:ring-pork-red"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pork-red text-white disabled:opacity-50"
              aria-label="Invia domanda"
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
          {error && <p className="mt-2 text-sm text-pork-red" role="alert">{error}</p>}
          {personalized && (
            <p className="mt-2 text-xs text-pork-ink/60" role="status">
              Suggerimenti personalizzati usando il tuo profilo Menuary e la tua attività presso questo locale.
            </p>
          )}
          <p className="mt-2 text-xs text-pork-ink/50">Per allergie o contaminazioni chiedi sempre conferma al personale.</p>
        </div>
      )}
    </section>
  );
}
