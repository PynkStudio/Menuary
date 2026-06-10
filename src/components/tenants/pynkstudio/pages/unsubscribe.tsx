"use client";

import { useState } from "react";
import { CheckCircle, Loader2, MailX } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";

type Status = "idle" | "sending" | "success" | "error" | "invalid";

function UnsubscribeInner() {
  const copy = usePynkCopy();
  const c = copy.unsubscribePage;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("invalid");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/tenant/pynkstudio/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: email,
          email,
          subject: "Richiesta disiscrizione email",
          message: `Richiesta di disiscrizione dalle comunicazioni email per l'indirizzo: ${email}`,
        }),
      });
      if (!res.ok) throw new Error("send_failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="pynk-page">
      <section className="pynk-section pynk-section-top pynk-section-fill">
        <div className="pynk-container pynk-center-col">
          <div className="pynk-unsubscribe">
            {status === "success" ? (
              <>
                <CheckCircle className="pynk-icon-lg pynk-accent" />
                <h1 className="pynk-panel-title">{c.success}</h1>
              </>
            ) : (
              <>
                <MailX className="pynk-icon-lg pynk-accent" />
                <h1 className="pynk-panel-title">{c.title}</h1>
                <p className="pynk-panel-desc">{c.body}</p>
                <form onSubmit={handleSubmit} className="pynk-unsubscribe-form">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={c.emailPlaceholder}
                    aria-label="Email"
                  />
                  <button type="submit" disabled={status === "sending"} className="pynk-btn pynk-btn-primary">
                    {status === "sending" ? <Loader2 className="pynk-icon-sm pynk-spin" /> : null}
                    {c.submit}
                  </button>
                </form>
                {status === "invalid" && <p className="pynk-feedback pynk-feedback-error">{c.invalid}</p>}
                {status === "error" && <p className="pynk-feedback pynk-feedback-error">{c.error}</p>}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export function PynkStudioUnsubscribePage() {
  return (
    <PynkShell>
      <UnsubscribeInner />
    </PynkShell>
  );
}
