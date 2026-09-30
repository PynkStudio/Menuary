import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PLATFORM_MODE_HEADER, getPlatformModeFromHeaderValue } from "@/lib/platform";
import {
  MENUARY_LANDINGS,
  canPreviewUnpublishedLandings,
  findMenuaryLanding,
  isMenuaryLandingPublished,
} from "@/lib/menuary-landings";
import {
  MenuaryLandingPage,
  menuaryLandingMetadata,
} from "@/components/marketing/landings/landing-page";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return MENUARY_LANDINGS.map((landing) => ({ slug: landing.slug }));
}

export async function generateMetadata({ params }: Props) {
  const landing = findMenuaryLanding((await params).slug);
  return landing ? menuaryLandingMetadata(landing.slug) : {};
}

// Servita su menuary.it/ristoranti/<slug>: il middleware riscrive il path pubblico qui.
export default async function MenuaryLandingRoute({ params }: Props) {
  const h = await headers();
  if (getPlatformModeFromHeaderValue(h.get(PLATFORM_MODE_HEADER), h.get("host")) !== "marketing") notFound();
  const landing = findMenuaryLanding((await params).slug);
  if (!landing) notFound();
  if (!isMenuaryLandingPublished(landing.slug) && !canPreviewUnpublishedLandings()) notFound();
  return <MenuaryLandingPage slug={landing.slug} />;
}
