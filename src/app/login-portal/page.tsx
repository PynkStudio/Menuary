import { redirect } from "next/navigation";
import { parseFrom, parseNext, tenantSlugFromFrom, resolveDestination } from "@/lib/login-url";
import { resolveUserAccess } from "@/lib/user-access";
import { TENANTS } from "@/lib/tenant-registry";
import { tenantThemeCssVars } from "@/lib/tenant-theme";
import { LoginPortalForm } from "@/components/login-portal/login-portal-form";
import { LoginPortalTheme } from "@/components/login-portal/login-portal-theme";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  // Utente già autenticato che arriva direttamente su login.menuary.it
  if (!popup) {
    const supabase = await createSupabaseServerClient(".menuary.it");
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (from) {
        // Aveva un from: prova a mandarlo alla destinazione corretta
        const access = await resolveUserAccess(supabase, user.id);
        const destination = resolveDestination({
          from,
          next,
          isSiteadmin: access.isSiteadmin,
          tenantId: access.tenantId,
        });
        // Passa per il route handler che riscrive il cookie con Domain=.menuary.it
        // prima di atterrare sul sottodominio di destinazione (es. admin.menuary.it).
        redirect(`/api/auth/elevate-session?destination=${encodeURIComponent(destination)}`);
      }
      // Nessun from: mostra la pagina di selezione portali
      redirect("/portali");
    }
  }

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
