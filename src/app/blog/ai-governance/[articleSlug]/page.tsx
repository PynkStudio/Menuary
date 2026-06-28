import { notFound } from "next/navigation";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkAiGovernanceArticlePage } from "@/components/tenants/pynkstudio/pages/ai-governance-article";
import { getGovernanceArticle, governanceBlogArticles } from "@/components/tenants/pynkstudio/ai-governance-data";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

type Props = {
  params: Promise<{ articleSlug: string }>;
};

export function generateStaticParams() {
  return governanceBlogArticles.map((article) => ({ articleSlug: article.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { articleSlug } = await params;
  const article = getGovernanceArticle(articleSlug);
  if (!article) return {};
  return pynkMetadata({
    title: `${article.title} | Guida tecnica AI — PYNK STUDIO`,
    description: article.description,
    path: `/blog/ai-governance/${article.slug}`,
    keywords: [...article.topics, "intelligenza artificiale", "AI aziende", "guida tecnica"],
    type: "article",
  });
}

export default async function AiGovernanceArticleRoute({ params }: Props) {
  await requirePynkstudioTenant();
  const { articleSlug } = await params;
  if (!getGovernanceArticle(articleSlug)) notFound();
  return <PynkAiGovernanceArticlePage slug={articleSlug} />;
}
