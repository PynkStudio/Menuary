import Image from "next/image";
import { BlogCommentForm } from "@/components/modules/blog/blog-comment-form";
import type { TenantBlogBlock, TenantBlogPost } from "@/lib/tenant-blog";

function BlogBlockView({ block }: { block: TenantBlogBlock }) {
  if (block.type === "heading") return <h3>{block.content}</h3>;
  if (block.type === "quote") {
    return (
      <blockquote>
        <p>{block.content}</p>
        {block.caption && <cite>{block.caption}</cite>}
      </blockquote>
    );
  }
  if (block.type === "image" || block.type === "gallery") {
    return (
      <figure>
        <div className="tenant-blog-media-grid">
          {block.mediaUrls.map((url) => (
            <span key={url} className="tenant-blog-media">
              <Image src={url} alt={block.caption ?? ""} fill className="object-cover" />
            </span>
          ))}
        </div>
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }
  if (block.type === "embed") {
    return (
      <p>
        <a href={block.content} target="_blank" rel="noopener noreferrer">{block.content}</a>
      </p>
    );
  }
  return <p>{block.content}</p>;
}

export function TenantBlogSection({
  tenantId,
  posts,
  showComments = true,
  className = "",
}: {
  tenantId: string;
  posts: TenantBlogPost[];
  showComments?: boolean;
  className?: string;
}) {
  if (!posts.length) return null;

  return (
    <section className={`tenant-blog-section ${className}`.trim()}>
      {posts.map((post) => (
        <article key={post.id} className="tenant-blog-post" id={`blog-${post.slug}`}>
          {post.coverImageUrl && (
            <div className="tenant-blog-cover">
              <Image src={post.coverImageUrl} alt="" fill className="object-cover" />
            </div>
          )}
          <header>
            <time dateTime={post.publishedAt ?? post.createdAt}>
              {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </time>
            <h2>{post.title}</h2>
            {post.excerpt && <p>{post.excerpt}</p>}
          </header>
          <div className="tenant-blog-body">
            {post.blocks.map((block) => (
              <BlogBlockView key={block.id ?? `${block.type}-${block.position}`} block={block} />
            ))}
          </div>
          {showComments && (
            <section className="tenant-blog-comments" aria-label={`Commenti su ${post.title}`}>
              {post.comments.length > 0 && (
                <div className="tenant-blog-comment-list">
                  {post.comments.map((comment) => (
                    <article key={comment.id}>
                      <strong>{comment.authorName}</strong>
                      <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleDateString("it-IT")}</time>
                      <p>{comment.body}</p>
                    </article>
                  ))}
                </div>
              )}
              <BlogCommentForm tenantId={tenantId} postId={post.id} />
            </section>
          )}
        </article>
      ))}
    </section>
  );
}
