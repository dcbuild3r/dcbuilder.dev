import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CardList } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadPublicNewsletterArchive } from "@/lib/newsletter-archive";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Newsletter Archive",
  description:
    "Browse past newsletter issues from dcbuilder — news digests, job updates, and candidate highlights.",
  path: "/newsletters",
});

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  news: "News",
  jobs: "Jobs",
  candidates: "Candidates",
};

export default async function NewslettersPage() {
  const { available, campaigns } = await loadPublicNewsletterArchive();

  return (
    <div className="mx-auto max-w-[960px] px-6 pt-[72px] pb-24">
      <PageHeader
        eyebrow="Newsletter"
        title="Newsletter archive"
        lede="Browse past newsletter issues."
        aside={
          <Link
            href="/news"
            className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink"
          >
            &larr; Back to News
          </Link>
        }
      />

      {!available ? (
        <div className="rounded-2xl border border-warm bg-warm-soft px-5 py-6 text-sm text-warm">
          Newsletter archive is temporarily unavailable. This usually means the
          newsletter database schema has not been applied yet or the archive
          is offline.
        </div>
      ) : campaigns.length === 0 ? (
        <p className="py-12 text-center text-muted">
          No newsletters have been sent yet. Check back soon!
        </p>
      ) : (
        <CardList>
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/newsletters/${campaign.publicSlug}`}
              className="block px-5 py-5 transition-colors hover:bg-surface-2/60 sm:px-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-ink">
                    {campaign.subject}
                  </h2>
                  {campaign.previewText && (
                    <p className="mt-1 line-clamp-2 text-sm text-body">
                      {campaign.previewText}
                    </p>
                  )}
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-2">
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
                        year: "numeric",
                      })}
                    </time>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </CardList>
      )}
    </div>
  );
}
