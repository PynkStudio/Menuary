import { notFound } from "next/navigation";
import { requirePynkstudioTenant } from "@/components/tenants/pynkstudio/resolve-tenant";
import { PynkSolutionPage } from "@/components/tenants/pynkstudio/pages/ai-solution";
import { getPynkSolution, pynkSolutions } from "@/components/tenants/pynkstudio/pynk-solutions";
import { pynkMetadata } from "@/components/tenants/pynkstudio/pynk-seo";

type Props = {
  params: Promise<{ solutionSlug: string }>;
};

export function generateStaticParams() {
  return pynkSolutions.map((solution) => ({ solutionSlug: solution.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { solutionSlug } = await params;
  const solution = getPynkSolution(solutionSlug);
  if (!solution) return {};
  return pynkMetadata({
    title: solution.metaTitle,
    description: solution.metaDescription,
    path: `/soluzioni/${solution.slug}`,
    keywords: [solution.h1, "AI per aziende", "intelligenza artificiale", "AI Act"],
  });
}

export default async function SolutionRoute({ params }: Props) {
  await requirePynkstudioTenant();
  const { solutionSlug } = await params;
  if (!getPynkSolution(solutionSlug)) notFound();
  return <PynkSolutionPage slug={solutionSlug} />;
}
