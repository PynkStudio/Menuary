"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { DEFAULT_MARKET, MARKETS } from "@/lib/markets";

// ─── Types ────────────────────────────────────────────────────────────────────

type Location = {
  id: string;
  street: string;
  street_number: string;
  city: string;
  country: string;
};

type WizardData = {
  business_name: string;
  business_vertical: "food" | "services";
  business_type: string;
  has_website: boolean | null;
  website_url: string;
  website_score_beauty: number;
  website_score_functionality: number;
  website_score_clarity: number;
  website_score_updated: number;
  has_google_maps: boolean;
  maps_ownership_claimed: boolean;
  maps_profile_complete: boolean;
  contact_first_name: string;
  contact_last_name: string;
  contact_phone: string;
  contact_email: string;
  locations: Location[];
  temperature: "cold" | "warm" | "hot";
};

type Step = "identity" | "website" | "website_quality" | "maps" | "contacts" | "review";

// ─── HORECA categories ────────────────────────────────────────────────────────

const HORECA_CATEGORIES: { group: string; items: string[] }[] = [
  {
    group: "Ristorazione",
    items: [
      "Ristorante",
      "Trattoria / Osteria",
      "Pizzeria",
      "Braceria / Steakhouse",
      "Cucina etnica",
      "Sushi / Giapponese",
      "Cucina cinese",
      "Messicano / Tex-Mex",
      "Cucina indiana",
      "Kebabbaro",
      "Hamburgheria",
      "Poke Bowl",
    ],
  },
  {
    group: "Bar & Caffetteria",
    items: [
      "Bar",
      "Caffetteria",
      "Pasticceria",
      "Gelateria",
      "Bakery / Panetteria",
      "Specialty Coffee",
    ],
  },
  {
    group: "Cocktail & Nightlife",
    items: [
      "Cocktail Bar",
      "Pub",
      "Birreria / Brewpub",
      "Wine Bar / Enoteca",
      "Lounge Bar",
      "Discoteca / Club",
    ],
  },
  {
    group: "Street & Fast Food",
    items: [
      "Street Food",
      "Piadineria",
      "Rosticceria",
      "Take Away",
      "Dark Kitchen",
      "Food Truck",
    ],
  },
  {
    group: "Alta Ristorazione",
    items: ["Ristorante Stellato", "Ristorante Gourmet", "Fine Dining"],
  },
  {
    group: "Strutture Ricettive",
    items: ["Hotel con Ristorante", "Agriturismo", "B&B con Colazione", "Resort / Spa", "Locanda"],
  },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────

function computeScores(data: WizardData): { matchingScore: number; priorityScore: number } {
  let matching = 20;

  if (data.has_website === false) {
    matching += 30;
  } else if (data.has_website === true && data.website_score_beauty > 0) {
    const avg =
      (data.website_score_beauty +
        data.website_score_functionality +
        data.website_score_clarity +
        data.website_score_updated) /
      4;
    if (avg < 2.5) matching += 25;
    else if (avg < 3.5) matching += 15;
    else if (avg < 4.5) matching += 5;
  } else if (data.has_website === true) {
    matching += 10;
  }

  if (!data.has_google_maps) matching += 25;
  else if (!data.maps_ownership_claimed) matching += 15;
  else if (!data.maps_profile_complete) matching += 8;

  if (data.locations.length > 1) matching += 5;
  matching = Math.min(100, matching);

  let priority = 0;
  if (data.temperature === "hot") priority += 40;
  else if (data.temperature === "warm") priority += 20;
  else priority += 5;

  const hasPhone = data.contact_phone.trim().length > 0;
  const hasEmail = data.contact_email.trim().length > 0;
  if (hasPhone && hasEmail) priority += 30;
  else if (hasPhone || hasEmail) priority += 15;

  if (data.locations.length > 1) priority += 15;

  if (data.has_website === false) {
    priority += 10;
  } else if (data.has_website === true && data.website_score_beauty > 0) {
    const avg =
      (data.website_score_beauty +
        data.website_score_functionality +
        data.website_score_clarity +
        data.website_score_updated) /
      4;
    if (avg < 2.5) priority += 10;
    else if (avg < 3.5) priority += 5;
  }
  if (!data.has_google_maps || !data.maps_ownership_claimed) priority += 5;

  priority = Math.min(100, priority);
  return { matchingScore: matching, priorityScore: priority };
}

// ─── Initial state ────────────────────────────────────────────────────────────

function makeLocation(): Location {
  return { id: crypto.randomUUID(), street: "", street_number: "", city: "", country: DEFAULT_MARKET };
}

const INITIAL: WizardData = {
  business_name: "",
  business_vertical: "food",
  business_type: "",
  has_website: null,
  website_url: "",
  website_score_beauty: 0,
  website_score_functionality: 0,
  website_score_clarity: 0,
  website_score_updated: 0,
  has_google_maps: true,
  maps_ownership_claimed: false,
  maps_profile_complete: false,
  contact_first_name: "",
  contact_last_name: "",
  contact_phone: "",
  contact_email: "",
  locations: [makeLocation()],
  temperature: "cold",
};

// ─── Helper components ────────────────────────────────────────────────────────

const FIELD =
  "w-full rounded-2xl border border-pork-ink/10 bg-white px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-pork-red/25";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-black uppercase tracking-wide text-pork-ink/40">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-pork-ink/40">{hint}</span>}
    </label>
  );
}

