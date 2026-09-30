import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import { canPreviewUnpublishedLandings } from "@/lib/menuary-landings";
import {
  MenuaryLandingHub,
  menuaryLandingHubMetadata,
} from "@/components/marketing/landings/landing-page";

// Servita su menuary.it/ristoranti: il middleware riscrive il path pubblico qui.
export function generateMetadata() {
  return menuaryLandingHubMetadata();
}

export default async function MenuaryLandingHubRoute() {
  const h = await headers();
  if (getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host")) !== "marketing") notFound();
  return <MenuaryLandingHub includeUnpublished={canPreviewUnpublishedLandings()} />;
}
