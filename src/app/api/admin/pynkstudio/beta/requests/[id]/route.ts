import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { requireSiteadmin } from "@/lib/pynkstudio/crm-admin";
import { betaOrigin, sendBetaMail } from "@/lib/pynkstudio/beta";
import { betaApprovedHtml } from "@/lib/pynkstudio/email-templates";
import { betaDeviceLabel, cleanBetaChannels } from "@/lib/pynkstudio/beta-shared";

export const dynamic = "force-dynamic";

/** { status: "approved" | "rejected" | "pending" }. L'approvazione avvisa il tester via email. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSiteadmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const svc = createSupabaseServiceClient();
  if (!svc) return NextResponse.json({ error: "supabase_unconfigured" }, { status: 503 });
  const { id } = await params;

  let status = "";
  try {
    status = String(((await request.json()) as { status?: unknown }).status ?? "");
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!["approved", "rejected", "pending"].includes(status)) return NextResponse.json({ error: "invalid_status" }, { status: 400 });

  const { data: before } = await svc.from("pynkstudio_beta_requests").select("*").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data, error } = await svc
    .from("pynkstudio_beta_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) return NextResponse.json({ error: "db_error" }, { status: 500 });

  let emailed = false;
  if (status === "approved" && before.status !== "approved") {
    const [{ data: tester }, { data: beta }] = await Promise.all([
      svc.from("pynkstudio_beta_testers").select("email, first_name").eq("id", data.tester_id).maybeSingle(),
      svc.from("pynkstudio_betas").select("name, channels").eq("id", data.beta_id).maybeSingle(),
    ]);
    if (tester && beta) {
      const site = betaOrigin(request);
      const channel = cleanBetaChannels(beta.channels).find((c) => c.device === data.device);
      const result = await sendBetaMail(
        tester.email,
        `${beta.name}: richiesta beta approvata`,
        betaApprovedHtml({
          firstName: tester.first_name,
          betaName: beta.name,
          deviceLabel: betaDeviceLabel(data.device),
          url: channel?.url || null,
          installUrl: channel?.installUrl ?? null,
          areaUrl: `${site}/beta`,
        }),
      );
      emailed = result.ok;
    }
  }
  return NextResponse.json({ request: data, emailed });
}
