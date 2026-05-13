"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarCheck,
  ChefHat,
  ClipboardList,
  Gift,
  MapPinned,
  MonitorSmartphone,
  PackageSearch,
  Printer,
  RefreshCcw,
  Truck,
  Users,
  Utensils,
} from "lucide-react";
import { useHydrated } from "@/components/providers";
import { useTenant } from "@/components/tenant-provider";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { useRestaurantServicesStore } from "@/store/restaurant-services-store";
import { formatEuro } from "@/lib/price-utils";

type ServiceCard = {
  key: string;
  title: string;
  description: string;
  href?: string;
  active: boolean;
  icon: React.ReactNode;
  stats: Array<{ label: string; value: string }>;
};

function OverviewCard({ service }: { service: ServiceCard }) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-pork-ink/10">
      <div className="flex items-start justify-between gap-3">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pork-ink text-pork-cream">
          {service.icon}
        </div>
        <span
          className={
            "rounded-full px-2.5 py-1 text-[10px] font-black uppercase " +
            (service.active
              ? "bg-pork-green text-white"
              : "bg-pork-ink/10 text-pork-ink/45")
          }
        >
          {service.active ? "Attivo" : "Non attivo"}
        </span>
      </div>
      <h2 className="impact-title mt-4 text-xl text-pork-ink">{service.title}</h2>
      <p className="mt-1 text-sm text-pork-ink/60">{service.description}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {service.stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-pork-cream p-3">
            <p className="text-[10px] font-bold uppercase text-pork-ink/45">{stat.label}</p>
            <p className="headline text-2xl">{stat.value}</p>
          </div>
        ))}
      </div>
      {service.href && (
        <Link
          href={service.href}
          className="mt-4 inline-flex rounded-full bg-pork-ink px-4 py-2 text-sm font-bold text-pork-cream hover:bg-pork-red"
        >
          Apri pagina dedicata
        </Link>
      )}
    </section>
  );
}

