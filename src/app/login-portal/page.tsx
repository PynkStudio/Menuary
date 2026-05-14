import { parseFrom, parseNext, tenantSlugFromFrom } from "@/lib/login-url";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { LoginPortalForm } from "@/components/login-portal/login-portal-form";
import { LoginPortalTheme } from "@/components/login-portal/login-portal-theme";

export default async function LoginPortalPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    next?: string;
    popup?: string;
    error?: string;
  }>;
}) {
  const sp = await searchParams;
  const from = parseFrom(sp.from);
  const next = parseNext(sp.next);
  const popup = sp.popup === "1";
  const error = sp.error === "link-scaduto" ? "Il link non è più valido. Riprova ad accedere." : null;

  // Tenant branding server-side: accent color come CSS var inline
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
          {/* Card */}
          <div className="rounded-3xl bg-white px-8 py-10 shadow-xl shadow-black/5">
            <LoginPortalForm
              from={from}
              next={next}
              popup={popup}
              error={error}
            />
          </div>

          {/* Footer discreto */}
          <p className="mt-6 text-center text-[11px] text-black/30">
            Menuary · accesso sicuro
          </p>
        </div>
      </div>
    </LoginPortalTheme>
  );
}
