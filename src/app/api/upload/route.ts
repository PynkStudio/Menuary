import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { ADMIN_TOKEN_HEADER, getAdminPassword } from "@/lib/admin-auth";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 6 * 1024 * 1024;
const BUCKET = "menu-images";

export async function POST(req: NextRequest) {
  const token = req.headers.get(ADMIN_TOKEN_HEADER);

  const form = await req.formData();
  const tenantId = form.get("tenantId");
  if (token !== getAdminPassword()) {
    if (typeof tenantId !== "string" || !(await authorizeGestione(tenantId)).ok) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no-file" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "invalid-type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "too-large" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const webp = await sharp(bytes)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toBuffer();
  const safeTenant = typeof tenantId === "string" && tenantId.trim()
    ? tenantId.trim().replace(/[^a-z0-9-]/gi, "-").toLowerCase()
    : "shared";
  const name = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const objectPath = `${safeTenant}/${name}`;

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, webp, {
    contentType: "image/webp",
    cacheControl: "31536000, immutable",
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: "upload-failed", detail: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return NextResponse.json({ path: data.publicUrl, format: "webp" });
}