export default function AdminServiziPage() {
  const hydrated = useHydrated();
  const tenant = useTenant();
  const { modules } = useEffectiveFeatures();
  const state = useRestaurantServicesStore();

  useEffect(() => {
    if (!hydrated) return;
    state.setTenantSeed(tenant.id);
  }, [hydrated, state, tenant.id]);

  const liveRevenue = state.locations.reduce(
    (sum, location) => sum + location.revenueToday,
    0,
  );
  const onlineKiosks = state.orderKiosks.filter(
    (kiosk) => kiosk.status === "online",
  ).length;
  const serviceCards = useMemo<ServiceCard[]>(
    () => [
      {
        key: "reservations",
        title: "Prenotazioni",
        description: "Agenda, richieste online, coperti, note e stati.",
        href: "/admin/prenotazioni",
        active: modules.reservations,
        icon: <CalendarCheck size={18} />,
        stats: [
          { label: "Richieste", value: String(state.reservations.length) },
          {
            label: "Confermate",
            value: String(
              state.reservations.filter((reservation) => reservation.status === "confermata")
                .length,
            ),
          },
        ],
      },
      {
        key: "tablePlanner",
        title: "Gestione sala",
        description: "Piantina, sale, tavoli, stati, QR, sessioni e accorpamenti.",
        href: "/admin/tavoli",
        active: modules.tablePlanner,
        icon: <MapPinned size={18} />,
        stats: [
          {
            label: "Sale",
            value: String(new Set(state.roomTables.map((table) => table.area)).size),
          },
          { label: "Tavoli", value: String(state.roomTables.length) },
        ],
      },
      {
        key: "orderKiosk",
        title: "Kiosk ordini",
        description: "Postazioni self-order per ingresso, piano bar e dehor.",
        active: modules.orderKiosk,
        icon: <MonitorSmartphone size={18} />,
        stats: [
          { label: "Online", value: `${onlineKiosks}/${state.orderKiosks.length}` },
          {
            label: "Ordini",
            value: String(
              state.orderKiosks.reduce((sum, kiosk) => sum + kiosk.ordersToday, 0),
            ),
          },
        ],
      },
      {
        key: "productAvailability",
        title: "Disponibilità piatti",
        description: "Esauriti, quantità residue e blocchi per ingredienti.",
        active: modules.productAvailability,
        icon: <Utensils size={18} />,
        stats: [
          { label: "Regole", value: String(state.availabilityRules.length) },
          {
            label: "Nascosti",
            value: String(state.availabilityRules.filter((rule) => !rule.visible).length),
          },
        ],
      },
      {
        key: "upselling",
        title: "Upselling",
        description: "Suggerimenti, combo, extra e abbinamenti automatici.",
        active: modules.upselling,
        icon: <Gift size={18} />,
        stats: [
          { label: "Regole", value: String(state.upsellRules.length) },
          {
            label: "Attive",
            value: String(state.upsellRules.filter((rule) => rule.active).length),
          },
        ],
      },
      {
        key: "crm",
        title: "CRM e fidelity",
        description: "Clienti, tag, coupon e storico preferenze.",
        active: modules.crm,
        icon: <Users size={18} />,
        stats: [
          { label: "Clienti", value: String(state.customers.length) },
          {
            label: "Coupon",
            value: String(state.customers.filter((customer) => customer.coupon).length),
          },
        ],
      },
      {
        key: "analytics",
        title: "Analytics locale",
        description: "Scontrino medio, piatti top, tempi cucina e slot saturi.",
        active: modules.analytics,
        icon: <BarChart3 size={18} />,
        stats: [
          { label: "Metriche", value: String(state.analytics.length) },
          { label: "Incasso", value: formatEuro(liveRevenue) },
        ],
      },
      {
        key: "takeawaySlots",
        title: "Slot asporto",
        description: "Capacità per fascia, saturazione e pause operative.",
        active: modules.takeawaySlots,
        icon: <ClipboardList size={18} />,
        stats: [
          { label: "Slot", value: String(state.takeawaySlots.length) },
          {
            label: "In pausa",
            value: String(state.takeawaySlots.filter((slot) => slot.paused).length),
          },
        ],
      },
      {
        key: "deliveryHub",
        title: "Delivery hub",
        description: "Canali diretti, marketplace e telefono centralizzati.",
        active: modules.deliveryHub,
        icon: <Truck size={18} />,
        stats: [
          { label: "Canali", value: String(state.deliveryChannels.length) },
          {
            label: "Attivi",
            value: String(
              state.deliveryChannels.filter((channel) => channel.status === "attivo").length,
            ),
          },
        ],
      },
      {
        key: "inventoryFoodCost",
        title: "Magazzino e food cost",
        description: "Ingredienti, soglie, margine e piatti collegati.",
        active: modules.inventoryFoodCost,
        icon: <PackageSearch size={18} />,
        stats: [
          { label: "Ingredienti", value: String(state.inventory.length) },
          {
            label: "Critici",
            value: String(state.inventory.filter((item) => item.status === "critico").length),
          },
        ],
      },
      {
        key: "printStations",
        title: "Stampanti e reparti",
        description: "Cucina, pizzeria, bar, ristampe e instradamento.",
        active: modules.printStations,
        icon: <Printer size={18} />,
        stats: [
          { label: "Reparti", value: String(state.printStations.length) },
          {
            label: "Online",
            value: String(state.printStations.filter((station) => station.online).length),
          },
        ],
      },
      {
        key: "staffRoles",
        title: "Ruoli staff",
        description: "Permessi per admin, manager, sala, cucina e bar.",
        active: modules.staffRoles,
        icon: <ChefHat size={18} />,
        stats: [
          { label: "Profili", value: String(state.staffRoles.length) },
          {
            label: "Attivi",
            value: String(state.staffRoles.filter((role) => role.active).length),
          },
        ],
      },
      {
        key: "multiLocation",
        title: "Multi-sede",
        description: "Sedi, menu attivi, ordini aperti e incasso comparato.",
        active: modules.multiLocation,
        icon: <MapPinned size={18} />,
        stats: [
          { label: "Sedi", value: String(state.locations.length) },
          {
            label: "Ordini",
            value: String(state.locations.reduce((sum, location) => sum + location.openOrders, 0)),
          },
        ],
      },
    ],
    [liveRevenue, modules, onlineKiosks, state],
  );

  const enabledAdvancedCount = serviceCards.filter((service) => service.active).length;

  if (!hydrated || state.currentTenantId !== tenant.id) {
    return <p className="text-pork-ink/50">Caricamento servizi...</p>;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="impact-title text-xs text-pork-red">Servizi avanzati</p>
          <h1 className="headline text-4xl">Overview servizi</h1>
          <p className="mt-2 max-w-3xl text-pork-ink/60">
            Qui restano solo stato, metriche e accessi rapidi. Le impostazioni granulari vivono
            nelle pagine dedicate di ciascun servizio.
          </p>
        </div>
        <button
          type="button"
          onClick={state.resetToSeed}
          className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 bg-white px-4 py-2 text-sm font-bold text-pork-ink/65 hover:border-pork-red/40 hover:text-pork-red"
        >
          <RefreshCcw size={15} />
          Ripristina demo
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-pork-ink p-5 text-pork-cream">
          <p className="text-xs font-bold uppercase opacity-60">Moduli attivi</p>
          <p className="headline mt-1 text-4xl">{enabledAdvancedCount}/{serviceCards.length}</p>
        </div>
        <div className="rounded-3xl bg-pork-red p-5 text-white">
          <p className="text-xs font-bold uppercase opacity-70">Prenotazioni</p>
          <p className="headline mt-1 text-4xl">{state.reservations.length}</p>
        </div>
        <div className="rounded-3xl bg-pork-mustard p-5 text-pork-ink">
          <p className="text-xs font-bold uppercase opacity-60">Incasso demo</p>
          <p className="headline mt-1 text-4xl">{formatEuro(liveRevenue)}</p>
        </div>
        <div className="rounded-3xl bg-pork-green p-5 text-white">
          <p className="text-xs font-bold uppercase opacity-70">Kiosk online</p>
          <p className="headline mt-1 text-4xl">{onlineKiosks}/{state.orderKiosks.length}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {serviceCards.map((service) => (
          <OverviewCard key={service.key} service={service} />
        ))}
      </div>
    </div>
  );
}
