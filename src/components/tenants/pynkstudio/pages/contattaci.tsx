"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";

type Feedback = { kind: "success" | "error"; text: string } | null;

function ContattaciInner() {
  const copy = usePynkCopy();
  const c = copy.contattiPage;
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    people: "",
    sector: "",
    message: "",
    email: "",
    phone: "",
  });
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(c.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!formData.name || !formData.email || !formData.message) {
      setFeedback({ kind: "error", text: c.form.errorRequired });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFeedback({ kind: "error", text: c.form.errorEmail });
      return;
    }

    setSending(true);
    try {
      const details = [
        formData.company && `Azienda: ${formData.company}`,
        formData.people && `Persone: ${formData.people}`,
        formData.sector && `Settore: ${formData.sector}`,
        formData.phone && `Telefono: ${formData.phone}`,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/tenant/pynkstudio/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: "Nuovo messaggio dal sito",
          message: details ? `${details}\n\n${formData.message}` : formData.message,
        }),
      });
      if (!res.ok) throw new Error("send_failed");

      setFeedback({ kind: "success", text: c.form.success });
      setFormData({ name: "", company: "", people: "", sector: "", message: "", email: "", phone: "" });
    } catch {
      setFeedback({ kind: "error", text: c.form.errorGeneric });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pynk-page">
      <section className="pynk-section pynk-section-top">
        <div className="pynk-container">
          <div className="pynk-narrow">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="pynk-section-head"
            >
              <h1 className="pynk-hero-title">
                <span className="pynk-block">{c.titleLine1}</span>
                <span className="pynk-accent">{c.titleAccent}</span>
              </h1>
              <p className="pynk-hero-subtitle">{c.subtitle}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="pynk-contact-pills"
            >
              <div className="pynk-pill pynk-pill-contact">
                <Mail className="pynk-icon-xs pynk-accent" />
                <span>{c.email}</span>
                <button onClick={handleCopy} className="pynk-copy-btn" aria-label={c.copyAria}>
                  {copied ? <Check className="pynk-icon-xs pynk-accent" /> : <Copy className="pynk-icon-xs" />}
                </button>
              </div>
              <a href={c.phoneHref} className="pynk-pill pynk-pill-contact">
                <Phone className="pynk-icon-xs pynk-accent" />
                <span>{c.phoneLabel}</span>
              </a>
              <a href={c.whatsappHref} target="_blank" rel="noopener noreferrer" className="pynk-pill pynk-pill-contact">
                <MessageCircle className="pynk-icon-xs pynk-accent" />
                <span>{c.whatsappLabel}</span>
              </a>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              onSubmit={handleSubmit}
              autoComplete="on"
              className="pynk-form"
            >
              <div className="pynk-form-row">
                <div className="pynk-field">
                  <label htmlFor="pynk-name">{c.form.name}</label>
                  <input
                    id="pynk-name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={c.form.namePlaceholder}
                  />
                </div>
                <div className="pynk-field">
                  <label htmlFor="pynk-company">{c.form.company}</label>
                  <input
                    id="pynk-company"
                    name="company"
                    autoComplete="organization"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder={c.form.companyPlaceholder}
                  />
                </div>
              </div>

              <div className="pynk-form-row">
                <div className="pynk-field">
                  <label htmlFor="pynk-people">{c.form.people}</label>
                  <input
                    id="pynk-people"
                    name="people"
                    value={formData.people}
                    onChange={(e) => setFormData({ ...formData, people: e.target.value })}
                    placeholder={c.form.peoplePlaceholder}
                  />
                </div>
                <div className="pynk-field">
                  <label htmlFor="pynk-sector">{c.form.sector}</label>
                  <input
                    id="pynk-sector"
                    name="sector"
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    placeholder={c.form.sectorPlaceholder}
                  />
                </div>
              </div>

              <div className="pynk-field">
                <label htmlFor="pynk-email">{c.form.email}</label>
                <input
                  id="pynk-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={c.form.emailPlaceholder}
                />
              </div>

              <div className="pynk-field">
                <label htmlFor="pynk-phone">
                  {c.form.phone} <span className="pynk-muted">{c.form.phoneOptional}</span>
                </label>
                <input
                  id="pynk-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={c.form.phonePlaceholder}
                />
              </div>

              <div className="pynk-field">
                <label htmlFor="pynk-message">{c.form.message}</label>
                <textarea
                  id="pynk-message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={c.form.messagePlaceholder}
                />
              </div>

              {feedback && <p className={`pynk-feedback pynk-feedback-${feedback.kind}`}>{feedback.text}</p>}

              <button type="submit" disabled={sending} className="pynk-btn pynk-btn-primary pynk-btn-block pynk-group">
                <Send className="pynk-icon-sm pynk-arrow" />
                {c.form.submit}
              </button>
            </motion.form>
          </div>
        </div>
      </section>
    </div>
  );
}

export function PynkStudioContattaciPage() {
  return (
    <PynkShell>
      <ContattaciInner />
    </PynkShell>
  );
}
