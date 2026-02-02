import { Navbar } from "@/components/Navbar";
import { CandidatesFiltersSkeleton, CandidateCardSkeleton } from "@/components/skeletons";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import { CANDIDATES_PAGE } from "@/data/page-content";

export default function CandidatesLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto py-8 sm:py-12 space-y-6 sm:space-y-8">
          {/* Header - Static content */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl font-bold">{CANDIDATES_PAGE.title}</h1>
            <p className="max-w-2xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
              {CANDIDATES_PAGE.description}
            </p>
          </section>

          {/* How it works info box - Static content */}
          <div className="max-w-2xl mx-auto p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <h3 className="font-medium mb-2">{CANDIDATES_PAGE.howItWorks.title}</h3>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
              {CANDIDATES_PAGE.howItWorks.items.map((item, index) => (
                <li key={index} className={item.type === "public" ? "" : "flex items-start gap-1"}>
                  {item.type === "public" && (
                    <>• <strong>{item.label}</strong> {item.text}</>
                  )}
                  {item.type === "anonymous" && (
                    <>
                      <span>•</span>
                      <span>
                        <strong>{item.label}</strong> {item.text}{" "}
                        <a
                          href={item.telegramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Telegram
                          <TelegramIcon className="w-3.5 h-3.5" />
                        </a>
                      </span>
                    </>
                  )}
                  {(item.type === "vouched" || item.type === "referred") && (
                    <>
                      <span>•</span>
                      <span>
                        <strong className={item.symbolClass}>{item.symbol}</strong>{" "}
                        {item.text}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Candidates Grid - Dynamic content skeleton */}
          <div className="space-y-6">
            <CandidatesFiltersSkeleton />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <CandidateCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
