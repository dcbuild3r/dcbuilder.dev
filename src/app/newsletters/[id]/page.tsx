import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { NewsletterIframe } from "@/components/NewsletterIframe";
import { getSentNewsletterCampaignForArchive } from "@/services/newsletter";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const campaign = await getSentNewsletterCampaignForArchive(id);

  if (!campaign) {
    return { title: "Newsletter Not Found" };
  }

  return {
    title: campaign.subject,
    description: campaign.previewText ?? `Newsletter: ${campaign.subject}`,
  };
}

export default async function NewsletterViewPage({ params }: Props) {
  const { id } = await params;
  const campaign = await getSentNewsletterCampaignForArchive(id);

  if (!campaign) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto py-8 sm:py-12">
          <div className="mb-6">
            <Link
              href="/newsletters"
              className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
            >
              &larr; All Newsletters
            </Link>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {campaign.subject}
            </h1>
            {campaign.sentAt && (
              <time
                dateTime={campaign.sentAt.toISOString()}
                className="text-sm text-neutral-500 dark:text-neutral-400"
              >
                {campaign.sentAt.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white">
            <NewsletterIframe html={campaign.renderedHtml!} />
          </div>
        </div>
      </main>
    </>
  );
}
