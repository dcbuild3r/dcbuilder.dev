import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { loadPublicNewsletterArchive } from "@/lib/newsletter-archive";

export const metadata = {
  title: "Newsletter Archive",
  description:
    "Browse past newsletter issues from dcbuilder — news digests, job updates, and candidate highlights.",
};

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  news: "News",
  jobs: "Jobs",
  candidates: "Candidates",
};

const TYPE_COLORS: Record<string, string> = {
  news: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  jobs: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  candidates: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
};

export default async function NewslettersPage() {
  const { available, campaigns } = await loadPublicNewsletterArchive();

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-8 sm:py-12">
          <div className="mb-6">
            <Link
              href="/news"
              className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              &larr; Back to News
            </Link>
          </div>

          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              Newsletter Archive
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Browse past newsletter issues.
            </p>
          </div>

          {!available ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
              Newsletter archive is temporarily unavailable. This usually means the
              newsletter database schema has not been applied yet or the archive
              is offline.
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-center text-neutral-500 py-12">
              No newsletters have been sent yet. Check back soon!
            </p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/newsletters/${campaign.publicSlug}`}
                  className="block rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 hover:border-neutral-400 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {campaign.subject}
                      </h2>
                      {campaign.previewText && (
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                          {campaign.previewText}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          TYPE_COLORS[campaign.newsletterType] ?? TYPE_COLORS.news
                        }`}
                      >
                        {TYPE_LABELS[campaign.newsletterType] ?? campaign.newsletterType}
                      </span>
                      {campaign.sentAt && (
                        <time
                          dateTime={campaign.sentAt.toISOString()}
                          className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap"
                        >
                          {campaign.sentAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </time>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
