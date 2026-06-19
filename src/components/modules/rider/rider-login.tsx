"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bike } from "lucide-react";

export function RiderLogin({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/rider/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, accessCode: code.trim() }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Codice non valido");
    }
    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        background: "rgb(var(--tenant-cream, 252 248 244))",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          borderRadius: 16,
          padding: "32px 24px",
          boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Bike size={36} strokeWidth={1.8} style={{ color: "rgb(var(--tenant-red, 180 30 30))" }} />
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: 10, marginBottom: 4 }}>
            Area rider
          </h1>
          <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>{tenantName}</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: "0.78rem", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Codice accesso
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Es. MAR4A2"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1.5px solid rgba(0,0,0,0.15)",
                fontSize: "1.1rem",
                fontFamily: "monospace",
                letterSpacing: "0.1em",
                textAlign: "center",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "#c0392b", fontSize: "0.82rem", margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: "rgb(var(--tenant-red, 180 30 30))",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading || !code.trim() ? 0.6 : 1,
            }}
          >
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>
      </div>
    </div>
  );
}
