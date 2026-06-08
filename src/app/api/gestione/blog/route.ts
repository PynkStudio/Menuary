import { NextResponse } from "next/server";
import { authorizeGestione } from "@/lib/gestione-auth";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import {
  slugifyBlogPostTitle,
  type TenantBlogBlockType,
  type TenantBlogCommentStatus,
  type TenantBlogPostStatus,
} from "@/lib/tenant-blog";

type BlogPostPayload = {
  id?: string;
  title?: string;
  slug?: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  status?: TenantBlogPostStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | null;
  blocks?: unknown;
  comments?: unknown;
};

type SanitizedPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  status: TenantBlogPostStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  blocks: SanitizedBlock[];
  comments: SanitizedComment[];
};

type SanitizedBlock = {
  id: string;
  type: TenantBlogBlockType;
  content: string;
  mediaUrls: string[];
  caption: string | null;
  position: number;
};

type SanitizedComment = {
  id: string;
  status: TenantBlogCommentStatus;
};

type BlogPostMutationRow = {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  status: TenantBlogPostStatus;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  updated_at: string;
};

type BlogBlockMutationRow = {
  id: string;
  post_id: string;
  type: TenantBlogBlockType;
  content: string | null;
  media_urls: string[];
  caption: string | null;
  position: number;
};

type BlogMutationClient = {
  from(table: "tenant_blog_posts"): {
    delete(): {
      eq(column: string, value: string): Promise<{ error: { message: string } | null }> & {
        not(column: string, operator: string, value: string): Promise<{ error: { message: string } | null }>;
      };
    };
    upsert(rows: BlogPostMutationRow[], options?: { onConflict?: string }): Promise<{ error: { message: string } | null }>;
  };
  from(table: "tenant_blog_blocks"): {
    delete(): { in(column: string, values: string[]): Promise<{ error: { message: string } | null }> };
    insert(rows: BlogBlockMutationRow[]): Promise<{ error: { message: string } | null }>;
  };
  from(table: "tenant_blog_comments"): {
    delete(): { in(column: string, values: string[]): Promise<{ error: { message: string } | null }> };
    update(row: { status: TenantBlogCommentStatus; moderated_at: string }): {
      eq(column: string, value: string): Promise<{ error: { message: string } | null }>;
    };
  };
};

const statuses: TenantBlogPostStatus[] = ["draft", "published", "archived"];
const blockTypes: TenantBlogBlockType[] = ["paragraph", "heading", "quote", "image", "gallery", "embed"];
const commentStatuses: TenantBlogCommentStatus[] = ["pending", "approved", "rejected"];

function trimText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalText(value: unknown, max: number) {
  const text = trimText(value, max);
  return text || null;
}

function validUuid(value: unknown) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : crypto.randomUUID();
}

function sanitizeBlocks(raw: unknown): SanitizedBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const rawType = value.type;
      const type = typeof rawType === "string" && blockTypes.includes(rawType as TenantBlogBlockType)
        ? rawType as TenantBlogBlockType
        : "paragraph";
      const mediaUrls = Array.isArray(value.mediaUrls)
        ? value.mediaUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0).map((url) => url.trim().slice(0, 800)).slice(0, 12)
        : [];

      return {
        id: validUuid(value.id),
        type,
        content: trimText(value.content, 12000),
        mediaUrls,
        caption: optionalText(value.caption, 240),
        position: index,
      };
    })
    .filter((block) => block.content || block.mediaUrls.length)
    .slice(0, 80);
}

function sanitizeComments(raw: unknown): SanitizedComment[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const value = item && typeof item === "object" ? item as Record<string, unknown> : {};
    if (typeof value.id !== "string") return [];
    const rawStatus = value.status;
    const status = typeof rawStatus === "string" && commentStatuses.includes(rawStatus as TenantBlogCommentStatus)
      ? rawStatus as TenantBlogCommentStatus
      : "pending";
    return [{ id: value.id, status }];
  });
}

