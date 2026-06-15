"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Blocks,
  CalendarCheck,
  ChefHat,
  ClipboardList,
  EyeOff,
  MonitorPause,
  Palette,
  PauseCircle,
  Plus,
  Power,
  Printer,
  QrCode,
  Settings,
  TicketPercent,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useMenuStore } from "@/store/menu-store";
import { useSettingsStore } from "@/store/settings-store";
import { useRestaurantServicesStore } from "@/store/restaurant-services-store";
import { formatEuro } from "@/lib/price-utils";
import { useHydrated } from "@/components/core/providers";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { usePlatformMode } from "@/components/core/platform-mode-provider";
import { PlatformCockpitAlerts } from "@/components/admin/platform/platform-cockpit-alerts";
import type { TenantFeatureKey } from "@/lib/tenant";

type ConfirmState = {
  title: string;
  desc: string;
  confirmLabel: string;
  onConfirm: () => void;
} | null;

function endOfServiceDay(now = new Date()): number {
  const end = new Date(now);
  end.setHours(23, 59, 0, 0);
  return end.getTime();
}

export default function AdminHome() {
  const mode = usePlatformMode();
  const router = useRouter();
  const hydrated = useHydrated();
  const [confirmAction, setConfirmAction] = useState<ConfirmState>(null);
  const [settingsReady, setSettingsReady] = useState(() =>
    useSettingsStore.persist.hasHydrated(),
  );
  const categories = useMenuStore((s) => s.categories);
  const items = useMenuStore((s) => s.items);
  const orders = useMenuStore((s) => s.orders);
  const sessions = useMenuStore((s) => s.sessions);
  const addCategory = useMenuStore((s) => s.addCategory);
  const addItem = useMenuStore((s) => s.addItem);
  const addMenuList = useMenuStore((s) => s.addMenuList);
  const suspendModule = useSettingsStore((s) => s.suspendModule);
  const reservations = useRestaurantServicesStore((s) => s.reservations);
  const availabilityRules = useRestaurantServicesStore((s) => s.availabilityRules);
  const takeawaySlots = useRestaurantServicesStore((s) => s.takeawaySlots);
  const orderKiosks = useRestaurantServicesStore((s) => s.orderKiosks);
  const deliveryChannels = useRestaurantServicesStore((s) => s.deliveryChannels);
  const printStations = useRestaurantServicesStore((s) => s.printStations);
  const upsellRules = useRestaurantServicesStore((s) => s.upsellRules);
  const updateReservationStatus = useRestaurantServicesStore((s) => s.updateReservationStatus);
  const toggleAvailabilityRule = useRestaurantServicesStore((s) => s.toggleAvailabilityRule);
  const toggleTakeawaySlot = useRestaurantServicesStore((s) => s.toggleTakeawaySlot);
  const updateOrderKioskStatus = useRestaurantServicesStore((s) => s.updateOrderKioskStatus);
  const updateDeliveryChannelStatus = useRestaurantServicesStore((s) => s.updateDeliveryChannelStatus);
  const togglePrintStation = useRestaurantServicesStore((s) => s.togglePrintStation);
  const toggleUpsellRule = useRestaurantServicesStore((s) => s.toggleUpsellRule);
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

  const pendingReservation = reservations.find((reservation) => reservation.status === "nuova");
  const visibleLimitedRule = availabilityRules.find((rule) => rule.visible);
  const activeSlot = [...takeawaySlots]
    .filter((slot) => !slot.paused)
    .sort((a, b) => b.booked / b.capacity - a.booked / a.capacity)[0];
  const onlineKiosk = orderKiosks.find((kiosk) => kiosk.status === "online");
  const activeDeliveryChannel = deliveryChannels.find((channel) => channel.status === "attivo");
  const onlinePrintStation = printStations.find((station) => station.online);
  const activeUpsellRule = upsellRules.find((rule) => rule.active);

  function goToNewDish() {
    const categoryId = categories[0]?.id ?? addCategory("Nuova categoria");
    const id = addItem(categoryId, {
      name: "Nuovo piatto",
      price: { kind: "single", value: 0 },
    });
    router.push(`/admin/menu?edit=${encodeURIComponent(id)}`);
  }

  function goToNewMenu() {
    const id = addMenuList({
      name: "Nuovo menu",
      description: "Selezione personalizzata di piatti.",
      itemIds: [],
      visibility: {},
    });
    router.push(`/admin/menu?view=menus&menu=${encodeURIComponent(id)}`);
  }

  function confirmDestructive(action: NonNullable<ConfirmState>) {
    setConfirmAction(action);
  }

  function suspendOrdersToday() {
    const modulesToSuspend: TenantFeatureKey[] = [
      allowTakeaway ? "takeaway" : null,
      allowTableOrders ? "tableOrders" : null,
      orderKioskEnabled ? "orderKiosk" : null,
    ].filter(Boolean) as TenantFeatureKey[];
    const until = endOfServiceDay();
    modulesToSuspend.forEach((module) => suspendModule(module, until));
  }

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

        <PlatformCockpitAlerts />

        <div className="grid gap-5 md:grid-cols-2">
          <Quick
            href="/admin/tenant"
            title="Gestisci tenant"
            desc="Attivazioni, moduli, demo e profili configurabili"
            icon={<Settings size={22} />}
          />
          <Quick
            href="/admin/template-design"
            title="Template designer"
            desc="SVG Figma e manifest connettori per siti Menuary"
            icon={<Palette size={22} />}
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
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          desc={confirmAction.desc}
          confirmLabel={confirmAction.confirmLabel}
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
        />
      )}
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

      <section className="space-y-3">
        <div>
          <p className="impact-title text-sm text-pork-ink/70">Comandi rapidi</p>
          <p className="mt-1 text-sm text-pork-ink/55">
            Azioni operative frequenti, legate ai moduli attivi del locale.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <QuickAction
            title="Aggiungi nuovo piatto"
            desc="Crea una scheda e apri subito l'editor"
            icon={<Plus size={20} />}
            onClick={goToNewDish}
          />
          <QuickAction
            title="Crea nuovo menu"
            desc="Prepara una lista con regole di visibilità"
            icon={<UtensilsCrossed size={20} />}
            onClick={goToNewMenu}
          />
          {showOrdini && (
            <QuickAction
              title="Sospendi ordini per oggi"
              desc="Blocca nuovi ordini da sito, tavoli e kiosk attivi"
              icon={<Ban size={20} />}
              destructive
              onClick={() =>
                confirmDestructive({
                  title: "Sospendere gli ordini per oggi?",
                  desc:
                    "Non sarà possibile per i clienti inviare nuovi ordini dal sito, dai QR tavolo o dai kiosk attivi fino a fine giornata. Gli ordini già ricevuti restano visibili.",
                  confirmLabel: "Sospendi ordini",
                  onConfirm: suspendOrdersToday,
                })
              }
            />
          )}
          {modules.reservations && pendingReservation && (
            <QuickAction
              title="Conferma prossima prenotazione"
              desc={`${pendingReservation.customer}, ${pendingReservation.covers} coperti alle ${pendingReservation.time}`}
              icon={<CalendarCheck size={20} />}
              onClick={() => updateReservationStatus(pendingReservation.id, "confermata")}
            />
          )}
          {modules.productAvailability && visibleLimitedRule && (
            <QuickAction
              title="Nascondi prodotto critico"
              desc={`${visibleLimitedRule.itemName}: ${visibleLimitedRule.reason}`}
              icon={<EyeOff size={20} />}
              destructive
              onClick={() =>
                confirmDestructive({
                  title: `Nascondere ${visibleLimitedRule.itemName}?`,
                  desc:
                    "Il prodotto non sarà più visibile nei percorsi pubblici finché non verrà riattivato dalle disponibilità.",
                  confirmLabel: "Nascondi prodotto",
                  onConfirm: () => toggleAvailabilityRule(visibleLimitedRule.id),
                })
              }
            />
          )}
          {modules.takeawaySlots && activeSlot && (
            <QuickAction
              title="Metti in pausa slot saturo"
              desc={`${activeSlot.time}: ${activeSlot.booked}/${activeSlot.capacity} ordini prenotati`}
              icon={<PauseCircle size={20} />}
              destructive
              onClick={() =>
                confirmDestructive({
                  title: `Sospendere lo slot ${activeSlot.time}?`,
                  desc:
                    "I clienti non potranno scegliere questa fascia di ritiro finché lo slot resta in pausa.",
                  confirmLabel: "Metti in pausa",
                  onConfirm: () => toggleTakeawaySlot(activeSlot.id),
                })
              }
            />
          )}
          {modules.orderKiosk && onlineKiosk && (
            <QuickAction
              title="Pausa kiosk"
              desc={`${onlineKiosk.name}, ${onlineKiosk.area}`}
              icon={<MonitorPause size={20} />}
              destructive
              onClick={() =>
                confirmDestructive({
                  title: `Mettere in pausa ${onlineKiosk.name}?`,
                  desc:
                    "La postazione non potrà inviare nuovi ordini finché non viene riportata online.",
                  confirmLabel: "Metti in pausa",
                  onConfirm: () => updateOrderKioskStatus(onlineKiosk.id, "pausa"),
                })
              }
            />
          )}
          {modules.deliveryHub && activeDeliveryChannel && (
            <QuickAction
              title="Pausa canale delivery"
              desc={`${activeDeliveryChannel.name}: ${activeDeliveryChannel.ordersToday} ordini oggi`}
              icon={<Power size={20} />}
              destructive
              onClick={() =>
                confirmDestructive({
                  title: `Mettere in pausa ${activeDeliveryChannel.name}?`,
                  desc:
                    "I nuovi ordini da questo canale non dovrebbero essere accettati finché il canale resta in pausa.",
                  confirmLabel: "Metti in pausa",
                  onConfirm: () => updateDeliveryChannelStatus(activeDeliveryChannel.id, "pausa"),
                })
              }
            />
          )}
          {modules.printStations && onlinePrintStation && (
            <QuickAction
              title="Disattiva stampante reparto"
              desc={`${onlinePrintStation.name}, ${onlinePrintStation.area}`}
              icon={<Printer size={20} />}
              destructive
              onClick={() =>
                confirmDestructive({
                  title: `Disattivare ${onlinePrintStation.name}?`,
                  desc:
                    "Le comande assegnate a questo reparto non verranno più stampate finché la postazione resta offline.",
                  confirmLabel: "Disattiva stampante",
                  onConfirm: () => togglePrintStation(onlinePrintStation.id),
                })
              }
            />
          )}
          {modules.upselling && activeUpsellRule && (
            <QuickAction
              title="Sospendi suggerimento"
              desc={`${activeUpsellRule.trigger}: ${activeUpsellRule.suggestion}`}
              icon={<TicketPercent size={20} />}
              onClick={() => toggleUpsellRule(activeUpsellRule.id)}
            />
          )}
        </div>
      </section>

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

