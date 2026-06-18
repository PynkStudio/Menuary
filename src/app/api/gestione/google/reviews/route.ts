import { NextResponse } from "next/server";
import { getBusinessReviews, replyToReview, deleteReviewReply } from "@/lib/google/my-business";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { authorizeGestione } from "@/lib/gestione-auth";
import { requireActiveGestioneLocation } from "@/lib/gestione-location";

// GET  /api/gestione/google/reviews?tenantId=bepork
// POST /api/gestione/google/reviews  { tenantId, reviewName, comment }   → risponde
// DELETE /api/gestione/google/reviews { tenantId, reviewName }           → elimina risposta

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.isDemo) return NextResponse.json([]);
  const activeLocation = await requireActiveGestioneLocation(tenantId);
  const location = await getPrimaryLocation(tenantId, activeLocation.id);
  if (!location) return NextResponse.json({ error: "Sede Google non collegata" }, { status: 404 });

  try {
    const data = await getBusinessReviews(tenantId, location.locationResourceName);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { tenantId, reviewName, comment } = (await request.json()) as {
    tenantId: string;
    reviewName: string;
    comment: string;
  };
  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.isDemo) return NextResponse.json({ ok: true });
  const activeLocation = await requireActiveGestioneLocation(tenantId);
  const db = createSupabaseServiceClient();
  const googleReviewId = reviewName.split("/").pop()!;
  const { data: review } = db
    ? await db
        .from("reviews")
        .select("id")
        .eq("google_review_id", googleReviewId)
        .eq("tenant_id", tenantId)
        .eq("location_id", activeLocation.id)
        .maybeSingle()
    : { data: null };
  if (!review) return NextResponse.json({ error: "Recensione non trovata nella sede attiva" }, { status: 404 });

  try {
    await replyToReview(tenantId, reviewName, comment);

    // Persiste la risposta anche in locale per evitare un re-fetch
    if (db) {
      await db
        .from("reviews")
        .update({ reply_comment: comment, replied_at: new Date().toISOString() })
        .eq("google_review_id", googleReviewId)
        .eq("tenant_id", tenantId)
        .eq("location_id", activeLocation.id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { tenantId, reviewName } = (await request.json()) as {
    tenantId: string;
    reviewName: string;
  };
  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.isDemo) return NextResponse.json({ ok: true });
  const activeLocation = await requireActiveGestioneLocation(tenantId);
  const db = createSupabaseServiceClient();
  const googleReviewId = reviewName.split("/").pop()!;
  const { data: review } = db
    ? await db
        .from("reviews")
        .select("id")
        .eq("google_review_id", googleReviewId)
        .eq("tenant_id", tenantId)
        .eq("location_id", activeLocation.id)
        .maybeSingle()
    : { data: null };
  if (!review) return NextResponse.json({ error: "Recensione non trovata nella sede attiva" }, { status: 404 });

  try {
    await deleteReviewReply(tenantId, reviewName);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
