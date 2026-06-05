import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { GestioneProfileForm } from "@/components/gestione/gestione-profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isDemoHost } from "@/lib/platform";
import { resolveSessionCookieDomain } from "@/lib/session-cookie-domain";
import { TENANTS } from "@/lib/tenant-registry";

type ProfileSource = {
  email: string | null;
  display_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  preferred_language?: string | null;
  role?: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  siteadmin: "Amministratore Menuary",
  tenantadmin: "Titolare",
  manager: "Manager",
  chef: "Chef",
  cameriere: "Cameriere",
  personale_cucina: "Personale cucina",
  kitdisplay: "Display cucina",
  kiosk: "Kiosk",
};

function splitDisplayName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export default async function GestioneProfiloPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = TENANTS.find((item) => item.id === tenantSlug);
  if (!tenant) notFound();

  const host = (await headers()).get("host");
  const isDemo = isDemoHost(host);

  if (isDemo) {
    return (
      <ProfilePageFrame>
        <GestioneProfileForm
          initial={{
            tenantSlug,
            email: "demo@menuary.it",
            roleLabel: "Demo",
            firstName: "Demo",
            lastName: "",
            preferredLanguage: "it",
          }}
        />
      </ProfilePageFrame>
    );
  }

  const supabase = await createSupabaseServerClient(resolveSessionCookieDomain(host));
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`https://login.menuary.it?from=gestione.${tenantSlug}`);

  const [{ data: siteadmin }, { data: tenantadmin }, { data: employee }, { data: adminUser }, { data: userProfile }] =
    await Promise.all([
      supabase.from("siteadmin").select("email, display_name, first_name, last_name, role").eq("user_id", user.id).eq("enabled", true).maybeSingle(),
      supabase.from("tenantadmin").select("email, display_name, first_name, last_name, preferred_language").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
      supabase.from("employee").select("email, display_name, first_name, last_name, preferred_language, role").eq("user_id", user.id).eq("tenant_id", tenantSlug).eq("enabled", true).maybeSingle(),
      supabase.from("admin_users").select("email, display_name, first_name, last_name, preferred_language, role").eq("auth_user_id", user.id).eq("tenant_id", tenantSlug).maybeSingle(),
      supabase.from("user_profiles").select("preferred_language").eq("user_id", user.id).maybeSingle(),
    ]);

  if (!siteadmin && !tenantadmin && !employee && !adminUser) notFound();

  const source: ProfileSource =
    tenantadmin
    ?? employee
    ?? adminUser
    ?? siteadmin
    ?? { email: user.email ?? null, display_name: null };
  const fallbackName = splitDisplayName(source.display_name);
  const firstName = source.first_name ?? fallbackName.firstName;
  const lastName = source.last_name ?? fallbackName.lastName;
  const roleKey = tenantadmin ? "tenantadmin" : employee?.role ?? adminUser?.role ?? (siteadmin ? "siteadmin" : "");
  const preferredLanguage =
    source.preferred_language
    ?? userProfile?.preferred_language
    ?? "it";

  return (
    <ProfilePageFrame>
      <GestioneProfileForm
        initial={{
          tenantSlug,
          email: source.email ?? user.email ?? "",
          roleLabel: ROLE_LABELS[roleKey] ?? roleKey,
          firstName,
          lastName,
          preferredLanguage,
        }}
      />
    </ProfilePageFrame>
  );
}

function ProfilePageFrame({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Account personale</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Profilo</h1>
      <p className="mt-3 max-w-2xl opacity-70">
        Gestisci le informazioni principali del tuo accesso al pannello.
      </p>
      <div className="mt-8">{children}</div>
    </div>
  );
}
