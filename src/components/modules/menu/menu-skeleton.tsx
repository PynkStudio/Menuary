import { cn } from "@/lib/utils";

function CardSkeleton({ hasImage }: { hasImage: boolean }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-pork-ink/5">
      {hasImage && (
        <div className="aspect-[4/3] animate-pulse bg-pork-ink/10" />
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="animate-pulse space-y-2">
            <div className="h-5 w-36 rounded-full bg-pork-ink/10" />
            <div className="h-5 w-24 rounded-full bg-pork-ink/8" />
          </div>
          {!hasImage && (
            <div className="h-8 w-16 animate-pulse rounded-full bg-pork-mustard/30" />
          )}
        </div>
        <div className="animate-pulse space-y-1.5 pt-1">
          <div className="h-3.5 w-full rounded-full bg-pork-ink/8" />
          <div className="h-3.5 w-4/5 rounded-full bg-pork-ink/8" />
        </div>
        <div className="mt-auto flex gap-1.5 pt-2">
          <div className="h-5 w-12 animate-pulse rounded-full bg-pork-ink/8" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-pork-ink/8" />
        </div>
      </div>
    </div>
  );
}

function CategorySkeleton({ hasImages, cardCount }: { hasImages: boolean; cardCount: number }) {
  return (
    <section>
      <header className="mb-8 flex flex-col gap-2 border-b-2 border-pork-ink/10 pb-4">
        <div className="h-3 w-20 animate-pulse rounded-full bg-pork-red/20" />
        <div className="h-10 w-56 animate-pulse rounded-2xl bg-pork-ink/10 sm:h-12 lg:h-14" />
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, i) => (
          <CardSkeleton key={i} hasImage={hasImages} />
        ))}
      </div>
    </section>
  );
}

export function MenuSkeleton({ hasGlobalHeader = true }: { hasGlobalHeader?: boolean }) {
  return (
    <>
      {/* nav bar skeleton — stessa posizione sticky della MenuCategoryNav */}
      <div
        className={cn(
          "sticky z-30 -mx-5 border-y border-pork-ink/10 bg-pork-cream/95 backdrop-blur-lg sm:-mx-8 lg:-mx-12",
          hasGlobalHeader
            ? "top-[calc(4.75rem+env(safe-area-inset-top))] md:top-[calc(5.5rem+env(safe-area-inset-top))]"
            : "top-0",
        )}
      >
        <div className="container-wide">
          <div className="flex gap-2 py-4 md:py-5">
            {[72, 88, 64, 96, 80].map((w, i) => (
              <div
                key={i}
                className="h-9 animate-pulse shrink-0 rounded-full bg-pork-ink/10 sm:h-8"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-pork-cream pb-[max(8rem,calc(6rem+env(safe-area-inset-bottom)))] pt-10">
        <div className="container-wide space-y-20">
          <CategorySkeleton hasImages cardCount={3} />
          <CategorySkeleton hasImages={false} cardCount={6} />
          <CategorySkeleton hasImages cardCount={3} />
        </div>
      </div>
    </>
  );
}
