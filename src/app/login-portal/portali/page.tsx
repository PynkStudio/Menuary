import { redirect } from "next/navigation";
import { Users, Store, ShieldCheck, ArrowRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PortalKey, PortalEntry } from "@/lib/user-access";
import { portalEntriesForAccess, resolveUserAccessForUserId } from "@/lib/user-access-server";

const ICONS: Record<PortalKey, React.ElementType> = {
  clienti: Users,
  gestione: Store,
  admin: ShieldCheck,
};

const COLORS: Record<PortalKey, string> = {
  clienti: "#2563eb",
  gestione: "#16a34a",
  admin: "#B8332E",
};

function portalHref(portal: PortalEntry): string {
  // I portali su sottodomini *.menuary.it vanno attraverso il route handler
  // che riscrive il cookie con Domain=.menuary.it prima del redirect finale.
  if (portal.key === "admin" || portal.key === "gestione") {
    return `/api/auth/elevate-session?destination=${encodeURIComponent(portal.href)}`;
  }
  return portal.href;
}

function PortalCard({ portal }: { portal: PortalEntry }) {
  const Icon = ICONS[portal.key];
  const color = COLORS[portal.key];
  return (
    <a
      href={portalHref(portal)}
      className="group flex items-center gap-4 rounded-2xl border border-black/8 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
        style={{ backgroundColor: color }}
      >
        <Icon size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-base">{portal.label}</p>
        <p className="mt-0.5 text-sm text-black/50">{portal.description}</p>
      </div>
      <ArrowRight
        size={18}
        className="shrink-0 text-black/20 transition group-hover:text-black/50 group-hover:translate-x-0.5"
      />
    </a>
  );
}

export default async function PortaliPage() {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const access = await resolveUserAccessForUserId(user.id);
  const portals = portalEntriesForAccess(access);

  if (portals.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F0EA] p-6">
        <div className="w-full max-w-sm rounded-3xl bg-white px-8 py-10 shadow-xl shadow-black/5 text-center">
          <p className="text-xl font-bold">Nessun accesso attivo</p>
          <p className="mt-2 text-sm text-black/50">
            Il tuo account non ha ancora portali abilitati. Contatta il supporto.
          </p>
        </div>
      </div>
    );
  }

  if (portals.length === 1) {
    redirect(portalHref(portals[0]));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F0EA] p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-3xl bg-white px-8 py-10 shadow-xl shadow-black/5">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/5">
              <ShieldCheck size={20} className="text-black/50" />
            </div>
            <h1 className="text-xl font-bold">Dove vuoi andare?</h1>
            <p className="mt-1 text-sm text-black/40">
              Il tuo account ha accesso a {portals.length} portali
            </p>
          </div>

          <div className="space-y-3">
            {portals.map((p) => (
              <PortalCard key={p.key} portal={p} />
            ))}
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] text-black/30">
          Menuary · accesso sicuro
        </p>
      </div>
    </div>
  );
}
