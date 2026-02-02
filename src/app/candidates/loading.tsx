import { Navbar } from "@/components/Navbar";
import { FiltersSkeleton, GridSkeleton } from "@/components/skeletons";

export default function CandidatesLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-[7.5vw]">
        <div className="max-w-6xl mx-auto py-8 sm:py-12">
          <div className="mb-8">
            <div className="h-10 w-56 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-80 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
          <div className="space-y-6">
            <FiltersSkeleton />
            <GridSkeleton columns={3} rows={2} cardHeight="h-80" />
          </div>
        </div>
      </main>
    </>
  );
}
