import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type TenantBlogPostStatus = "draft" | "published" | "archived";
export type TenantBlogBlockType = "paragraph" | "heading" | "quote" | "image" | "gallery" | "embed";
export type TenantBlogCommentStatus = "pending" | "approved" | "rejected";

export type TenantBlogBlock = {
  id?: string;
  type: TenantBlogBlockType;
  content: string;
  mediaUrls: string[];
  caption?: string | null;
  position: number;
};

export type TenantBlogComment = {
  id: string;
  authorName: string;
  authorEmail: string;
  body: string;
  status: TenantBlogCommentStatus;
  createdAt: string;
};

export type TenantBlogPost = {
  id: string;
  tenantId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  status: TenantBlogPostStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  blocks: TenantBlogBlock[];
  comments: TenantBlogComment[];
};

type BlogPostRow = {
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
  created_at: string;
  updated_at: string;
};

type BlogBlockRow = {
  id: string;
  post_id: string;
  type: TenantBlogBlockType;
  content: string | null;
  media_urls: string[] | null;
  caption: string | null;
  position: number;
};

type BlogCommentRow = {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  body: string;
  status: TenantBlogCommentStatus;
  created_at: string;
};

type BlogSelectQuery<T> = {
  eq(column: string, value: string | boolean): BlogSelectQuery<T>;
  in(column: string, values: string[]): BlogSelectQuery<T>;
  order(column: string, options?: { ascending?: boolean }): BlogSelectQuery<T>;
  then<TResult1 = { data: T[] | null; error: { message: string } | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T[] | null; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2>;
};

type BlogTableClient = {
  from(table: "tenant_blog_posts"): {
    select(columns: string): BlogSelectQuery<BlogPostRow>;
  };
  from(table: "tenant_blog_blocks"): {
    select(columns: string): BlogSelectQuery<BlogBlockRow>;
  };
  from(table: "tenant_blog_comments"): {
    select(columns: string): BlogSelectQuery<BlogCommentRow>;
  };
};

export function slugifyBlogPostTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "articolo";
}

function mapBlock(row: BlogBlockRow): TenantBlogBlock {
  return {
    id: row.id,
    type: row.type,
    content: row.content ?? "",
    mediaUrls: row.media_urls ?? [],
    caption: row.caption,
    position: row.position,
  };
}

function mapComment(row: BlogCommentRow): TenantBlogComment {
  return {
    id: row.id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapPost(
  row: BlogPostRow,
  blocks: TenantBlogBlock[],
  comments: TenantBlogComment[],
): TenantBlogPost {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    blocks,
    comments,
  };
}

export async function getTenantBlogPosts(
  tenantId: string,
  options: { publishedOnly?: boolean; includeComments?: boolean } = {},
): Promise<TenantBlogPost[]> {
  const db = createSupabaseServiceClient();
  if (!db) return [];

  let postsQuery = (db as unknown as BlogTableClient)
    .from("tenant_blog_posts")
    .select("id,tenant_id,title,slug,excerpt,cover_image_url,status,seo_title,seo_description,published_at,created_at,updated_at")
    .eq("tenant_id", tenantId)
    .order("published_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (options.publishedOnly) postsQuery = postsQuery.eq("status", "published");

  const { data: postRows, error } = await postsQuery;
  if (error || !postRows?.length) return [];

  const postIds = postRows.map((post) => post.id);
  const [{ data: blockRows }, { data: commentRows }] = await Promise.all([
    (db as unknown as BlogTableClient)
      .from("tenant_blog_blocks")
      .select("id,post_id,type,content,media_urls,caption,position")
      .in("post_id", postIds)
      .order("position", { ascending: true }),
    options.includeComments
      ? (db as unknown as BlogTableClient)
          .from("tenant_blog_comments")
          .select("id,post_id,author_name,author_email,body,status,created_at")
          .in("post_id", postIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as BlogCommentRow[] | null, error: null }),
  ]);

  const blocksByPost = new Map<string, TenantBlogBlock[]>();
  for (const block of blockRows ?? []) {
    const current = blocksByPost.get(block.post_id) ?? [];
    current.push(mapBlock(block));
    blocksByPost.set(block.post_id, current);
  }

  const commentsByPost = new Map<string, TenantBlogComment[]>();
  for (const comment of commentRows ?? []) {
    if (options.publishedOnly && comment.status !== "approved") continue;
    const current = commentsByPost.get(comment.post_id) ?? [];
    current.push(mapComment(comment));
    commentsByPost.set(comment.post_id, current);
  }

  return postRows.map((post) =>
    mapPost(post, blocksByPost.get(post.id) ?? [], commentsByPost.get(post.id) ?? []),
  );
}
