import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/data/tenant";
import { buildTenantIconSet } from "@/lib/favicon";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { TenantProvider } from "@/components/core/tenant-provider";

interface Props {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant) return {};

  return {
    title: { absolute: `${tenant.name} · operativo` },
    robots: { index: false, follow: false },
    icons: buildTenantIconSet(tenant),
  };
}

export default async function OperationalLayout({ children, params }: Props) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant) notFound();
  const cssVars = tenantThemeCssVars(tenant.theme);

  return (
    <TenantProvider tenant={tenant}>
      <div
        className="gestione-admin"
        data-gestione-tenant={tenantSlug}
        data-tenant-surface={tenantSlug}
        data-operational-surface="true"
        style={{
          ...cssVars,
          ["--ga-accent" as string]: tenant.theme.red,
          ["--ga-accent-soft" as string]: `${tenant.theme.red}24`,
          ["--ga-accent-ring" as string]: `${tenant.theme.red}52`,
        } as React.CSSProperties}
      >
        <main className="ga-main">{children}</main>
      </div>
    </TenantProvider>
  );
}
