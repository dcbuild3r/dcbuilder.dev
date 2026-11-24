import { BlogArticleSkeleton } from "@/components/skeletons";
import { BLOG_PAGE } from "@/data/page-content";

export default function BlogLoading() {
  return (
    <>
      <div className="pt-10 sm:pt-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto py-8 sm:py-12">
          {/* Header - Static content */}
          <h1 className="text-4xl font-bold mb-8">{BLOG_PAGE.title}</h1>

          {/* Blog posts - Dynamic content skeleton */}
          <div className="space-y-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <BlogArticleSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
