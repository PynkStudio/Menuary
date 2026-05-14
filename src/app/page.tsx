import { headers } from "next/headers";
import { getPlatformModeFromHost } from "@/lib/platform";
import { MarketingHomePage } from "@/components/marketing/pages/home";
import { VerticalBHomePage } from "@/components/vertical-b/pages/home";
import { TenantHomePage } from "@/components/tenants/_shared/pages/home";

export default async function HomePage() {
  const mode = getPlatformModeFromHost((await headers()).get("host"));

  if (mode === "marketing")   return <MarketingHomePage />;
  if (mode === "marketing-b") return <VerticalBHomePage />;
  return <TenantHomePage />;
}
