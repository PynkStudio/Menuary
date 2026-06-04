import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ADMIN_TOKEN_HEADER, getAdminPassword } from "@/lib/admin-auth";
import { authorizeGestione } from "@/lib/gestione-auth";

export const runtime = "nodejs";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 6 * 1024 * 1024;

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
  const dir = path.join(process.cwd(), "public", "uploads", safeTenant);
  await mkdir(dir, { recursive: true });
  const filepath = path.join(dir, name);
  await writeFile(filepath, webp);
  return NextResponse.json({ path: `/uploads/${safeTenant}/${name}`, format: "webp" });
}
