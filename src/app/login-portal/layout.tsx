import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accedi · Menuary",
  robots: { index: false, follow: false },
};

export default function LoginPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F5F0EA] antialiased">
      {children}
    </div>
  );
}
