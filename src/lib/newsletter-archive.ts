import {
  getSentNewsletterCampaignForArchive,
  listSentNewsletterCampaigns,
} from "@/services/newsletter";

type PublicNewsletterArchiveResult = {
  available: boolean;
  campaigns: Awaited<ReturnType<typeof listSentNewsletterCampaigns>>;
};

type PublicNewsletterCampaignResult = {
  available: boolean;
  campaign: Awaited<ReturnType<typeof getSentNewsletterCampaignForArchive>>;
};

function logArchiveFailure(operation: string, error: unknown) {
  console.error(`[newsletter-archive] ${operation} failed`, error);
}

export async function loadPublicNewsletterArchive(
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

export async function loadPublicNewsletterCampaign(
  id: string
): Promise<PublicNewsletterCampaignResult> {
  try {
    return {
      available: true,
      campaign: await getSentNewsletterCampaignForArchive(id),
    };
  } catch (error) {
    logArchiveFailure(`load archive campaign ${id}`, error);
    return {
      available: false,
      campaign: null,
    };
  }
}
