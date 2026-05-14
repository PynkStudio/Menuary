import { parseFrom, tenantSlugFromFrom } from "@/lib/login-url";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { LoginPortalTheme } from "@/components/login-portal/login-portal-theme";
import { LoginPortalRecoveryForm } from "@/components/login-portal/login-portal-recovery-form";

export default async function RecuperaPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const sp = await searchParams;
  const from = parseFrom(sp.from);

  const slug = tenantSlugFromFrom(from);
  const tenant = slug ? TENANTS.find((t) => t.id === slug) : null;
  const accentColor = tenant?.theme?.red ?? "#B8332E";
  const themeCssVars = tenant ? tenantThemeCssVars(tenant.theme) : {};

  return (
    <LoginPortalTheme from={from}>
      <div
        className="flex min-h-screen items-center justify-center p-6"
        style={{ "--login-accent": accentColor, ...themeCssVars } as React.CSSProperties}
      >
        <div className="w-full max-w-sm">
          <div className="rounded-3xl bg-white px-8 py-10 shadow-xl shadow-black/5">
            <LoginPortalRecoveryForm from={from} accentColor={accentColor} />
          </div>
          <p className="mt-6 text-center text-[11px] text-black/30">
            Menuary · accesso sicuro
          </p>
        </div>
      </div>
    </LoginPortalTheme>
  );
}
