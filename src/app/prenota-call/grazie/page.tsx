import type { Metadata } from "next";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkStudioGraziePage } from "@/components/tenants/pynkstudio/pages/prenota-call-grazie";

export const metadata: Metadata = {
  title: { absolute: "Call prenotata — PYNK STUDIO" },
  robots: { index: false, follow: false },
};

export default async function GrazieRoute({
  searchParams,
}: {
  searchParams: Promise<{ slot?: string }>;
}) {
  await requirePynkstudioTenant();
  const { slot } = await searchParams;
  return <PynkStudioGraziePage slot={slot} />;
}
