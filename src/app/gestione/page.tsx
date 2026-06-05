import { Lock } from "lucide-react";
import { getGestioneTranslations } from "@/i18n/gestione";

const LOGIN_BASE = "https://login.menuary.it";

export default async function GestioneRootPage() {
  const t = await getGestioneTranslations();
  const loginUrl = new URL(LOGIN_BASE);
  loginUrl.searchParams.set("from", "gestione");

  return (
    <div className="flex min-h-screen items-center justify-center bg-pork-ink p-6">
      <div className="w-full max-w-sm rounded-3xl bg-pork-cream p-8 shadow-2xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-pork-red text-white">
          <Lock size={22} />
        </div>
        <p className="impact-title text-xs text-pork-red">Menuary</p>
        <h1 className="headline mt-1 text-3xl">{t.root.title}</h1>
        <p className="mt-1 text-sm text-pork-ink/60">{t.root.subtitle}</p>
        <p className="mt-5 text-sm text-pork-ink/70">
          {t.root.body}
        </p>
        <a
          href={loginUrl.toString()}
          className="btn-primary mt-6 block w-full text-center"
        >
          {t.root.cta}
        </a>
      </div>
    </div>
  );
}
