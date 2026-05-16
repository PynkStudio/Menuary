import { Lock } from "lucide-react";

const LOGIN_BASE = "https://login.menuary.it";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const loginUrl = new URL(LOGIN_BASE);
  loginUrl.searchParams.set("from", "admin");
  if (next && next !== "/") loginUrl.searchParams.set("next", next);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-900 p-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#B8332E] text-white">
          <Lock size={22} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#B8332E]">Menuary</p>
        <h1 className="mt-1 text-3xl font-bold text-neutral-900">Area riservata</h1>
        <p className="mt-1 text-sm text-neutral-500">Back-office piattaforma</p>
        <p className="mt-5 text-sm text-neutral-600">
          Accedi con il tuo account Menuary per continuare.
        </p>
        <a
          href={loginUrl.toString()}
          className="mt-6 block w-full rounded-full bg-[#B8332E] px-6 py-3 text-center font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
        >
          Accedi
        </a>
      </div>
    </div>
  );
}