function sanitizePosts(raw: unknown): SanitizedPost[] {
  if (!Array.isArray(raw)) return [];
  const usedSlugs = new Map<string, number>();

  return raw
    .map((item) => {
      const value = item && typeof item === "object" ? item as BlogPostPayload : {};
      const title = trimText(value.title, 160);
      if (!title) return null;

      const baseSlug = slugifyBlogPostTitle(trimText(value.slug, 120) || title);
      const usedCount = usedSlugs.get(baseSlug) ?? 0;
      usedSlugs.set(baseSlug, usedCount + 1);
      const slug = usedCount > 0 ? `${baseSlug}-${usedCount + 1}` : baseSlug;
      const status = statuses.includes(value.status as TenantBlogPostStatus) ? value.status as TenantBlogPostStatus : "draft";

      return {
        id: validUuid(value.id),
        title,
        slug,
        excerpt: optionalText(value.excerpt, 500),
        coverImageUrl: optionalText(value.coverImageUrl, 800),
        status,
        seoTitle: optionalText(value.seoTitle, 160),
        seoDescription: optionalText(value.seoDescription, 220),
        publishedAt: status === "published" ? (optionalText(value.publishedAt, 40) ?? new Date().toISOString()) : null,
        blocks: sanitizeBlocks(value.blocks),
        comments: sanitizeComments(value.comments),
      };
    })
    .filter((post): post is SanitizedPost => Boolean(post))
    .slice(0, 500);
}

export async function PUT(request: Request) {
  let body: { tenantId?: string; posts?: unknown; deletedCommentIds?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body non valido." }, { status: 400 });
  }

  const tenantId = body.tenantId?.trim();
  if (!tenantId) return NextResponse.json({ error: "tenantId richiesto." }, { status: 400 });

  const auth = await authorizeGestione(tenantId);
  if (!auth.ok) return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });

  const posts = sanitizePosts(body.posts);
  const deletedCommentIds = Array.isArray(body.deletedCommentIds)
    ? body.deletedCommentIds.filter((id): id is string => typeof id === "string")
    : [];

  if (auth.isDemo) return NextResponse.json({ ok: true, posts });

  const db = createSupabaseServiceClient();
  if (!db) return NextResponse.json({ error: "Service role non configurato." }, { status: 500 });
  const mutation = db as unknown as BlogMutationClient;
  const now = new Date().toISOString();
  const postIds = posts.map((post) => post.id);

  const deletePostQuery = mutation.from("tenant_blog_posts").delete().eq("tenant_id", tenantId);
  const { error: deletePostError } = postIds.length
    ? await deletePostQuery.not("id", "in", `(${postIds.join(",")})`)
    : await deletePostQuery;
  if (deletePostError) return NextResponse.json({ error: deletePostError.message }, { status: 500 });

  if (posts.length) {
    const { error: upsertError } = await mutation.from("tenant_blog_posts").upsert(
      posts.map((post) => ({
        id: post.id,
        tenant_id: tenantId,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        cover_image_url: post.coverImageUrl,
        status: post.status,
        seo_title: post.seoTitle,
        seo_description: post.seoDescription,
        published_at: post.publishedAt,
        updated_at: now,
      })),
      { onConflict: "id" },
    );
    if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

    const { error: deleteBlocksError } = await mutation.from("tenant_blog_blocks").delete().in("post_id", postIds);
    if (deleteBlocksError) return NextResponse.json({ error: deleteBlocksError.message }, { status: 500 });

    const blockRows = posts.flatMap((post) =>
      post.blocks.map((block) => ({
        id: block.id,
        post_id: post.id,
        type: block.type,
        content: block.content || null,
        media_urls: block.mediaUrls,
        caption: block.caption,
        position: block.position,
      })),
    );
    if (blockRows.length) {
      const { error: insertBlocksError } = await mutation.from("tenant_blog_blocks").insert(blockRows);
      if (insertBlocksError) return NextResponse.json({ error: insertBlocksError.message }, { status: 500 });
    }
  }

  if (deletedCommentIds.length) {
    const { error: deleteCommentsError } = await mutation.from("tenant_blog_comments").delete().in("id", deletedCommentIds);
    if (deleteCommentsError) return NextResponse.json({ error: deleteCommentsError.message }, { status: 500 });
  }

  for (const comment of posts.flatMap((post) => post.comments)) {
    const { error: commentError } = await mutation
      .from("tenant_blog_comments")
      .update({ status: comment.status, moderated_at: now })
      .eq("id", comment.id);
    if (commentError) return NextResponse.json({ error: commentError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, posts });
}
