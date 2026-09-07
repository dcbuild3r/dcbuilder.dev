import {
  findSentNewsletterCampaignForArchive,
  listSentNewsletterCampaigns,
} from "@/services/newsletter";
import { cachePublicData } from "@/lib/public-cache";

type PublicNewsletterArchiveResult = {
  available: boolean;
  campaigns: Awaited<ReturnType<typeof listSentNewsletterCampaigns>>;
};

type PublicNewsletterCampaignResult = {
  available: boolean;
  campaign: Awaited<ReturnType<typeof findSentNewsletterCampaignForArchive>>["campaign"];
  redirectTo: string | null;
};

function logArchiveFailure(operation: string, error: unknown) {
  console.error(`[newsletter-archive] ${operation} failed`, error);
}

async function loadPublicNewsletterArchiveUncached(
  limit: number = 50
): Promise<PublicNewsletterArchiveResult> {
  try {
    return {
      available: true,
      campaigns: await listSentNewsletterCampaigns(limit),
    };
  } catch (error) {
    logArchiveFailure("list archive campaigns", error);
    return {
      available: false,
      campaigns: [],
    };
  }
}

export const loadPublicNewsletterArchive = cachePublicData(
  ["newsletter-archive"],
  loadPublicNewsletterArchiveUncached,
  ["newsletter"],
);

async function loadPublicNewsletterCampaignUncached(
  id: string
): Promise<PublicNewsletterCampaignResult> {
  try {
    const result = await findSentNewsletterCampaignForArchive(id);

    return {
      available: true,
      campaign: result.campaign,
      redirectTo:
        result.campaign && result.matchedByLegacyId
          ? `/newsletters/${result.campaign.publicSlug}`
          : null,
    };
  } catch (error) {
    logArchiveFailure(`load archive campaign ${id}`, error);
    return {
      available: false,
      campaign: null,
      redirectTo: null,
    };
  }
}

export const loadPublicNewsletterCampaign = cachePublicData(
  ["newsletter-campaign"],
  loadPublicNewsletterCampaignUncached,
  ["newsletter"],
);
