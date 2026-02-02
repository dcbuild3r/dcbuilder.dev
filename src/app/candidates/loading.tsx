import { Navbar } from "@/components/Navbar";
import { CandidatesFiltersSkeleton, CandidateCardSkeleton } from "@/components/skeletons";

export default function CandidatesLoading() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto py-8 sm:py-12 space-y-6 sm:space-y-8">
          {/* Header - Static content */}
          <section className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Candidates</h1>
            <p className="max-w-2xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
              Talented builders looking for new opportunities.
              I&apos;ve personally vouched for each of these candidates.
            </p>
          </section>

          {/* How it works info box - Static content */}
          <div className="max-w-2xl mx-auto p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
            <h3 className="font-medium mb-2">How introductions work</h3>
            <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-2">
              <li>
                • <strong>Public profiles:</strong> Contact the candidate
                directly via their social links
              </li>
              <li className="flex items-start gap-1">
                <span>•</span>
                <span>
                  <strong>Anonymous profiles:</strong> Request an introduction
                  through me on{" "}
                  <a
                    href="https://t.me/dcbuilder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Telegram
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </a>
                </span>
              </li>
              <li className="flex items-start gap-1">
                <span>•</span>
                <span>
                  <strong className="text-green-600 dark:text-green-400">✓</strong>{" "}
                  = I personally know and vouch for this candidate
                </span>
              </li>
              <li className="flex items-start gap-1">
                <span>•</span>
                <span>
                  <strong className="text-amber-600 dark:text-amber-400">◇</strong>{" "}
                  = Referred candidate (not personally known, proceed with caution)
                </span>
              </li>
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
