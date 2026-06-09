import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type BlogCommentInsertRow = {
  post_id: string;
  author_name: string;
  author_email: string;
  body: string;
  status: "pending";
  ip_hash: string | null;
  user_agent: string | null;
};

type BlogCommentClient = {
  from(table: "tenant_blog_posts"): {
    select(columns: string): {
      eq(column: string, value: string): {
        eq(column: string, value: string): {
          eq(column: string, value: string): {
            maybeSingle(): Promise<{ data: { id: string; published_at: string | null } | null; error: { message: string } | null }>;
          };
        };
      };
    };
  };
  from(table: "tenant_blog_comments"): {
    insert(row: BlogCommentInsertRow): Promise<{ error: { message: string } | null }>;
  };
};

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function hashIp(ip: string | null) {
  const salt = process.env.BLOG_COMMENT_IP_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!ip || !salt) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  let body: { postId?: string; username?: string; email?: string; comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const postId = text(body.postId, 80);
  const username = text(body.username, 80);
  const email = text(body.email, 180).toLowerCase();
  const comment = text(body.comment, 2000);

  if (!postId || !username || !email || !comment) {
    return NextResponse.json({ error: "Username, email e commento sono obbligatori." }, { status: 400 });
  }
  if (!validEmail(email)) {
    return NextResponse.json({ error: "Inserisci una mail valida." }, { status: 400 });
  }

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Service role non configurato." }, { status: 500 });

  const client = db as unknown as BlogCommentClient;
  const { data: post, error: postError } = await client
    .from("tenant_blog_posts")
    .select("id,published_at")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .eq("status", "published")
    .maybeSingle();
  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 });
  if (!post) return NextResponse.json({ error: "Articolo non trovato." }, { status: 404 });
  if (!post.published_at || new Date(post.published_at).getTime() > Date.now()) {
    return NextResponse.json({ error: "Articolo non disponibile." }, { status: 404 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;
  const { error } = await client.from("tenant_blog_comments").insert({
    post_id: postId,
    author_name: username,
    author_email: email,
    body: comment,
    status: "pending",
    ip_hash: hashIp(forwarded),
    user_agent: userAgent,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status: "pending" });
}
