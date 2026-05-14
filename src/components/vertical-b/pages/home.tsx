/**
 * TODO: Marketing home page del secondo verticale (services).
 *
 * Questa cartella è uno scaffold. Quando il nome e il brand del verticale
 * saranno definiti, rinominare la cartella `vertical-b` con il nome scelto
 * e sviluppare le pagine seguendo lo stesso pattern di:
 *   src/components/marketing/pages/home.tsx
 *
 * Passi per completare:
 *   1. Rinominare src/components/vertical-b/ → src/components/[nome-verticale]/
 *   2. Aggiornare l'import in src/app/page.tsx
 *   3. Definire palette, font e identità visiva del nuovo brand
 *   4. Aggiornare VERTICAL_REGISTRY in src/lib/vertical.ts (productName, marketingDomain)
 *   5. Aggiornare PLATFORM_HOSTS in src/lib/platform.ts con il dominio reale
 *   6. Sviluppare le sezioni: hero, servizi, audience, come lavoriamo, demo, CTA
 */

export function VerticalBHomePage() {
  return (
    <div style={{ padding: "4rem 2rem", fontFamily: "sans-serif" }}>
      <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#888" }}>
        Secondo verticale · placeholder
      </p>
      <h1 style={{ fontSize: "3rem", marginTop: "1rem" }}>
        Coming soon.
      </h1>
      <p style={{ marginTop: "1rem", color: "#666" }}>
        Questa pagina sarà la home del marketing site per il ramo non ristorativo.
      </p>
    </div>
  );
}
