import { NextResponse } from "next/server";
import { requireGestione } from "@/lib/gestione-auth";
import { createBlogPost } from "@/lib/blog/write";

export async function POST(request: Request) {
  let body: { tenantId?: string; title?: string; locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const tenantId = body.tenantId?.trim();
  if (!tenantId) return NextResponse.json({ error: "tenantId richiesto." }, { status: 400 });

  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "Non autorizzato." }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ ok: true, postId: crypto.randomUUID(), demo: true });

  const result = await createBlogPost({
    tenantId,
    title: typeof body.title === "string" ? body.title : "",
    locale: typeof body.locale === "string" ? body.locale : undefined,
  });
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 500 });

  return NextResponse.json({ ok: true, postId: result.postId });
}
