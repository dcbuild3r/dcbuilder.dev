import { listSentNewsletterCampaigns } from "@/services/newsletter";
import { NewsToolsClient } from "@/components/NewsToolsClient";

export async function NewsTools() {
  const campaigns = await listSentNewsletterCampaigns(4);

  return (
    <NewsToolsClient
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
