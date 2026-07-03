"use client";

import Link from "next/link";
import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Code2, Instagram, Linkedin, Lock, Menu, Moon, Sun, X } from "lucide-react";
import { useTenantLocalizedHref } from "@/lib/use-tenant-localized-href";
import { usePynkCopy } from "@/lib/pynkstudio-i18n";
import { buildTenantManagementUrl } from "@/lib/login-url";

// ─── Nerd mode ────────────────────────────────────────────────────────────────

const NERD_STORAGE_KEY = "pynk:nerd-mode";

type PynkNerdContextValue = {
  nerd: boolean;
  toggleNerd: () => void;
};

const PynkNerdContext = createContext<PynkNerdContextValue | null>(null);

export function usePynkNerd() {
  const ctx = useContext(PynkNerdContext);
  if (!ctx) throw new Error("usePynkNerd must be used within PynkShell");
  return ctx;
}

// ─── Theme (light/dark, default: preferenza sistema) ─────────────────────────

const THEME_STORAGE_KEY = "pynk:theme";

type PynkTheme = "light" | "dark";

// ─── Magnetic logo text ───────────────────────────────────────────────────────

function PynkMagneticText({ text, className = "" }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [letterStyles, setLetterStyles] = useState<Array<{ scale: number; glow: number }>>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const nav = containerRef.current?.closest("nav");
    if (!nav || window.innerWidth < 768) return;

    const onMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const spans = containerRef.current?.querySelectorAll<HTMLSpanElement>("[data-letter]");
        if (!spans) return;
        const next: Array<{ scale: number; glow: number }> = [];
        spans.forEach((span) => {
          const rect = span.getBoundingClientRect();
          const dist = Math.hypot(e.clientX - (rect.left + rect.width / 2), e.clientY - (rect.top + rect.height / 2));
          const influence = Math.max(0, 1 - dist / 80);
          next.push({ scale: 1 + influence * 0.2, glow: influence });
        });
        setLetterStyles(next);
      });
    };
    const onLeave = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setLetterStyles([]);
    };
    nav.addEventListener("mousemove", onMove);
    nav.addEventListener("mouseleave", onLeave);
    return () => {
      nav.removeEventListener("mousemove", onMove);
      nav.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <span ref={containerRef} className={className} aria-label={text}>
      {text.split("").map((letter, i) => {
        const style = letterStyles[i];
        return (
          <span
            key={i}
            data-letter
            className="pynk-magnetic-letter"
            style={{
              transform: `scale(${style?.scale ?? 1})`,
              color: (style?.glow ?? 0) > 0.01 ? "var(--pynk-primary)" : undefined,
            }}
          >
            {letter === " " ? " " : letter}
          </span>
        );
      })}
    </span>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function PynkNavbar({ theme, onToggleTheme }: { theme: PynkTheme; onToggleTheme: () => void }) {
  const copy = usePynkCopy();
  const { nerd, toggleNerd } = usePynkNerd();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const href = useTenantLocalizedHref();

  // Il toggle "Nerd" agisce sui copy plain/nerd: ha senso solo in home.
  // Ignora l'eventuale prefisso lingua (es. /it, /en) prima di valutare la radice.
  const pathSegments = pathname.split("/").filter(Boolean);
  const segmentsWithoutLocale = pathSegments[0]?.length === 2 ? pathSegments.slice(1) : pathSegments;
  const isHome = segmentsWithoutLocale.length === 0;

  const navLinks = [
    { label: copy.nav.servizi, to: "/servizi" },
    { label: "AI Governance", to: "/ai-governance" },
    { label: "Soluzioni", to: "/soluzioni" },
    { label: copy.nav.settori, to: "/settori" },
    { label: copy.nav.lavori, to: "/lavori" },
    { label: copy.nav.consulenza, to: "/consulenza" },
  ];

  const isActive = (to: string) => pathname === to || pathname.endsWith(to);

  return (
    <nav className="pynk-nav">
      <div className="pynk-container pynk-nav-inner">
        <Link href={href("/")} className="pynk-logo" onClick={() => setMenuOpen(false)}>
          <Image src="/pynkstudio/pynk-logo-transparent.png" alt="Pynk Studio" width={64} height={64} className="pynk-logo-img" />
          <PynkMagneticText text="PYNK STUDIO" className="pynk-logo-text" />
        </Link>

        <div className="pynk-nav-links">
          {navLinks.map((link) => (
            <Link key={link.to} href={href(link.to)} className={`pynk-nav-link${isActive(link.to) ? " is-active" : ""}`}>
              {link.label}
            </Link>
          ))}
          {isHome && (
            <button
              type="button"
              onClick={toggleNerd}
              className={`pynk-nerd-toggle${nerd ? " is-on" : ""}`}
              aria-pressed={nerd}
              aria-label={nerd ? copy.nerdToggle.disable : copy.nerdToggle.enable}
              title={copy.nerdToggle.hint}
            >
              <Code2 className="pynk-icon-sm" />
              <span className="pynk-nerd-label">Nerd</span>
            </button>
          )}
          <button type="button" onClick={onToggleTheme} className="pynk-theme-toggle" aria-label="Cambia tema">
            {theme === "dark" ? <Sun className="pynk-icon-sm" /> : <Moon className="pynk-icon-sm" />}
          </button>
          <Link href={href("/contattaci")} className="pynk-nav-cta">
            {copy.nav.contattaci}
          </Link>
        </div>

        <button type="button" className="pynk-nav-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
          {menuOpen ? <X className="pynk-icon" /> : <Menu className="pynk-icon" />}
        </button>
      </div>

      {menuOpen && (
        <div className="pynk-nav-mobile">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              href={href(link.to)}
              onClick={() => setMenuOpen(false)}
              className={`pynk-nav-mobile-link${isActive(link.to) ? " is-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pynk-nav-mobile-row">
            {isHome && (
              <button type="button" onClick={toggleNerd} className={`pynk-nerd-toggle${nerd ? " is-on" : ""}`} aria-pressed={nerd}>
                <Code2 className="pynk-icon-sm" />
                <span>Nerd</span>
              </button>
            )}
            <button type="button" onClick={onToggleTheme} className="pynk-theme-toggle" aria-label="Cambia tema">
              {theme === "dark" ? <Sun className="pynk-icon-sm" /> : <Moon className="pynk-icon-sm" />}
            </button>
          </div>
          <Link href={href("/contattaci")} onClick={() => setMenuOpen(false)} className="pynk-nav-cta pynk-nav-cta-mobile">
            {copy.nav.contattaci}
          </Link>
        </div>
      )}
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function PynkFooter() {
  const copy = usePynkCopy();
  const href = useTenantLocalizedHref();
  // Accesso staff/gestione sul dominio del tenant (gestione.pynkstudio.it).
  const staffUrl = buildTenantManagementUrl("pynkstudio");
  const links = [
    { label: copy.nav.servizi, to: "/servizi" },
    { label: "AI Governance", to: "/ai-governance" },
    { label: "AI Act", to: "/ai-act" },
    { label: "Blog AI Governance", to: "/blog/ai-governance" },
    { label: copy.nav.settori, to: "/settori" },
    { label: copy.nav.lavori, to: "/lavori" },
    { label: copy.nav.consulenza, to: "/consulenza" },
    { label: copy.nav.contattaci, to: "/contattaci" },
  ];

  return (
    <footer className="pynk-footer">
      <div className="pynk-container pynk-footer-inner">
        <div className="pynk-footer-links">
          {links.map((l) => (
            <Link key={l.to} href={href(l.to)} className="pynk-footer-link">
              {l.label}
            </Link>
          ))}
          {staffUrl && (
            <a href={staffUrl} className="pynk-footer-link pynk-footer-staff">
              <Lock className="pynk-icon-xs" />
              {copy.footer.staff}
            </a>
          )}
        </div>
        <div className="pynk-footer-meta">
          <span>
            © {new Date().getFullYear()} <span className="pynk-footer-brand">PYNK STUDIO</span>
          </span>
          <span>·</span>
          <span>{copy.footer.piva}</span>
          <span>·</span>
          <span>{copy.footer.address}</span>
          <span>·</span>
          <a href="https://www.linkedin.com/company/pynkstudio" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="pynk-footer-social">
            <Linkedin className="pynk-icon-xs" />
          </a>
          <a
            href="https://www.instagram.com/pynkstudios"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @pynkstudios"
            className="pynk-footer-social"
          >
            <Instagram className="pynk-icon-xs" />
            <span>@pynkstudios</span>
          </a>
          <span>·</span>
          <a href="https://bizery.it" target="_blank" rel="noopener noreferrer" className="pynk-footer-powered">
            {copy.footer.poweredBy} <span className="pynk-footer-bizery">Bizery</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── Shell ────────────────────────────────────────────────────────────────────

export function PynkShell({ children, chromeless = false }: { children: React.ReactNode; chromeless?: boolean }) {
  const [nerd, setNerd] = useState(false);
  const [theme, setTheme] = useState<PynkTheme>("dark");

  useEffect(() => {
    try {
      setNerd(localStorage.getItem(NERD_STORAGE_KEY) === "1");
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      } else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
        setTheme("light");
      }
    } catch {
      /* storage non disponibile: restano i default */
    }
  }, []);

  const toggleNerd = useCallback(() => {
    setNerd((v) => {
      try {
        localStorage.setItem(NERD_STORAGE_KEY, v ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !v;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const nerdValue = useMemo(() => ({ nerd, toggleNerd }), [nerd, toggleNerd]);

  return (
    <PynkNerdContext.Provider value={nerdValue}>
      <div className="pynk-site" data-pynk-theme={theme}>
        {!chromeless && <PynkNavbar theme={theme} onToggleTheme={toggleTheme} />}
        {children}
        {!chromeless && <PynkFooter />}
      </div>
    </PynkNerdContext.Provider>
  );
}
