import { Navbar } from "@/components/Navbar";
import { GridSkeleton } from "@/components/skeletons";

export default function BlogLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-[7.5vw]">
        <div className="max-w-4xl mx-auto py-8 sm:py-12">
          <div className="mb-8">
            <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-2" />
          </div>
          <GridSkeleton columns={2} rows={2} cardHeight="h-48" />
        </div>
      </main>
    </>
  );
}
