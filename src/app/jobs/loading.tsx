import { Navbar } from "@/components/Navbar";
import { JobsFiltersSkeleton, ListSkeleton } from "@/components/skeletons";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import { JOBS_PAGE } from "@/data/page-content";

export default function JobsLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-8 sm:py-12 space-y-6 sm:space-y-8">
          {/* Header - Static content */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl font-bold">{JOBS_PAGE.title}</h1>
            <p className="max-w-2xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
              {JOBS_PAGE.description}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {JOBS_PAGE.helpText}{" "}
              <a
                href={JOBS_PAGE.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Telegram
                <TelegramIcon className="w-3.5 h-3.5" />
              </a>
            </p>
          </section>

          {/* Jobs Grid - Dynamic content skeleton */}
          <div className="space-y-6">
            <JobsFiltersSkeleton />
            <ListSkeleton count={6} />
          </div>
        </div>
      </main>
    </>
  );
}
