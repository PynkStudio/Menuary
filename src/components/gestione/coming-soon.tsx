import { Sparkles } from "lucide-react";

export function ComingSoon({
  eyebrow,
  title,
  description,
  bullets,
}: {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="ga-dashboard">
      <header>
        <span className="ga-eyebrow">{eyebrow}</span>
        <h1 className="ga-heading">{title}</h1>
        <p className="ga-lead">{description}</p>
      </header>

      <section className="ga-card ga-coming">
        <div className="ga-coming-head">
          <span className="ga-coming-badge">
            <Sparkles size={12} strokeWidth={2.2} />
            In arrivo
          </span>
          <span className="ga-section-hint">Stiamo finalizzando l&apos;interfaccia</span>
        </div>
        <ul className="ga-coming-list">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