function ConfirmDialog({
  title,
  desc,
  confirmLabel,
  onClose,
  onConfirm,
}: {
  title: string;
  desc: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-pork-ink/65 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-confirm-title"
    >
      <div className="w-full max-w-lg rounded-3xl bg-pork-cream p-5 shadow-2xl ring-1 ring-pork-ink/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="impact-title text-xs text-pork-red">Conferma azione</p>
            <h2 id="quick-confirm-title" className="headline mt-1 text-3xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-pork-ink shadow-sm ring-1 ring-pork-ink/10"
            aria-label="Chiudi"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-pork-ink/70">{desc}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="btn-ghost text-sm">
            Annulla
          </button>
          <button type="button" onClick={onConfirm} className="btn-primary text-sm">
            {confirmLabel}
          </button>
        </div>
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

function QuickAction({
  title,
  desc,
  icon,
  destructive,
  onClick,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-pork-ink/5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className={
          "inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition " +
          (destructive
            ? "bg-pork-red group-hover:bg-pork-ink"
            : "bg-pork-ink group-hover:bg-pork-red")
        }
      >
        {icon}
      </div>
      <h3 className="mt-4 text-base font-black text-pork-ink">{title}</h3>
      <p className="mt-1 text-sm leading-5 text-pork-ink/60">{desc}</p>
    </button>
  );
}
