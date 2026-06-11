"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Building2, Download, Instagram, Mail, Phone, Share2 } from "lucide-react";
import { PynkShell } from "../pynk-shell";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";

const VCARD_FILENAME = "massimo-pernozzoli-pynkstudio.vcf";
const PAGE_URL = "https://pynkstudio.it/ad/mp";

const buildVCard = () =>
  [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "FN:Massimo Pernozzoli",
    "N:Pernozzoli;Massimo;;;",
    "ORG:Pynk Studio",
    "TITLE:CEO",
    "TEL;TYPE=CELL:+393513768607",
    "EMAIL;TYPE=INTERNET:info@pynkstudio.it",
    "URL:https://pynkstudio.it",
    "URL:https://www.instagram.com/mpernozzoli",
    "URL:https://www.instagram.com/pynkstudios",
    "END:VCARD",
    "",
  ].join("\r\n");

const triggerDownload = (body: string) => {
  const blob = new Blob([body], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = VCARD_FILENAME;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

function VisitCardInner() {
  const copy = usePynkCopy();
  const c = copy.visitCard;
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDownload = () => {
    triggerDownload(buildVCard());
    showToast(c.toastDownloaded);
  };

  const handleShare = async () => {
    const vcard = buildVCard();
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const file = new File([blob], VCARD_FILENAME, { type: "text/vcard" });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Massimo Pernozzoli — Pynk Studio" });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    triggerDownload(vcard);
    showToast(c.toastDownloaded);
  };

  return (
    <div className="pynk-page pynk-vcard-page">
      <div className="pynk-vcard">
        <div className="pynk-vcard-inner">
          <Image src="/pynkstudio/pynk-logo-transparent.png" alt="" width={64} height={64} className="pynk-vcard-logo" />

          <div>
            <h1 className="pynk-vcard-name">{c.name}</h1>
            <p className="pynk-vcard-role">
              <Building2 className="pynk-icon-xs" />
              {c.role}
            </p>
          </div>

          <div className="pynk-vcard-rows">
            <a href={c.phoneHref} className="pynk-vcard-row">
              <Phone className="pynk-icon-xs pynk-accent" />
              <span>{c.phoneLabel}</span>
            </a>
            <a href={`mailto:${c.email}`} className="pynk-vcard-row">
              <Mail className="pynk-icon-xs pynk-accent" />
              <span>{c.email}</span>
            </a>
            <a href="https://www.instagram.com/mpernozzoli" target="_blank" rel="noopener noreferrer" className="pynk-vcard-row">
              <Instagram className="pynk-icon-xs pynk-accent" />
              <span>@mpernozzoli</span>
            </a>
            <a href="https://www.instagram.com/pynkstudios" target="_blank" rel="noopener noreferrer" className="pynk-vcard-row">
              <Instagram className="pynk-icon-xs pynk-accent" />
              <span>@pynkstudios</span>
            </a>
          </div>

          <div className="pynk-vcard-actions">
            <button type="button" className="pynk-btn pynk-btn-primary" onClick={handleShare}>
              <Share2 className="pynk-icon-xs" />
              {c.saveContact}
            </button>
            <button type="button" className="pynk-btn pynk-btn-outline" onClick={handleDownload}>
              <Download className="pynk-icon-xs" />
              {c.downloadVcf}
            </button>
          </div>

          <div className="pynk-vcard-qr">
            <p className="pynk-note">{c.qrHint}</p>
            <div className="pynk-vcard-qr-box">
              <QRCodeSVG value={PAGE_URL} size={140} bgColor="#ffffff" fgColor="#1a1a1a" />
            </div>
          </div>
        </div>
      </div>

      <p className="pynk-vcard-home">
        <Link href="/">pynkstudio.it</Link>
      </p>

      {toast && <div className="pynk-toast">{toast}</div>}
    </div>
  );
}

export function PynkStudioVisitCardPage() {
  return (
    <PynkShell chromeless>
      <VisitCardInner />
    </PynkShell>
  );
}
