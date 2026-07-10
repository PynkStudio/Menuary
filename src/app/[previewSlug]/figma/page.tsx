import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { resolveTenantFromPreviewSlug } from "@/lib/tenant-runtime";

export default async function FigmaPreviewPage({
  params,
}: {
  params: Promise<{ previewSlug: string }>;
}) {
  const host = (await headers()).get("host");
  const mode = getPlatformModeFromHost(host);
  if (mode !== "preview" && mode !== "preview-bizery" && mode !== "preview-orpheo") notFound();

  const { previewSlug } = await params;
  const tenant = resolveTenantFromPreviewSlug(previewSlug);
  if (!tenant || tenant.previewSlug !== previewSlug) notFound();

  // L'HTML Anima viene servito come file statico da public/(slug)/anima/index.html.
  // I path relativi delle risorse (immagini, CSS, font) si risolvono automaticamente
  // nel contesto dell'iframe, senza nessun processing aggiuntivo.
  const animaSrc = `/${previewSlug}/anima/index.html`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "#f1f5f9",
      }}
    >
      {/* Barra contestuale minimale — non interferisce con il design Figma */}
      <div
        style={{
          height: 36,
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingInline: 16,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.05em",
          }}
        >
          figma preview — {tenant.name}
        </span>
        <a
          href={`/${previewSlug}`}
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.4)",
            textDecoration: "none",
            fontFamily: "monospace",
          }}
        >
          ← sito
        </a>
      </div>

      <iframe
        src={animaSrc}
        title={`${tenant.name} — design Figma`}
        style={{ flex: 1, border: "none", width: "100%", display: "block" }}
      />
    </div>
  );
}
