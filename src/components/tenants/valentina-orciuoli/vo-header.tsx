import { valentinaBasePath } from "./content";

export function ValentinaOrciuoliHeader() {
  return (
    <header className="vo-header">
      <a className="vo-brand" href={valentinaBasePath} aria-label="Valentina Orciuoli">
        <span className="vo-brand-mark">VO</span>
      </a>
      <nav className="vo-nav" aria-label="Menu principale">
        <a href={valentinaBasePath}>Home</a>
        <a href={`${valentinaBasePath}/libri`}>Libri</a>
        <a href={`${valentinaBasePath}/autrice`}>Autrice</a>
        <a href={`${valentinaBasePath}/eventi`}>Eventi</a>
        <a href={`${valentinaBasePath}/contatti`}>Contatti</a>
      </nav>
    </header>
  );
}
