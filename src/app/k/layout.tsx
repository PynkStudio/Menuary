import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Kiosk",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kiosk-root">
      {children}
    </div>
  );
}
