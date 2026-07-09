import Link from "next/link";
import { Download, ShieldCheck, Smartphone, Wifi } from "lucide-react";

const apkHref = "/downloads/menuary-print-agent.apk";

export function AppDownloadPage() {
  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#17130f]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between gap-6 border-b border-[#17130f]/10 pb-5">
          <Link href="https://menuary.it" className="font-serif text-3xl italic tracking-tight text-[#18231f]">
            menuary
          </Link>
          <span className="hidden text-sm font-medium text-[#776d61] sm:block">Print Agent per POS SUNMI</span>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-normal text-[#17130f] sm:text-5xl">
              Menuary Print Agent
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#5f564d]">
              App Android per terminali POS SUNMI: riceve gli ordini del locale e stampa le comande sulla stampante integrata.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={apkHref}
                download
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#8f2d20] px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-[#762419]"
              >
                <Download size={20} />
                Scarica APK Android
              </a>
              <Link
                href="/downloads/menuary-print-agent-installazione.md"
                className="inline-flex items-center justify-center rounded-xl border border-[#17130f]/15 bg-white px-6 py-4 text-base font-semibold text-[#17130f] transition hover:border-[#17130f]/35"
              >
                Guida installazione
              </Link>
            </div>

            <p className="mt-4 text-sm text-[#776d61]">
              Versione test: installazione diretta APK. L&apos;accesso all&apos;app richiede credenziali Menuary abilitate.
            </p>
          </div>

          <div className="rounded-3xl border border-[#17130f]/10 bg-white p-5 shadow-[0_24px_80px_rgba(23,19,15,0.12)]">
            <div className="rounded-2xl bg-[#18231f] p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="font-serif text-2xl italic text-[#d2b66d]">m</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">SUNMI V3 PLUS</span>
              </div>
              <div className="mt-12 space-y-3">
                <div className="h-3 w-3/4 rounded-full bg-white/75" />
                <div className="h-3 w-1/2 rounded-full bg-white/35" />
              </div>
              <div className="mt-10 rounded-2xl bg-white p-4 text-[#17130f]">
                <div className="text-sm font-semibold">Ordine #1042</div>
                <div className="mt-2 h-2 w-full rounded-full bg-[#f0e8da]" />
                <div className="mt-2 h-2 w-2/3 rounded-full bg-[#f0e8da]" />
                <button className="mt-5 w-full rounded-xl bg-[#8f2d20] py-3 text-sm font-semibold text-white">
                  Ristampa comanda
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                { icon: Smartphone, title: "POS", text: "SUNMI OS" },
                { icon: Wifi, title: "Polling", text: "ordini live" },
                { icon: ShieldCheck, title: "Login", text: "Menuary" },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-[#17130f]/10 bg-[#fbf8f1] p-4">
                  <item.icon size={18} className="text-[#8f2d20]" />
                  <div className="mt-3 text-sm font-semibold">{item.title}</div>
                  <div className="text-xs text-[#776d61]">{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
