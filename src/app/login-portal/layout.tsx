import type { Metadata } from "next";
import { HashTokenRedirector } from "@/components/login-portal/hash-token-redirector";

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
      <HashTokenRedirector />
      {children}
    </div>
  );
}
