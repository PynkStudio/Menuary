import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Download, FileCode2, FileJson2, Info } from "lucide-react";
import { getPlatformModeFromHost } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Template designer · Menuary Admin",
};

const templateHref = "/design/menuary-site-template.svg";
const manifestHref = "/design/menuary-site-connectors.json";

export default async function TemplateDesignPage() {
  const host = (await headers()).get("host");
  if (getPlatformModeFromHost(host) !== "platform-admin") notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="max-w-3xl">
        <p className="impact-title text-xs text-pork-red">Design system</p>
        <h1 className="headline text-4xl">Template Figma per siti Menuary</h1>
        <p className="mt-2 text-pork-ink/65">
          File base da consegnare ai designer: contiene la struttura sito, i blocchi
          dinamici e i nomi dei connettori da mantenere quando personalizzano
          estetica, layout, immagini e tipografia.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <DownloadCard
          icon={<FileCode2 size={22} />}
          title="Template importabile in Figma"
          description="SVG con frame desktop/mobile, mockup homepage e layer connector.* per hero, menu, recensioni, staff, orari, sedi, contatti e footer."
          href={templateHref}
          download="menuary-site-template.svg"
          cta="Scarica SVG"
        />
        <DownloadCard
          icon={<FileJson2 size={22} />}
          title="Manifest connettori"
          description="Mappa JSON degli id, delle sorgenti dati e dei campi obbligatori. Utile per designer e sviluppo quando si controlla un export."
          href={manifestHref}
          download="menuary-site-connectors.json"
          cta="Scarica JSON"
        />
      </div>

      <section className="rounded-2xl bg-white p-6 ring-1 ring-pork-ink/10">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pork-red/10 text-pork-red">
            <Info size={18} />
          </span>
          <div>
            <h2 className="text-lg font-black text-pork-ink">Come usarlo</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-pork-ink/70">
              <li>In Figma: File → Import, seleziona <strong>menuary-site-template.svg</strong>.</li>
              <li>Duplica i frame e personalizza stile, griglie, foto, colori e componenti.</li>
              <li>Mantieni riconoscibili i layer con prefisso <strong>connector.</strong>, soprattutto per dati dinamici.</li>
              <li>Prima della consegna controlla il file con il manifest JSON scaricabile da questa pagina.</li>
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

function DownloadCard({
  icon,
  title,
  description,
  href,
  download,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  download: string;
  cta: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-6 ring-1 ring-pork-ink/10">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pork-ink text-pork-cream">
          {icon}
        </span>
        <div>
          <h2 className="text-lg font-black text-pork-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-pork-ink/62">{description}</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={href}
          download={download}
          className="inline-flex items-center gap-2 rounded-full bg-pork-red px-5 py-3 text-sm font-black text-white transition hover:bg-pork-red-dark"
        >
          <Download size={16} />
          {cta}
        </a>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-5 py-3 text-sm font-black text-pork-ink/70 transition hover:border-pork-red/30 hover:text-pork-red"
        >
          Anteprima
        </a>
      </div>
    </article>
  );
}
