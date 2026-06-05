interface PreviewNoSlugProps {
  mode: "preview" | "preview-bizery";
}

export function PreviewNoSlug({ mode }: PreviewNoSlugProps) {
  const isBizery = mode === "preview-bizery";
  const domain = isBizery ? "demo.bizery.it" : "demo.menuary.it";
  const placeholder = isBizery ? "la-tua-azienda" : "il-tuo-locale";

  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2rem",
        padding: "2rem",
        background: "#0f0f0f",
        color: "#f5f5f5",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Emoji + titolo */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: "0.75rem" }}>🤔</div>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: 0,
          }}
        >
          Dimenticato qualcosa?
        </h1>
        <p
          style={{
            marginTop: "0.5rem",
            color: "#888",
            fontSize: "1rem",
            fontWeight: 400,
          }}
        >
          Ogni demo ha il suo indirizzo. Lo slug manca!
        </p>
      </div>

      {/* Finta barra URL */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#1a1a1a",
          border: "1px solid #2e2e2e",
          borderRadius: "0.75rem",
          padding: "0.875rem 1.125rem",
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          boxShadow: "0 0 0 4px rgba(255,255,255,0.04)",
        }}
      >
        {/* pallini stile browser */}
        <div style={{ display: "flex", gap: "0.35rem", flexShrink: 0 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span
              key={c}
              style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "block" }}
            />
          ))}
        </div>

        {/* contenuto barra */}
        <div
          style={{
            flex: 1,
            background: "#111",
            borderRadius: "0.375rem",
            padding: "0.4rem 0.75rem",
            fontSize: "0.875rem",
            fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "flex",
            alignItems: "center",
            gap: "0",
          }}
        >
          <span style={{ color: "#555" }}>{domain}/</span>
          <span
            style={{
              color: "#e0e0e0",
              background: "rgba(255,255,255,0.07)",
              borderRadius: "0.2rem",
              padding: "0 0.3rem",
              borderBottom: "2px solid #6c63ff",
            }}
          >
            {placeholder}
          </span>
        </div>
      </div>


    </div>
  );
}
