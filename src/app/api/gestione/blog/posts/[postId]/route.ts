import { NextResponse } from "next/server";
import { requireGestione } from "@/lib/gestione-auth";
import { deleteBlogPost, saveBlogPost, type BlogPostPatch } from "@/lib/blog/write";

const STATUS_BY_CODE = {
  not_found: 404,
  conflict: 409,
  invalid: 400,
  db_error: 500,
} as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  let body: {
    tenantId?: string;
    expectedUpdatedAt?: string | null;
    allowTranslationGaps?: boolean;
    patch?: BlogPostPatch;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const tenantId = body.tenantId?.trim();
  if (!tenantId) return NextResponse.json({ error: "tenantId richiesto." }, { status: 400 });

  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "Non autorizzato." }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ ok: true, updatedAt: new Date().toISOString(), demo: true });

  const result = await saveBlogPost({
    tenantId,
    postId,
    expectedUpdatedAt: body.expectedUpdatedAt ?? null,
    patch: body.patch ?? {},
    allowTranslationGaps: body.allowTranslationGaps === true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.message, code: result.code },
      { status: STATUS_BY_CODE[result.code] },
    );
  }
  return NextResponse.json({ ok: true, updatedAt: result.updatedAt });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const tenantId = new URL(request.url).searchParams.get("tenantId")?.trim();
  if (!tenantId) return NextResponse.json({ error: "tenantId richiesto." }, { status: 400 });

  const auth = await requireGestione(tenantId, "admin");
  if (!auth.ok) return NextResponse.json({ error: "Non autorizzato." }, { status: auth.status });
  if (auth.isDemo) return NextResponse.json({ ok: true, demo: true });

  const result = await deleteBlogPost(tenantId, postId);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
