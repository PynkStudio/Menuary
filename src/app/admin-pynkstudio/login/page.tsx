import { Lock } from "lucide-react";

const LOGIN_BASE = "https://login.menuary.it";

export default async function PynkAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const loginUrl = new URL(LOGIN_BASE);
  loginUrl.searchParams.set("from", "admin-pynkstudio");
  if (next && next !== "/") loginUrl.searchParams.set("next", next);

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: "hsl(240 8% 6%)" }}>
      <div className="w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center" style={{ background: "hsl(330 20% 97%)" }}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-white" style={{ background: "hsl(330 80% 52%)" }}>
          <Lock size={22} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(330 80% 52%)" }}>PynkStudio</p>
        <h1 className="mt-1 text-3xl font-bold" style={{ color: "hsl(330 15% 12%)" }}>Area riservata</h1>
        <p className="mt-1 text-sm" style={{ color: "hsl(330 10% 45%)" }}>Pannello di controllo aziendale</p>
        <p className="mt-5 text-sm" style={{ color: "hsl(330 10% 35%)" }}>
          Accedi con il tuo account per continuare.
        </p>
        <a
          href={loginUrl.toString()}
          className="mt-6 block w-full rounded-full px-6 py-3 text-center font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
          style={{ background: "hsl(330 80% 52%)" }}
        >
          Accedi
        </a>
      </div>
    </div>
  );
}