function StepHeader({
  step,
  total,
  title,
  subtitle,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pork-red text-sm font-black text-white">
          {step}
        </div>
        <div className="flex flex-1 gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? "bg-pork-red" : "bg-pork-ink/10"}`}
            />
          ))}
        </div>
        <span className="shrink-0 text-xs font-bold text-pork-ink/35">
          {step} / {total}
        </span>
      </div>
      <h2 className="headline text-3xl leading-tight">{title}</h2>
      {subtitle && <p className="mt-2 text-base text-pork-ink/55">{subtitle}</p>}
    </div>
  );
}

function BigToggle({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-2xl border-2 px-5 py-5 text-left transition-all ${
        selected
          ? "border-pork-red bg-pork-red/8 text-pork-red"
          : "border-pork-ink/10 bg-white text-pork-ink hover:border-pork-red/30"
      }`}
    >
      <span className="block text-lg font-black">{label}</span>
      {description && (
        <span
          className={`mt-1 block text-sm ${selected ? "text-pork-red/70" : "text-pork-ink/50"}`}
        >
          {description}
        </span>
      )}
    </button>
  );
}

const STAR_LABELS = ["", "Pessimo", "Scarso", "Nella media", "Buono", "Eccellente"];

function StarRating({
  value,
  onChange,
  label,
  description,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-pork-ink/10 bg-pork-ink/2 p-5">
      <p className="mb-1 text-base font-black text-pork-ink">{label}</p>
      {description && <p className="mb-3 text-sm text-pork-ink/50">{description}</p>}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all ${
              n <= value
                ? "bg-amber-400 text-white shadow-sm"
                : "bg-white text-pork-ink/20 hover:bg-amber-50 hover:text-amber-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && (
        <p className="mt-2 text-sm font-semibold text-pork-ink/60">{STAR_LABELS[value]}</p>
      )}
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

type StepProps = {
  data: WizardData;
  set: <K extends keyof WizardData>(k: K, v: WizardData[K]) => void;
  step: number;
  total: number;
};

function StepIdentity({ data, set, step, total }: StepProps) {
  return (
    <div>
      <StepHeader
        step={step}
        total={total}
        title="Di che attività si tratta?"
        subtitle="Cominciamo con il nome e il tipo di locale."
      />

      <div className="space-y-6">
        <Field label="Nome del locale / attività" hint="Scrivi il nome esatto come appare online.">
          <input
            autoFocus
            value={data.business_name}
            onChange={(e) => set("business_name", e.target.value)}
            placeholder="es. Ristorante Da Mario"
            className={FIELD}
          />
        </Field>

        <div>
          <p className="mb-2 text-sm font-black uppercase tracking-wide text-pork-ink/40">
            Settore
          </p>
          <div className="flex gap-3">
            <BigToggle
              label="Ristorazione / Bar"
              description="HORECA: ristoranti, bar, pizzerie, locali…"
              selected={data.business_vertical === "food"}
              onClick={() => {
                set("business_vertical", "food");
                set("business_type", "");
              }}
            />
            <BigToggle
              label="Altra attività"
              description="Officine, saloni, studi, centri benessere…"
              selected={data.business_vertical === "services"}
              onClick={() => {
                set("business_vertical", "services");
                set("business_type", "");
              }}
            />
          </div>
        </div>

        {data.business_vertical === "services" ? (
          <Field
            label="Che tipo di attività è?"
            hint="Es. Studio dentistico · Salone parrucchieri · Officina auto…"
          >
            <input
              value={data.business_type}
              onChange={(e) => set("business_type", e.target.value)}
              placeholder="Descrivi il tipo di attività"
              className={FIELD}
            />
          </Field>
        ) : (
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-pork-ink/40">
              Categoria specifica
            </p>
            <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
              {HORECA_CATEGORIES.map(({ group, items }) => (
                <div key={group}>
                  <p className="mb-2 text-xs font-black uppercase text-pork-ink/30">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => set("business_type", item)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-bold transition-all ${
                          data.business_type === item
                            ? "border-pork-red bg-pork-red text-white"
                            : "border-pork-ink/15 bg-white text-pork-ink hover:border-pork-red/40 hover:text-pork-red"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepWebsite({ data, set, step, total }: StepProps) {
  return (
    <div>
      <StepHeader
        step={step}
        total={total}
        title={`${data.business_name || "Questa attività"} ha un sito web?`}
        subtitle="Un sito proprio — non la pagina Facebook o il profilo Google Maps."
      />

      <div className="space-y-4">
        <div className="flex gap-4">
          <BigToggle
            label="Sì, ha un sito"
            selected={data.has_website === true}
            onClick={() => set("has_website", true)}
          />
          <BigToggle
            label="No, non ce l'ha"
            selected={data.has_website === false}
            onClick={() => {
              set("has_website", false);
              set("website_url", "");
            }}
          />
        </div>

        {data.has_website === true && (
          <Field label="Indirizzo del sito (URL)" hint="Puoi copiarlo dalla barra del browser.">
            <input
              type="url"
              value={data.website_url}
              onChange={(e) => set("website_url", e.target.value)}
              placeholder="https://www.esempio.com"
              className={FIELD}
              autoFocus
            />
          </Field>
        )}

        {data.has_website === false && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-bold text-emerald-700">
              Ottimo — un&apos;attività senza sito è una grande opportunità per noi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StepWebsiteQuality({ data, set, step, total }: StepProps) {
  return (
    <div>
      <StepHeader
        step={step}
        total={total}
        title="Com'è il sito attuale?"
        subtitle={`Apri ${data.website_url || "il sito"} e valuta questi 4 aspetti da 1 a 5 stelle.`}
      />
      <div className="space-y-3">
        <StarRating
          value={data.website_score_beauty}
          onChange={(v) => set("website_score_beauty", v)}
          label="Aspetto grafico"
          description="Il sito è bello e moderno visivamente?"
        />
        <StarRating
          value={data.website_score_functionality}
          onChange={(v) => set("website_score_functionality", v)}
          label="Funzionalità"
          description="Funziona bene su telefono e computer? È veloce e facile da usare?"
        />
        <StarRating
          value={data.website_score_clarity}
          onChange={(v) => set("website_score_clarity", v)}
          label="Chiarezza delle informazioni"
          description="Si capisce subito dove si trova, cosa offre e come contattarla?"
        />
        <StarRating
          value={data.website_score_updated}
          onChange={(v) => set("website_score_updated", v)}
          label="Contenuti aggiornati"
          description="I prezzi, il menu o i servizi sembrano recenti e non datati?"
        />
      </div>
    </div>
  );
}

function StepMaps({ data, set, step, total }: StepProps) {
  return (
    <div>
      <StepHeader
        step={step}
        total={total}
        title="È su Google Maps?"
        subtitle="Cerca il locale su Google Maps e rispondi a queste domande."
      />

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-black uppercase tracking-wide text-pork-ink/40">
            Esiste su Google Maps?
          </p>
          <div className="flex gap-3">
            <BigToggle
              label="Sì"
              selected={data.has_google_maps}
              onClick={() => set("has_google_maps", true)}
            />
            <BigToggle
              label="No"
              selected={!data.has_google_maps}
              onClick={() => {
                set("has_google_maps", false);
                set("maps_ownership_claimed", false);
                set("maps_profile_complete", false);
              }}
            />
          </div>
        </div>

        {data.has_google_maps && (
          <>
            <div>
              <p className="mb-1 text-sm font-black uppercase tracking-wide text-pork-ink/40">
                Ha registrato la titolarità su Google?
              </p>
              <p className="mb-2 text-sm text-pork-ink/50">
                Se compare il pulsante &quot;Gestisci questa struttura&quot;, la titolarità{" "}
                <strong>non è stata</strong> registrata.
              </p>
              <div className="flex gap-3">
                <BigToggle
                  label="Sì, è proprietario"
                  selected={data.maps_ownership_claimed}
                  onClick={() => set("maps_ownership_claimed", true)}
                />
                <BigToggle
                  label="No, non ancora"
                  selected={!data.maps_ownership_claimed}
                  onClick={() => {
                    set("maps_ownership_claimed", false);
                    set("maps_profile_complete", false);
                  }}
                />
              </div>
            </div>

            {data.maps_ownership_claimed && (
              <div>
                <p className="mb-1 text-sm font-black uppercase tracking-wide text-pork-ink/40">
                  Il profilo è completo?
                </p>
                <p className="mb-2 text-sm text-pork-ink/50">
                  Controlla: ci sono foto recenti, orari corretti, descrizione e link al sito?
                </p>
                <div className="flex gap-3">
                  <BigToggle
                    label="Sì, è completo"
                    selected={data.maps_profile_complete}
                    onClick={() => set("maps_profile_complete", true)}
                  />
                  <BigToggle
                    label="No, manca qualcosa"
                    selected={!data.maps_profile_complete}
                    onClick={() => set("maps_profile_complete", false)}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {!data.has_google_maps && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-bold text-emerald-700">
              Non è su Google Maps — possiamo aiutarli a creare e ottimizzare il profilo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const COUNTRY_OPTIONS = MARKETS.map((market) => ({
  value: market.code,
  label: `${market.flag} ${market.name}`,
}));

function StepContacts({ data, set, step, total }: StepProps) {
  function updateLocation(id: string, field: keyof Location, value: string) {
    set(
      "locations",
      data.locations.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    );
  }

  function addLocation() {
    set("locations", [...data.locations, makeLocation()]);
  }

  function removeLocation(id: string) {
    if (data.locations.length <= 1) return;
    set(
      "locations",
      data.locations.filter((l) => l.id !== id),
    );
  }

  return (
    <div>
      <StepHeader
        step={step}
        total={total}
        title="Chi contattare e dove si trova?"
        subtitle="Tutti i campi sono facoltativi — inserisci quello che sai."
      />

      <div className="space-y-7">
        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-pork-ink/40">
            <User size={14} /> Titolare / Referente
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <input
                value={data.contact_first_name}
                onChange={(e) => set("contact_first_name", e.target.value)}
                placeholder="Mario"
                className={FIELD}
              />
            </Field>
            <Field label="Cognome">
              <input
                value={data.contact_last_name}
                onChange={(e) => set("contact_last_name", e.target.value)}
                placeholder="Rossi"
                className={FIELD}
              />
            </Field>
            <Field label="Telefono">
              <input
                type="tel"
                value={data.contact_phone}
                onChange={(e) => set("contact_phone", e.target.value)}
                placeholder="+39 333 123 4567"
                className={FIELD}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={data.contact_email}
                onChange={(e) => set("contact_email", e.target.value)}
                placeholder="mario@esempio.com"
                className={FIELD}
              />
            </Field>
          </div>
        </div>

        <div>
          <p className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-pork-ink/40">
            <MapPin size={14} /> Sedi
          </p>

          <div className="space-y-3">
            {data.locations.map((loc, idx) => (
              <div key={loc.id} className="rounded-2xl border border-pork-ink/10 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-pork-ink/50">
                    {idx === 0 ? "Sede principale" : `Sede ${idx + 1}`}
                  </span>
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={() => removeLocation(loc.id)}
                      className="rounded-full p-1 text-pork-ink/30 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Field label="Via / Viale / Piazza">
                    <input
                      value={loc.street}
                      onChange={(e) => updateLocation(loc.id, "street", e.target.value)}
                      placeholder="Via Roma"
                      className={FIELD}
                    />
                  </Field>
                  <Field label="Civico">
                    <input
                      value={loc.street_number}
                      onChange={(e) => updateLocation(loc.id, "street_number", e.target.value)}
                      placeholder="42"
                      className={`${FIELD} w-24`}
                    />
                  </Field>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Comune">
                    <input
                      value={loc.city}
                      onChange={(e) => updateLocation(loc.id, "city", e.target.value)}
                      placeholder="Milano"
                      className={FIELD}
                    />
                  </Field>
                  <Field label="Nazione">
                    <select
                      value={loc.country}
                      onChange={(e) => updateLocation(loc.id, "country", e.target.value)}
                      className={FIELD}
                    >
                      {COUNTRY_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addLocation}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-dashed border-pork-ink/20 px-4 py-2 text-sm font-bold text-pork-ink/50 hover:border-pork-red/40 hover:text-pork-red"
          >
            <Plus size={14} /> Aggiungi un&apos;altra sede
          </button>
        </div>
      </div>
    </div>
  );
}

function StepReview({ data, set, step, total }: StepProps) {
  const { matchingScore, priorityScore } = computeScores(data);

  return (
    <div>
      <StepHeader
        step={step}
        total={total}
        title="Tutto pronto. Controlla e salva."
        subtitle="Verifica i dati, scegli la classificazione e poi premi Salva."
      />

      <div className="space-y-4">
        <div className="divide-y divide-pork-ink/5 rounded-2xl border border-pork-ink/10 bg-pork-ink/2">
          <SummaryRow label="Attività">
            <span className="font-black">{data.business_name}</span>
            <span className="text-pork-ink/50"> · {data.business_type}</span>
          </SummaryRow>

          <SummaryRow label="Verticale">
            {data.business_vertical === "food" ? (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-black text-orange-700">
                Menuary · Food
              </span>
            ) : (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-black text-blue-700">
                Bizery · Services
              </span>
            )}
          </SummaryRow>

          <SummaryRow label="Sito web">
            {data.has_website === false
              ? "Nessun sito"
              : data.website_url
                ? data.website_url
                : "Ha un sito (URL non inserito)"}
          </SummaryRow>

          {data.has_website && (
            <SummaryRow label="Qualità sito">
              {data.website_score_beauty > 0
                ? `Grafica ${data.website_score_beauty}★ · Funz. ${data.website_score_functionality}★ · Chiarezza ${data.website_score_clarity}★ · Aggiornato ${data.website_score_updated}★`
                : "Non valutato"}
            </SummaryRow>
          )}

          <SummaryRow label="Google Maps">
            {data.has_google_maps
              ? `Presente${!data.maps_ownership_claimed ? " · Titolarità non registrata" : data.maps_profile_complete ? " · Profilo completo" : " · Profilo incompleto"}`
              : "Non presente"}
          </SummaryRow>

          <SummaryRow label="Contatto">
            {[data.contact_first_name, data.contact_last_name].filter(Boolean).join(" ") || "—"}
            {data.contact_phone && ` · ${data.contact_phone}`}
            {data.contact_email && ` · ${data.contact_email}`}
          </SummaryRow>

          <SummaryRow label={data.locations.length > 1 ? `${data.locations.length} sedi` : "Sede"}>
            {data.locations
              .map(
                (l) =>
                  [l.street, l.street_number, l.city]
                    .filter(Boolean)
                    .join(" ") || "Sede senza indirizzo",
              )
              .join(" · ")}
          </SummaryRow>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ScoreBadge label="Match score" value={matchingScore} />
          <ScoreBadge label="Priority score" value={priorityScore} />
        </div>

        <div>
          <p className="mb-3 text-sm font-black uppercase tracking-wide text-pork-ink/40">
            Classificazione lead
          </p>
          <div className="flex gap-3">
            <TempButton
              emoji="❄️"
              label="Freddo"
              description="Non ancora contattato"
              selected={data.temperature === "cold"}
              onClick={() => set("temperature", "cold")}
              color="blue"
            />
            <TempButton
              emoji="🌡️"
              label="Tiepido"
              description="C'è stato un contatto"
              selected={data.temperature === "warm"}
              onClick={() => set("temperature", "warm")}
              color="amber"
            />
            <TempButton
              emoji="🔥"
              label="Caldo"
              description="È interessato"
              selected={data.temperature === "hot"}
              onClick={() => set("temperature", "hot")}
              color="red"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3 text-sm">
      <span className="w-28 shrink-0 font-bold text-pork-ink/40">{label}</span>
      <span className="text-pork-ink">{children}</span>
    </div>
  );
}

function ScoreBadge({ label, value }: { label: string; value: number }) {
  const color =
    value >= 70
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : value >= 45
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-pork-ink/5 border-pork-ink/10 text-pork-ink/60";
  return (
    <div className={`rounded-2xl border px-4 py-3 ${color}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-60">{label}</p>
      <p className="text-3xl font-black">
        {value}
        <span className="text-base font-bold opacity-50">/100</span>
      </p>
    </div>
  );
}

