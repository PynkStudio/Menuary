import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { StudioShell } from "@/components/studio/studio-shell";

export default async function StudioPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (getPlatformModeFromHost((await headers()).get("host")) !== "studio") {
    notFound();
  }
  return <StudioShell>{children}</StudioShell>;
}
