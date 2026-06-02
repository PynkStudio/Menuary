import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Demo non disponibile",
  robots: { index: false, follow: false },
};

export default async function DemoOfflinePage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string }>;
}) {
  const { vertical } = await searchParams;
  const email = vertical === "services" ? "hello@bizery.it" : "hello@menuary.it";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f5ef] px-6 py-16 text-[#211d19]">
      <section className="w-full max-w-xl rounded-3xl border border-black/10 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a33a31]">
          Demo offline
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Questa demo non è più disponibile.
        </h1>
        <p className="mt-5 text-base leading-7 text-black/65">
          Per informazioni o per richiedere una nuova presentazione, contattaci a{" "}
          <a className="font-bold text-[#a33a31] hover:underline" href={`mailto:${email}`}>
            {email}
          </a>
          .
        </p>
      </section>
    </main>
  );
}
