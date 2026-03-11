import { Navbar } from "@/components/Navbar";

export default function NewsletterViewLoading() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-8 sm:py-12">
          <div className="mb-6">
            <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          </div>

          <div className="mb-6 space-y-3">
            <div className="h-8 w-2/3 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-neutral-100 dark:bg-neutral-800/60 rounded animate-pulse" />
          </div>

          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white min-h-[400px] animate-pulse" />
        </div>
      </main>
    </>
  );
}
