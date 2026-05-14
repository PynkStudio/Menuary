"use client";

import { useState } from "react";
import { useTenant } from "@/components/core/tenant-provider";

export default function AssistantMenuPage() {
  const tenant = useTenant();
  const [input, setInput] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    setLoading(true);
    setReply(null);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tenantId: tenant.id,
          messages: [{ role: "user", content: input.trim() }],
        }),
      });
      const data = (await res.json()) as { reply?: string };
      setReply(data.reply ?? "Risposta non disponibile.");
    } catch {
      setReply("Errore di rete.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-wide py-16">
      <h1 className="headline text-4xl">Assistente menu</h1>
      <p className="mt-2 max-w-xl text-pork-ink/70">
        Chiedi gusti, ingredienti o abbinamenti. Le risposte usano il listino del locale
        quando il database è collegato.
      </p>
      <div className="mt-8 flex max-w-xl flex-col gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="rounded-2xl border-2 border-pork-ink/15 px-4 py-3"
          placeholder="Es. cosa consigli di piccante senza maiale?"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void send()}
          className="btn-primary self-start"
        >
          {loading ? "Invio…" : "Chiedi"}
        </button>
        {reply && (
          <p className="rounded-2xl bg-pork-mustard/15 px-4 py-3 text-sm text-pork-ink">{reply}</p>
        )}
      </div>
    </div>
  );
}
