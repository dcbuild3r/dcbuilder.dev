import Link from "next/link";
import { listSentNewsletterCampaigns } from "@/services/newsletter";

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

export async function NewsletterArchivePreview() {
  const campaigns = await listSentNewsletterCampaigns(3);

  if (campaigns.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 bg-neutral-50 dark:bg-neutral-900/40">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Newsletter Archive</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Recent newsletter issues.
          </p>
        </div>

        <Link
          href="/newsletters"
          className="group inline-flex items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-5 py-2.5 text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
        >
          View All
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/newsletters/${campaign.id}`}
            className="group flex items-start gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700/60 p-3 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/40 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                {campaign.subject}
              </span>
              {campaign.previewText && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                  {campaign.previewText}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
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
                  })}
                </time>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
