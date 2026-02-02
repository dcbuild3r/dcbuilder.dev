import { Navbar } from "@/components/Navbar";
import { FiltersSkeleton, GridSkeleton } from "@/components/skeletons";

export default function PortfolioLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-[7.5vw]">
        <div className="max-w-6xl mx-auto py-8 sm:py-12">
          <div className="mb-8">
            <div className="h-10 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-2" />
          </div>
          <div className="space-y-6">
            <FiltersSkeleton />
            <GridSkeleton columns={3} rows={3} cardHeight="h-72" />
          </div>
        </div>
      </main>
    </>
  );
}
