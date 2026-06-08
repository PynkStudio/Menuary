"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  GripVertical,
  ImagePlus,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import {
  slugifyBlogPostTitle,
  type TenantBlogBlock,
  type TenantBlogBlockType,
  type TenantBlogComment,
  type TenantBlogPost,
  type TenantBlogPostStatus,
} from "@/lib/tenant-blog";

type EditableBlock = TenantBlogBlock & { localId: string };
type EditableComment = TenantBlogComment & { deleted?: boolean };
type EditablePost = Omit<TenantBlogPost, "blocks" | "comments"> & {
  localId: string;
  blocks: EditableBlock[];
  comments: EditableComment[];
};

const blockLabels: Record<TenantBlogBlockType, string> = {
  paragraph: "Paragrafo",
  heading: "Titolo sezione",
  quote: "Citazione",
  image: "Immagine",
  gallery: "Gallery",
  embed: "Embed",
};

function emptyBlock(type: TenantBlogBlockType = "paragraph", position = 0): EditableBlock {
  return {
    id: crypto.randomUUID(),
    localId: crypto.randomUUID(),
    type,
    content: "",
    mediaUrls: [],
    caption: "",
    position,
  };
}

function emptyPost(): EditablePost {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  return {
    id,
    localId: id,
    tenantId: "",
    title: "Nuovo articolo",
    slug: "nuovo-articolo",
    excerpt: "",
    coverImageUrl: null,
    status: "draft",
    seoTitle: "",
    seoDescription: "",
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    blocks: [emptyBlock("paragraph", 0)],
    comments: [],
  };
}

function toEditable(posts: TenantBlogPost[]): EditablePost[] {
  return posts.map((post) => ({
    ...post,
    localId: post.id,
    blocks: post.blocks.map((block, index) => ({
      ...block,
      localId: block.id ?? crypto.randomUUID(),
      mediaUrls: block.mediaUrls ?? [],
      position: index,
    })),
    comments: post.comments.map((comment) => ({ ...comment })),
  }));
}

function dateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function BlogManager({
  tenantId,
  initialPosts,
}: {
  tenantId: string;
  initialPosts: TenantBlogPost[];
}) {
  const [posts, setPosts] = useState<EditablePost[]>(() => toEditable(initialPosts));
  const [selectedId, setSelectedId] = useState<string>(() => initialPosts[0]?.id ?? "");
  const [deletedCommentIds, setDeletedCommentIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const selected = useMemo(
    () => posts.find((post) => post.localId === selectedId) ?? posts[0] ?? null,
    [posts, selectedId],
  );

  function setSelectedPost(patch: Partial<EditablePost>) {
    if (!selected) return;
    setPosts((current) =>
      current.map((post) => post.localId === selected.localId ? { ...post, ...patch } : post),
    );
  }

  function updateBlock(localId: string, patch: Partial<EditableBlock>) {
    if (!selected) return;
    setPosts((current) =>
      current.map((post) => {
        if (post.localId !== selected.localId) return post;
        return {
          ...post,
          blocks: post.blocks.map((block) => block.localId === localId ? { ...block, ...patch } : block),
        };
      }),
    );
  }

  function moveBlock(localId: string, direction: -1 | 1) {
    if (!selected) return;
    setPosts((current) =>
      current.map((post) => {
        if (post.localId !== selected.localId) return post;
        const index = post.blocks.findIndex((block) => block.localId === localId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= post.blocks.length) return post;
        const blocks = [...post.blocks];
        const [block] = blocks.splice(index, 1);
        blocks.splice(nextIndex, 0, block);
        return { ...post, blocks: blocks.map((item, itemIndex) => ({ ...item, position: itemIndex })) };
      }),
    );
  }

  function updateComment(commentId: string, patch: Partial<EditableComment>) {
    if (!selected) return;
    setPosts((current) =>
      current.map((post) => {
        if (post.localId !== selected.localId) return post;
        return {
          ...post,
          comments: post.comments.map((comment) => comment.id === commentId ? { ...comment, ...patch } : comment),
        };
      }),
    );
  }

  function deleteComment(commentId: string) {
    setDeletedCommentIds((current) => current.includes(commentId) ? current : [...current, commentId]);
    updateComment(commentId, { deleted: true });
  }

  function addPost() {
    const post = emptyPost();
    setPosts((current) => [post, ...current]);
    setSelectedId(post.localId);
  }

  async function save() {
    setPending(true);
    setStatus(null);
    const res = await fetch("/api/gestione/blog", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        posts: posts.map((post) => ({
          ...post,
          tenantId,
          slug: slugifyBlogPostTitle(post.slug || post.title),
          comments: post.comments.filter((comment) => !comment.deleted),
        })),
        deletedCommentIds,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setStatus(data.error ?? "Errore durante il salvataggio.");
      return;
    }
    setDeletedCommentIds([]);
    setStatus("Blog aggiornato.");
  }

  return (
    <div className="ga-dashboard blog-admin">
      <header>
        <span className="ga-eyebrow">Crescita</span>
        <h1 className="ga-heading">Blog</h1>
        <p className="ga-lead">Crea articoli, aggiungi media e modera i commenti semplici dei visitatori.</p>
      </header>

      <section className="blog-admin-layout">
        <aside className="blog-admin-list" aria-label="Articoli">
          <div className="ga-section-head">
            <h2 className="ga-section-title">Articoli</h2>
            <button type="button" className="ga-button ga-button-light" onClick={addPost}>
              <Plus size={16} /> Nuovo
            </button>
          </div>
          {posts.length === 0 && <div className="ga-empty">Nessun articolo ancora creato.</div>}
          {posts.map((post) => (
            <button
              type="button"
              key={post.localId}
              className="blog-admin-post-button"
              data-active={selected?.localId === post.localId}
              onClick={() => setSelectedId(post.localId)}
            >
              <span>{post.title}</span>
              <small>{post.status === "published" ? "Pubblicato" : post.status === "archived" ? "Archiviato" : "Bozza"}</small>
            </button>
          ))}
        </aside>

        {selected && (
          <article className="blog-admin-editor">
            <div className="ga-section-head">
              <div>
                <h2 className="ga-section-title">Editor articolo</h2>
                <span className="ga-section-hint">{selected.comments.filter((comment) => !comment.deleted).length} commenti</span>
              </div>
              <button
                type="button"
                className="ga-icon-button"
                aria-label="Elimina articolo"
                onClick={() => {
                  setPosts((current) => current.filter((post) => post.localId !== selected.localId));
                  setSelectedId("");
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="blog-admin-grid">
              <label>
                <span className="ga-label-text">Titolo</span>
                <input
                  className="ga-input"
                  value={selected.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setSelectedPost({ title, slug: slugifyBlogPostTitle(title) });
                  }}
                />
              </label>
              <label>
                <span className="ga-label-text">Slug</span>
                <input
                  className="ga-input"
                  value={selected.slug}
                  onChange={(event) => setSelectedPost({ slug: event.target.value })}
                />
              </label>
              <label>
                <span className="ga-label-text">Stato</span>
                <select
                  className="ga-select"
                  value={selected.status}
                  onChange={(event) => {
                    const statusValue = event.target.value as TenantBlogPostStatus;
                    setSelectedPost({
                      status: statusValue,
                      publishedAt: statusValue === "published" ? (selected.publishedAt ?? new Date().toISOString()) : selected.publishedAt,
                    });
                  }}
                >
                  <option value="draft">Bozza</option>
                  <option value="published">Pubblicato</option>
                  <option value="archived">Archiviato</option>
                </select>
              </label>
              <label>
                <span className="ga-label-text">Data pubblicazione</span>
                <input
                  type="datetime-local"
                  className="ga-input"
                  value={dateTimeLocal(selected.publishedAt)}
                  onChange={(event) => setSelectedPost({ publishedAt: fromDateTimeLocal(event.target.value) })}
                />
              </label>
            </div>

            <label>
              <span className="ga-label-text">Estratto</span>
              <textarea
                className="ga-textarea"
                rows={3}
                value={selected.excerpt ?? ""}
                onChange={(event) => setSelectedPost({ excerpt: event.target.value })}
              />
            </label>

            <div className="blog-admin-cover">
              <div>
                <span className="ga-label-text">Copertina</span>
                <ImageUpload
                  tenantId={tenantId}
                  value={selected.coverImageUrl ?? undefined}
                  onChange={(path) => setSelectedPost({ coverImageUrl: path ?? null })}
                />
              </div>
              <div className="blog-admin-seo">
                <label>
                  <span className="ga-label-text">SEO title</span>
                  <input
                    className="ga-input"
                    value={selected.seoTitle ?? ""}
                    onChange={(event) => setSelectedPost({ seoTitle: event.target.value })}
                  />
                </label>
                <label>
                  <span className="ga-label-text">SEO description</span>
                  <textarea
                    className="ga-textarea"
                    rows={4}
                    value={selected.seoDescription ?? ""}
                    onChange={(event) => setSelectedPost({ seoDescription: event.target.value })}
                  />
                </label>
              </div>
            </div>

            <section className="blog-admin-blocks">
              <div className="ga-section-head">
                <h3 className="ga-section-title">Blocchi</h3>
                <div className="blog-admin-inline-actions">
                  {(["paragraph", "heading", "quote", "image", "gallery", "embed"] as TenantBlogBlockType[]).map((type) => (
                    <button
                      type="button"
                      key={type}
                      className="ga-button ga-button-light"
                      onClick={() => setSelectedPost({ blocks: [...selected.blocks, emptyBlock(type, selected.blocks.length)] })}
                    >
                      <Plus size={14} /> {blockLabels[type]}
                    </button>
                  ))}
                </div>
              </div>

              {selected.blocks.map((block, index) => (
                <div key={block.localId} className="blog-admin-block">
                  <div className="blog-admin-block-tools">
                    <GripVertical size={16} />
                    <select
                      className="ga-select"
                      value={block.type}
                      onChange={(event) => updateBlock(block.localId, { type: event.target.value as TenantBlogBlockType })}
                    >
                      {Object.entries(blockLabels).map(([type, label]) => (
                        <option key={type} value={type}>{label}</option>
                      ))}
                    </select>
                    <button type="button" className="ga-icon-button" onClick={() => moveBlock(block.localId, -1)} disabled={index === 0}>↑</button>
                    <button type="button" className="ga-icon-button" onClick={() => moveBlock(block.localId, 1)} disabled={index === selected.blocks.length - 1}>↓</button>
                    <button
                      type="button"
                      className="ga-icon-button"
                      aria-label="Elimina blocco"
                      onClick={() => setSelectedPost({ blocks: selected.blocks.filter((item) => item.localId !== block.localId) })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {block.type === "image" || block.type === "gallery" ? (
                    <div className="blog-admin-media">
                      <ImageUpload
                        tenantId={tenantId}
                        value={block.mediaUrls[0]}
                        onChange={(path) => updateBlock(block.localId, { mediaUrls: path ? [path] : [] })}
                      />
                      {block.mediaUrls[0] && (
                        <div className="blog-admin-thumb">
                          <Image src={block.mediaUrls[0]} alt="" fill className="object-cover" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      className="ga-textarea"
                      rows={block.type === "paragraph" ? 6 : 3}
                      placeholder={block.type === "embed" ? "URL embed o iframe" : "Contenuto"}
                      value={block.content}
                      onChange={(event) => updateBlock(block.localId, { content: event.target.value })}
                    />
                  )}

                  {(block.type === "image" || block.type === "gallery" || block.type === "quote") && (
                    <input
                      className="ga-input"
                      placeholder={block.type === "quote" ? "Autore citazione" : "Didascalia"}
                      value={block.caption ?? ""}
                      onChange={(event) => updateBlock(block.localId, { caption: event.target.value })}
                    />
                  )}
                </div>
              ))}
            </section>

            <section className="blog-admin-comments">
              <div className="ga-section-head">
                <h3 className="ga-section-title">Commenti</h3>
                <span className="ga-section-hint">Username + mail, senza registrazione</span>
              </div>
              {selected.comments.filter((comment) => !comment.deleted).length === 0 && (
                <div className="ga-empty">Nessun commento ricevuto.</div>
              )}
              {selected.comments.filter((comment) => !comment.deleted).map((comment) => (
                <div key={comment.id} className="blog-admin-comment" data-status={comment.status}>
                  <MessageSquare size={16} />
                  <div>
                    <strong>{comment.authorName}</strong>
                    <small>{comment.authorEmail} · {new Date(comment.createdAt).toLocaleString("it-IT")}</small>
                    <p>{comment.body}</p>
                  </div>
                  <div className="blog-admin-comment-actions">
                    <button type="button" className="ga-icon-button" aria-label="Approva" onClick={() => updateComment(comment.id, { status: "approved" })}>
                      <CheckCircle2 size={16} />
                    </button>
                    <button type="button" className="ga-icon-button" aria-label="Rifiuta" onClick={() => updateComment(comment.id, { status: "rejected" })}>
                      <XCircle size={16} />
                    </button>
                    <button type="button" className="ga-icon-button" aria-label="Elimina" onClick={() => deleteComment(comment.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            <div className="blog-admin-save">
              <button type="button" className="ga-button ga-button-primary" onClick={save} disabled={pending}>
                {pending ? <FileText size={16} /> : <Save size={16} />}
                {pending ? "Salvataggio..." : "Salva blog"}
              </button>
              {status && <span className="ga-section-hint">{status}</span>}
            </div>
          </article>
        )}

        {!selected && (
          <div className="ga-empty">
            <ImagePlus size={18} />
            Crea il primo articolo per iniziare.
          </div>
        )}
      </section>
    </div>
  );
}
