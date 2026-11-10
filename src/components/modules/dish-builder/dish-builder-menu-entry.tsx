"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTenant } from "@/components/core/tenant-provider";
import { useEffectiveFeatures } from "@/lib/use-effective-features";
import { getTenantDishRecipes } from "@/lib/dish-builder/tenant-recipes";
import { dishText, resolveDishCopy } from "@/lib/dish-builder/i18n";
import styles from "./dish-builder.module.css";

/** Ingresso dal menu verso «Componi il piatto»: compare solo con il modulo attivo e almeno una ricetta. */
export function DishBuilderMenuEntry({ locale = "it" }: { locale?: string }) {
  const tenant = useTenant();
  const { modules } = useEffectiveFeatures();
  const pathname = usePathname();
  const recipes = getTenantDishRecipes(tenant.id);
  if (!modules.dishBuilder || recipes.length === 0) return null;
  const prefix =
    tenant.previewSlug && pathname?.startsWith(`/${tenant.previewSlug}`) ? `/${tenant.previewSlug}` : "";
  const copy = resolveDishCopy(locale);

  return (
    <section className={styles.entry} data-dish-entry data-part="entry" aria-label={dishText(recipes[0].title, locale)}>
      {recipes.map((recipe) => (
        <Link key={recipe.id} href={`${prefix}/componi?piatto=${recipe.id}`} className={styles.entryCard} data-part="entry-card">
          {recipe.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={recipe.coverImage} alt="" className={styles.entryImage} data-part="entry-image" />
          ) : null}
          <span className={styles.entryText}>
            <span className={styles.entryKicker} data-part="entry-kicker">
              {copy.menuEntryKicker}
            </span>
            <span className={styles.entryTitle} data-part="entry-title">
              {dishText(recipe.title, locale)}
            </span>
            {recipe.subtitle ? (
              <span className={styles.entrySubtitle} data-part="entry-subtitle">
                {dishText(recipe.subtitle, locale)}
              </span>
            ) : null}
          </span>
          <span className={styles.entryCta} data-part="entry-cta">
            {copy.menuEntryCta} →
          </span>
        </Link>
      ))}
    </section>
  );
}
