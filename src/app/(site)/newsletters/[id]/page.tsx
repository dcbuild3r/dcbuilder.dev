import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import { NewsletterIframe } from "@/components/NewsletterIframe";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { loadPublicNewsletterCampaign } from "@/lib/newsletter-archive";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const { available, campaign, redirectTo } = await loadPublicNewsletterCampaign(id);

  if (!available) {
    return { title: "Newsletter Archive Unavailable" };
  }

  if (redirectTo) {
    permanentRedirect(redirectTo);
  }

  if (!campaign) {
    return { title: "Newsletter Not Found" };
  }

  return pageMetadata({
    title: campaign.subject,
    description: campaign.previewText ?? `Newsletter: ${campaign.subject}`,
    path: `/newsletters/${id}`,
  });
}

export default async function NewsletterViewPage({ params }: Props) {
  const { id } = await params;
  const { available, campaign, redirectTo } = await loadPublicNewsletterCampaign(id);

  if (!available) {
    return (
      <div className="mx-auto max-w-[960px] px-6 pt-[72px] pb-24">
        <div className="mb-6">
          <Link
              href="/newsletters"
              className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink"
            >
              &larr; All Newsletters
            </Link>
        </div>
        <div className="rounded-2xl border border-warm bg-warm-soft px-5 py-6 text-sm text-warm">
          Newsletter archive is temporarily unavailable. Try again after the
          newsletter database is available again.
        </div>
      </div>
    );
  }

  if (redirectTo) {
    permanentRedirect(redirectTo);
  }

  if (!campaign) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-[960px] px-6 pt-[72px] pb-24">
      <div className="mb-6">
        <Link
              href="/newsletters"
              className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink"
            >
              &larr; All Newsletters
            </Link>
      </div>

      <PageHeader
        eyebrow="Newsletter"
        title={campaign.subject}
        lede={
          campaign.sentAt && (
            <time dateTime={campaign.sentAt.toISOString()} className="font-mono text-sm text-muted">
              {campaign.sentAt.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          )
        }
      />

      <Card className="overflow-hidden bg-white">
        <NewsletterIframe html={campaign.renderedHtml!} />
      </Card>
    </div>
  );
}
