import { Navbar } from "@/components/Navbar";
import { ListSkeleton } from "@/components/skeletons";

export default function NewsLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-[7.5vw]">
        <div className="max-w-4xl mx-auto py-8 sm:py-12">
          <div className="mb-8">
            <div className="h-10 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse mb-2" />
            <div className="h-5 w-64 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>
          <ListSkeleton count={8} />
        </div>
      </main>
    </>
  );
}
