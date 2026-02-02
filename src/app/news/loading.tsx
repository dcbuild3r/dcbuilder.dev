import { Navbar } from "@/components/Navbar";
import { NewsFiltersSkeleton, NewsItemSkeleton } from "@/components/skeletons";
import { NEWS_PAGE } from "@/data/page-content";

export default function NewsLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-8 sm:py-12">
          {/* Header - Static content */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{NEWS_PAGE.title}</h1>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {NEWS_PAGE.description}
            </p>
          </div>

          {/* News Grid - Dynamic content skeleton */}
          <div className="space-y-6">
            <NewsFiltersSkeleton />
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <NewsItemSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
