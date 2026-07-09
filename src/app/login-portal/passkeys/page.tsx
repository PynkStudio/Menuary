import { redirect } from "next/navigation";
import { LoginPortalTheme } from "@/components/login-portal/login-portal-theme";
import { PasskeySettingsPanel } from "@/components/shared/passkey-settings-panel";
import { buildLoginUrl, parseFrom, parseNext, resolveDestination } from "@/lib/login-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveUserAccess } from "@/lib/user-access";

export default async function LoginPortalPasskeysPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    next?: string;
  }>;
}) {
  const sp = await searchParams;
  const from = parseFrom(sp.from) ?? "clienti";
  const next = parseNext(sp.next);
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginUrl({ from }));
  }

  const access = await resolveUserAccess(supabase, user.id);
  const returnHref = resolveDestination({
    from,
    next,
    isSiteadmin: access.isSiteadmin,
    tenantId: access.tenantId,
  });

  return (
    <LoginPortalTheme from={from}>
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-xl shadow-black/5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">
            Menuary · accesso sicuro
          </p>
          <div className="mt-5">
            <PasskeySettingsPanel returnHref={returnHref} />
          </div>
        </div>
      </main>
    </LoginPortalTheme>
  );
}
