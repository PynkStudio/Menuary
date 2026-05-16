import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPlatformModeFromHost } from "@/lib/platform";
import { StudioShell } from "@/components/studio/studio-shell";
import { BizeryStudioShell } from "@/components/bizery-studio/bizery-studio-shell";

export default async function StudioPortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const mode = getPlatformModeFromHost((await headers()).get("host"));
  if (mode !== "studio" && mode !== "studio-bizery") notFound();
  if (mode === "studio-bizery") return <BizeryStudioShell>{children}</BizeryStudioShell>;
  return <StudioShell>{children}</StudioShell>;
}
