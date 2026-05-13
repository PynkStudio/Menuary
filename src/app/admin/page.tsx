"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Blocks,
  CalendarCheck,
  ChefHat,
  ClipboardList,
  QrCode,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import { useMenuStore } from "@/store/menu-store";
import { useSettingsStore } from "@/store/settings-store";
import { formatEuro } from "@/lib/price-utils";
import { useHydrated } from "@/components/providers";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { usePlatformMode } from "@/components/platform-mode-provider";

export default function AdminHome() {
  const mode = usePlatformMode();
  const router = useRouter();
  const hydrated = useHydrated();
  const [settingsReady, setSettingsReady] = useState(() =>
    useSettingsStore.persist.hasHydrated(),
  );
  const items = useMenuStore((s) => s.items);
  const orders = useMenuStore((s) => s.orders);
  const sessions = useMenuStore((s) => s.sessions);
  const {
    allowTakeaway,
    allowTableOrders,
    orderKioskEnabled,
    kitchenDisplayEnabled: kitchenOn,
    modules,
  } = useEffectiveFeatures();
  const showOrdini = allowTakeaway || allowTableOrders || orderKioskEnabled;
  const showTavoli = allowTableOrders;
  const ordersModuleOn = showOrdini;
  const advancedServicesOn = Boolean(
    modules.orderKiosk ||
      modules.reservations ||
      modules.tablePlanner ||
      modules.productAvailability ||
      modules.upselling ||
      modules.crm ||
      modules.analytics ||
      modules.takeawaySlots ||
      modules.deliveryHub ||
      modules.inventoryFoodCost ||
      modules.printStations ||
      modules.staffRoles ||
      modules.multiLocation,
  );

  useEffect(() => {
    if (useSettingsStore.persist.hasHydrated()) {
      setSettingsReady(true);
      return;
    }
    return useSettingsStore.persist.onFinishHydration(() => {
      setSettingsReady(true);
    });
  }, []);

  useEffect(() => {
    if (mode === "platform-admin") return;
    if (!settingsReady) return;
    if (!ordersModuleOn) router.replace("/admin/menu");
  }, [settingsReady, ordersModuleOn, router, mode]);

  const stats = useMemo(() => {
    const total = items.length;
    const unavailable = items.filter((i) => !i.available).length;
    const openOrders = orders.filter(
      (o) => o.status === "nuovo" || o.status === "in_preparazione",
    ).length;
    const todayRevenue = orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate() &&
          o.status !== "annullato"
        );
      })
      .reduce((a, o) => a + o.total, 0);
    const tablesOpen = sessions.filter((s) => s.status === "aperta").length;
    return { total, unavailable, openOrders, todayRevenue, tablesOpen };
  }, [items, orders, sessions]);

  if (mode === "platform-admin") {
    return (
      <div className="space-y-8">
        <header>
          <p className="impact-title text-xs text-pork-red">Menuary</p>
          <h1 className="headline text-4xl">Controllo piattaforma</h1>
          <p className="mt-2 max-w-2xl text-pork-ink/60">
            Gestione centrale dei tenant, dei moduli abilitati e delle anteprime
            commerciali in attesa del dominio definitivo.
          </p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <Quick
            href="/admin/tenant"
            title="Gestisci tenant"
            desc="Attivazioni, moduli, demo e profili configurabili"
            icon={<Settings size={22} />}
          />
          <Quick
            href="https://demo.menuary.it/bepork-demo"
            title="Apri preview esempio"
            desc="Verifica il flusso demo prima dell'attivazione dominio"
            icon={<QrCode size={22} />}
            external
          />
        </div>
      </div>
    );
  }

  if (!settingsReady || !ordersModuleOn) {
    return <p className="text-pork-ink/50">Caricamento…</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="headline text-4xl">Dashboard</h1>
        <p className="text-pork-ink/60">
          Panoramica del locale: menu, ordini e moduli attivi.
        </p>
      </header>

      {hydrated && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Stat
            label="Piatti totali"
            value={stats.total.toString()}
            tone="ink"
          />
          <Stat
            label="Non disponibili"
            value={stats.unavailable.toString()}
            tone="mustard"
          />
          <Stat
            label="Ordini aperti"
            value={stats.openOrders.toString()}
            tone="red"
          />
          <Stat
            label="Tavoli attivi"
            value={stats.tablesOpen.toString()}
            tone="green"
          />
          <Stat
            label="Incassato oggi"
            value={formatEuro(stats.todayRevenue)}
            tone="ink"
          />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Quick
          href="/admin/menu"
          title="Gestisci menu"
          desc="Disponibilità, prezzi, foto, ingredienti"
          icon={<UtensilsCrossed size={22} />}
        />
        {showOrdini && (
          <Quick
            href="/admin/ordini"
            title="Ordini"
            desc="Vedi e aggiorna gli ordini in corso"
            icon={<ClipboardList size={22} />}
          />
        )}
        {showTavoli && (
          <Quick
            href="/admin/tavoli"
            title="Tavoli & QR"
            desc="Crea tavoli, stampa QR, chiudi conti"
            icon={<QrCode size={22} />}
          />
        )}
        {modules.reservations && (
          <Quick
            href="/admin/prenotazioni"
            title="Prenotazioni"
            desc="Agenda, coperti, tavoli, note cliente e stati"
            icon={<CalendarCheck size={22} />}
          />
        )}
        {advancedServicesOn && (
          <Quick
            href="/admin/servizi"
            title="Servizi avanzati"
            desc="Kiosk, prenotazioni, sala, CRM, slot, delivery, magazzino e staff"
            icon={<Blocks size={22} />}
          />
        )}
        <Quick
          href="/admin/impostazioni"
          title="Impostazioni"
          desc="Moduli del sito, orari, contatti e ripristini"
          icon={<Settings size={22} />}
        />
        {kitchenOn && (
          <Quick
            href="/cucina"
            title="Schermo cucina"
            desc="Coda ordini per il monitor in cucina"
            icon={<ChefHat size={22} />}
            external
          />
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ink" | "mustard" | "red" | "green";
}) {
  const map: Record<string, string> = {
    ink: "bg-pork-ink text-pork-cream",
    mustard: "bg-pork-mustard text-pork-ink",
    red: "bg-pork-red text-white",
    green: "bg-pork-green text-white",
  };
  return (
    <div className={`rounded-3xl p-5 ${map[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="headline mt-1 text-4xl">{value}</p>
    </div>
  );
}

function Quick({
  href,
  title,
  desc,
  icon,
  external,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="group rounded-3xl bg-white p-6 shadow-sm ring-1 ring-pork-ink/5 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-pork-ink text-pork-cream group-hover:bg-pork-red">
        {icon}
      </div>
      <h3 className="impact-title mt-4 text-xl">{title}</h3>
      <p className="mt-1 text-sm text-pork-ink/60">{desc}</p>
    </Link>
  );
}
