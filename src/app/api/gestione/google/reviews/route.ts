import { NextResponse } from "next/server";
import { getBusinessReviews, replyToReview, deleteReviewReply } from "@/lib/google/my-business";
import { getPrimaryLocation } from "@/lib/data/google-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

// GET  /api/gestione/google/reviews?tenantId=bepork
// POST /api/gestione/google/reviews  { tenantId, reviewName, comment }   → risponde
// DELETE /api/gestione/google/reviews { tenantId, reviewName }           → elimina risposta

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenantId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const location = await getPrimaryLocation(tenantId);
  if (!location) return NextResponse.json({ error: "Sede Google non collegata" }, { status: 404 });

  try {
    const data = await getBusinessReviews(tenantId, location.locationResourceName);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, reviewName, comment } = (await request.json()) as {
    tenantId: string;
    reviewName: string;
    comment: string;
  };

  try {
    await replyToReview(tenantId, reviewName, comment);

    // Persiste la risposta anche in locale per evitare un re-fetch
    const db = createSupabaseServiceClient();
    if (db) {
      await db
        .from("reviews")
        .update({ reply_comment: comment, replied_at: new Date().toISOString() })
        .eq("google_review_id", reviewName.split("/").pop()!)
        .eq("tenant_id", tenantId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tenantId, reviewName } = (await request.json()) as {
    tenantId: string;
    reviewName: string;
  };

  try {
    await deleteReviewReply(tenantId, reviewName);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
