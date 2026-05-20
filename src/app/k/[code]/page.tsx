import { notFound } from "next/navigation";
import { KioskApp } from "@/components/kiosk/kiosk-app";

export const dynamic = "force-dynamic";

export default async function KioskRoute({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code || code.length < 4) notFound();
  return <KioskApp pairingCode={code.toUpperCase()} />;
}
