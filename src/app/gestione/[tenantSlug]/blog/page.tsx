import { notFound } from "next/navigation";
import { BlogManager } from "@/components/gestione/blog-manager";
import { getTenantById } from "@/lib/data/tenant";
import { getTenantBlogPosts } from "@/lib/tenant-blog";

export default async function GestioneBlogPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const tenant = await getTenantById(tenantSlug);
  if (!tenant || !tenant.features.blog) notFound();

  const posts = await getTenantBlogPosts(tenantSlug, { includeComments: true });
  return <BlogManager tenantId={tenantSlug} initialPosts={posts} />;
}
