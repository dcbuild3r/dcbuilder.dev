import { loadPublicNewsletterArchive } from "@/lib/newsletter-archive";
import { NewsToolsClient } from "@/components/NewsToolsClient";

export async function NewsTools() {
  const { available, campaigns } = await loadPublicNewsletterArchive(4);

  return (
    <NewsToolsClient
      archiveAvailable={available}
      campaigns={campaigns.map((campaign) => ({
        id: campaign.id,
        subject: campaign.subject,
        previewText: campaign.previewText ?? null,
        newsletterType: campaign.newsletterType,
        sentAt: campaign.sentAt ? campaign.sentAt.toISOString() : null,
      }))}
    />
  );
}
