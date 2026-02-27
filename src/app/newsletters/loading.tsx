import { Navbar } from "@/components/Navbar";

export default function NewslettersLoading() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-8 sm:py-12">
          <div className="text-center mb-8 sm:mb-12">
            <div className="h-9 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-lg mx-auto mb-4 animate-pulse" />
            <div className="h-5 w-48 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto animate-pulse" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 animate-pulse"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
                    <div className="h-4 w-1/2 bg-neutral-100 dark:bg-neutral-800/60 rounded" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-5 w-14 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                    <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-800/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
