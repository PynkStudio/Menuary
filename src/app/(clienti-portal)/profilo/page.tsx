import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClientsProfileForm } from "@/components/clients/clients-profile-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ClientProfile } from "@/lib/clients-types";

export const metadata: Metadata = {
  title: "Profilo",
};

function parseDietNotes(value: string | null) {
  const allergiesNote = value?.match(/(?:^|\n)Allergie\/intolleranze:\s*(.*)/i)?.[1]?.trim() ?? value ?? "";
  const preferences = value?.match(/(?:^|\n)Preferenze:\s*(.*)/i)?.[1]
    ?.split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean) ?? [];
  return { allergiesNote, preferences };
}

export default async function ClientiProfiloPage() {
  const supabase = await createSupabaseServerClient(".menuary.it");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profilo");
  const { data: stored } = await supabase
    .from("user_profiles")
    .select("birth_date,diet_notes,is_vegetarian")
    .eq("user_id", user.id)
    .maybeSingle();
  const parsed = parseDietNotes(stored?.diet_notes ?? null);
  const metadata = user.user_metadata as Record<string, unknown>;
  const profile: ClientProfile = {
    id: user.id,
    firstName: typeof metadata.first_name === "string" ? metadata.first_name : "",
    lastName: typeof metadata.last_name === "string" ? metadata.last_name : "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    birthDate: stored?.birth_date ?? "",
    allergiesNote: parsed.allergiesNote,
    dietaryPreferences: parsed.preferences.length
      ? parsed.preferences
      : stored?.is_vegetarian ? ["vegetariano"] : [],
  };
  return (
    <div>
      <p className="menuary-section-label">Dati personali</p>
      <h1 className="menuary-display mt-4 text-[clamp(1.75rem,4vw,2.5rem)]">Il tuo profilo</h1>
      <p className="mt-3 max-w-2xl text-[var(--menuary-muted)]">
        Informazioni usate per personalizzare menu e ordini e per contattarti. Allergie e preferenze
        sono condivise con i locali solo in base ai consensi e alle interazioni che scegli.
      </p>
      <div className="mt-10">
        <ClientsProfileForm initial={profile} />
      </div>
    </div>
  );
}
