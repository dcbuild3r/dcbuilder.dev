import {
  findSentNewsletterCampaignForArchive,
  listSentNewsletterCampaigns,
} from "@/services/newsletter";

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
