import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { applyCrmFilters, requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { CRM_STATUS_LABELS, describeAttribution, employeesLabel, sourceLabel, type CrmStatus } from "@/lib/pynkstudio/crm-shared";
import type { Attribution } from "@/lib/tracking/types";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  // Neutralizza le formule quando il CSV viene aperto in Excel/Sheets.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });

  const url = new URL(request.url);
  const { data, error } = await applyCrmFilters(svc.from("pynkstudio_crm").select("*"), url)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });

  const header = [
    "Nome", "Email", "Telefono", "Azienda", "Persone", "Settore", "Stato", "Sorgente", "Canale", "Campagna",
    "Interessi", "Tempistica", "Percorso", "Call", "Ultima attività", "Prossimo follow-up", "Valore stimato",
    "Disiscritto", "Tag", "Creato",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const c of data ?? []) {
    const ch = describeAttribution((c.first_attribution ?? null) as Attribution | null);
    lines.push([
      c.name, c.email, c.phone, c.company, employeesLabel(c), c.industry,
      CRM_STATUS_LABELS[c.status as CrmStatus] ?? c.status, sourceLabel(c.source), ch.channel, ch.detail,
      c.interests.join(" · "), c.timing, c.plan_interest, c.bookings_count, c.last_activity_at,
      c.next_follow_up_at, c.estimated_value, c.unsubscribed_at ? "sì" : "", c.tags.join(", "), c.created_at,
    ].map(csvCell).join(","));
  }

  return new NextResponse(`﻿${lines.join("\r\n")}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="crm-pynkstudio-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