function TempButton({
  emoji,
  label,
  description,
  selected,
  onClick,
  color,
}: {
  emoji: string;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  color: "blue" | "amber" | "red";
}) {
  const colors: Record<string, string> = {
    blue: selected ? "border-blue-400 bg-blue-50 text-blue-700" : "border-pork-ink/10 text-pork-ink",
    amber: selected
      ? "border-amber-400 bg-amber-50 text-amber-700"
      : "border-pork-ink/10 text-pork-ink",
    red: selected ? "border-pork-red bg-pork-red/10 text-pork-red" : "border-pork-ink/10 text-pork-ink",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-2xl border-2 p-4 text-left transition-all ${colors[color]}`}
    >
      <span className="block text-2xl">{emoji}</span>
      <span className="mt-2 block text-sm font-black">{label}</span>
      <span className={`block text-xs ${selected ? "opacity-70" : "text-pork-ink/40"}`}>
        {description}
      </span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function buildSteps(hasWebsite: boolean | null): Step[] {
  return [
    "identity",
    "website",
    ...(hasWebsite === true ? (["website_quality"] as Step[]) : []),
    "maps",
    "contacts",
    "review",
  ];
}

export function PlatformLeadCreatePage() {
  const router = useRouter();
  const [data, setData] = useState<WizardData>(INITIAL);
  const [step, setStep] = useState<Step>("identity");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  const steps = buildSteps(data.has_website);
  const currentIndex = steps.indexOf(step);
  const stepNumber = currentIndex + 1;
  const total = steps.length;

  function canProceed(): boolean {
    if (step === "identity")
      return data.business_name.trim().length > 0 && data.business_type.trim().length > 0;
    if (step === "website") return data.has_website !== null;
    if (step === "website_quality")
      return (
        data.website_score_beauty > 0 &&
        data.website_score_functionality > 0 &&
        data.website_score_clarity > 0 &&
        data.website_score_updated > 0
      );
    return true;
  }

  function goNext() {
    const next = buildSteps(data.has_website)[currentIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = buildSteps(data.has_website)[currentIndex - 1];
    if (prev) setStep(prev);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const { matchingScore, priorityScore } = computeScores(data);

    const payload = {
      business_name: data.business_name.trim(),
      business_vertical: data.business_vertical,
      business_type: data.business_type || null,
      contact_first_name: data.contact_first_name || null,
      contact_last_name: data.contact_last_name || null,
      contact_phone: data.contact_phone || null,
      contact_email: data.contact_email || null,
      has_website: data.has_website,
      website_url: data.has_website ? data.website_url || null : null,
      website_score_beauty:
        data.has_website && data.website_score_beauty > 0 ? data.website_score_beauty : null,
      website_score_functionality:
        data.has_website && data.website_score_functionality > 0
          ? data.website_score_functionality
          : null,
      website_score_clarity:
        data.has_website && data.website_score_clarity > 0 ? data.website_score_clarity : null,
      website_score_updated:
        data.has_website && data.website_score_updated > 0 ? data.website_score_updated : null,
      has_google_maps: data.has_google_maps,
      maps_ownership_claimed: data.maps_ownership_claimed,
      maps_profile_complete: data.maps_profile_complete,
      temperature: data.temperature,
      source: "manuale",
      matching_score: matchingScore,
      priority_score: priorityScore,
      locations: data.locations.map((l, idx) => ({
        name: idx === 0 ? "Sede principale" : `Sede ${idx + 1}`,
        street: l.street || null,
        street_number: l.street_number || null,
        city: l.city || null,
        country: l.country || "IT",
        is_primary: idx === 0,
      })),
    };

    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Errore durante il salvataggio.");
      router.replace(`/admin/crm/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto.");
      setSaving(false);
    }
  }

  const stepProps: StepProps = { data, set, step: stepNumber, total };

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="impact-title text-xs text-pork-red">CRM · Nuovo Lead</p>
          <h1 className="headline text-4xl">Inserimento guidato</h1>
        </div>
        <Link
          href="/admin/crm"
          className="inline-flex items-center gap-2 rounded-full bg-pork-ink/5 px-4 py-2 text-sm font-black text-pork-ink hover:bg-pork-ink/10"
        >
          <ChevronLeft size={16} /> CRM
        </Link>
      </header>

      <div className="rounded-3xl bg-white p-8 ring-1 ring-pork-ink/10">
        {step === "identity" && <StepIdentity {...stepProps} />}
        {step === "website" && <StepWebsite {...stepProps} />}
        {step === "website_quality" && <StepWebsiteQuality {...stepProps} />}
        {step === "maps" && <StepMaps {...stepProps} />}
        {step === "contacts" && <StepContacts {...stepProps} />}
        {step === "review" && <StepReview {...stepProps} />}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          {currentIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-full border border-pork-ink/15 px-5 py-3 text-sm font-black text-pork-ink hover:bg-pork-ink/5"
            >
              <ArrowLeft size={16} /> Indietro
            </button>
          ) : (
            <div />
          )}

          {step === "review" ? (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-pork-red px-6 py-3 text-sm font-black text-white hover:bg-pork-red/90 disabled:cursor-not-allowed disabled:bg-pork-ink/25"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Salva lead
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="inline-flex items-center gap-2 rounded-full bg-pork-red px-6 py-3 text-sm font-black text-white hover:bg-pork-red/90 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Avanti <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
