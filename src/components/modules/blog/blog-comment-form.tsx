"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function BlogCommentForm({
  tenantId,
  postId,
}: {
  tenantId: string;
  postId: string;
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus(null);
    const res = await fetch(`/api/tenant/${tenantId}/blog/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, username, email, comment }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setStatus(data.error ?? "Commento non inviato.");
      return;
    }
    setUsername("");
    setEmail("");
    setComment("");
    setStatus("Commento inviato. Sara' visibile dopo moderazione.");
  }

  return (
    <form className="tenant-blog-comment-form" onSubmit={submit}>
      <div>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={80} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={180} />
        </label>
      </div>
      <label>
        Commento
        <textarea value={comment} onChange={(event) => setComment(event.target.value)} required maxLength={2000} rows={4} />
      </label>
      <button type="submit" disabled={pending}>
        <Send size={16} />
        {pending ? "Invio..." : "Commenta"}
      </button>
      {status && <p>{status}</p>}
    </form>
  );
}
