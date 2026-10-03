import { BlogManager } from "@/components/gestione/blog-manager";
import { getTenantBlogPosts } from "@/lib/tenant-blog";
import { requireGestioneSection } from "@/lib/gestione-page";

export default async function GestioneBlogPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  await requireGestioneSection(tenantSlug, "blog");
  const posts = await getTenantBlogPosts(tenantSlug, { includeComments: true });
  return <BlogManager tenantId={tenantSlug} initialPosts={posts} />;
}
