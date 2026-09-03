import {
  findSentNewsletterCampaignForArchive,
  listSentNewsletterCampaigns,
} from "@/services/newsletter";
import { withDataFallback } from "@/lib/resilient-data";

type PublicNewsletterArchiveResult = {
  available: boolean;
  campaigns: Awaited<ReturnType<typeof listSentNewsletterCampaigns>>;
};

type PublicNewsletterCampaignResult = {
  available: boolean;
  campaign: Awaited<ReturnType<typeof findSentNewsletterCampaignForArchive>>["campaign"];
  redirectTo: string | null;
};

export async function loadPublicNewsletterArchive(
  limit: number = 50
): Promise<PublicNewsletterArchiveResult> {
  const campaigns = await withDataFallback(
    "newsletter-archive.list",
    listSentNewsletterCampaigns(limit),
    null
  );

  if (!campaigns) {
    return {
      available: false,
      campaigns: [],
    };
  }

  return { available: true, campaigns };
}

export async function loadPublicNewsletterCampaign(
  id: string
): Promise<PublicNewsletterCampaignResult> {
  const result = await withDataFallback(
    `newsletter-archive.campaign.${id}`,
    findSentNewsletterCampaignForArchive(id),
    null
  );

  if (!result) {
    return {
      available: false,
      campaign: null,
      redirectTo: null,
    };
  }

  return {
    available: true,
    campaign: result.campaign,
    redirectTo:
      result.campaign && result.matchedByLegacyId
        ? `/newsletters/${result.campaign.publicSlug}`
        : null,
  };
}
