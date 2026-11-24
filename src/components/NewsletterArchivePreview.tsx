import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/Button";
import { loadPublicNewsletterArchive } from "@/lib/newsletter-archive";

const TYPE_LABELS: Record<string, string> = {
  news: "News",
  jobs: "Jobs",
  candidates: "Candidates",
};

export async function NewsletterArchivePreview() {
  const { available, campaigns } = await loadPublicNewsletterArchive(3);

  if (!available) {
    return null;
  }

  if (campaigns.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-ink">Newsletter Archive</h2>
          <p className="mt-2 text-sm text-body">
            Recent newsletter issues.
          </p>
        </div>

        <Link
          href="/newsletters"
          className={buttonClass({ variant: "secondary" })}
        >
          View All
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/newsletters/${campaign.publicSlug}`}
            className="group flex items-start gap-3 rounded-2xl border border-line p-3 transition-colors hover:border-line-strong hover:bg-surface-2/60"
          >
            <div className="min-w-0 flex-1">
              <span className="text-sm font-semibold text-ink">
                {campaign.subject}
              </span>
              {campaign.previewText && (
                <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                  {campaign.previewText}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="neutral">
                {TYPE_LABELS[campaign.newsletterType] ?? campaign.newsletterType}
              </Badge>
              {campaign.sentAt && (
                <time
                  dateTime={campaign.sentAt.toISOString()}
                  className="whitespace-nowrap font-mono text-xs text-muted"
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
