import { NextRequest, NextResponse } from "next/server";
import { ADMIN_TOKEN_HEADER, getAdminPassword } from "@/lib/admin-auth";
import { extractMenuItemsFromImage } from "@/lib/menu-photo-import";

export const runtime = "nodejs";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 10 * 1024 * 1024;

type JsonBody = {
  imageUrl?: string;
  image_url?: string;
  imageDataUrl?: string;
  image_data_url?: string;
  locale?: string;
  context?: string;
};

function isAuthorized(request: NextRequest): boolean {
  const adminToken = request.headers.get(ADMIN_TOKEN_HEADER);
  if (adminToken && adminToken === getAdminPassword()) return true;

  const supportSecret = process.env.TENANT_SUPPORT_WHATSAPP_SECRET || process.env.WHATSAPP_WEB_BRIDGE_SECRET;
  if (!supportSecret) return false;
  return (
    request.headers.get("x-tenant-support-whatsapp-secret") === supportSecret ||
    request.headers.get("x-whatsapp-web-secret") === supportSecret
  );
}

function extensionMime(file: File): string {
  if (ALLOWED.includes(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  return file.type;
}

async function fileToDataUrl(file: File): Promise<string> {
  const mime = extensionMime(file);
  if (!ALLOWED.includes(mime)) throw new Error("invalid-type");
  if (file.size > MAX_SIZE) throw new Error("too-large");
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${mime};base64,${base64}`;
}

async function remoteImageToDataUrl(url: string): Promise<string> {
  if (url.startsWith("data:image/")) return url;
  if (!/^https?:\/\//i.test(url)) throw new Error("image_url_must_be_absolute");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`image_fetch_failed:${response.status}`);
  const mime = response.headers.get("content-type")?.split(";")[0] ?? "";
  if (!ALLOWED.includes(mime)) throw new Error("invalid-type");

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength > MAX_SIZE) throw new Error("too-large");
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function imageDataFromRequest(request: NextRequest): Promise<{
  imageDataUrl: string;
  locale?: string;
  context?: string;
}> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("no-file");
    return {
      imageDataUrl: await fileToDataUrl(file),
      locale: typeof form.get("locale") === "string" ? String(form.get("locale")) : undefined,
      context: typeof form.get("context") === "string" ? String(form.get("context")) : undefined,
    };
  }

  const body = (await request.json().catch(() => null)) as JsonBody | null;
  if (!body) throw new Error("invalid_json");
  const imageDataUrl = body.imageDataUrl ?? body.image_data_url;
  if (imageDataUrl?.startsWith("data:image/")) {
    return { imageDataUrl, locale: body.locale, context: body.context };
  }
  const imageUrl = body.imageUrl ?? body.image_url;
  if (!imageUrl) throw new Error("image_required");
  return {
    imageDataUrl: await remoteImageToDataUrl(imageUrl),
    locale: body.locale,
    context: body.context,
  };
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const input = await imageDataFromRequest(request);
    const result = await extractMenuItemsFromImage(input);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "menu_photo_import_failed";
    const status =
      message === "no-file" || message === "invalid_json" || message === "image_required"
        ? 400
        : message === "invalid-type"
          ? 415
          : message === "too-large"
            ? 413
            : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
