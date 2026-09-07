import {
  findSentNewsletterCampaignForArchive,
  listSentNewsletterCampaigns,
} from '@/services/newsletter';
import { cachePublicData } from '@/lib/public-cache';
import { withDataFallback } from '@/lib/resilient-data';

type PublicNewsletterArchiveResult = {
  available: boolean;
  campaigns: Awaited<ReturnType<typeof listSentNewsletterCampaigns>>;
};

type PublicNewsletterCampaign = PublicNewsletterArchiveResult['campaigns'][number];
type CachedNewsletterCampaign = Omit<PublicNewsletterCampaign, 'sentAt' | 'archiveCorrectedAt'> & {
  sentAt: string | null;
  archiveCorrectedAt: string | null;
};
type CachedNewsletterArchiveResult = {
  available: boolean;
  campaigns: CachedNewsletterCampaign[];
};

type PublicNewsletterCampaignResult = {
  available: boolean;
  campaign: Awaited<ReturnType<typeof findSentNewsletterCampaignForArchive>>['campaign'];
  redirectTo: string | null;
};

type PublicNewsletterCampaignDetail = NonNullable<PublicNewsletterCampaignResult['campaign']>;
type CachedNewsletterCampaignDetail = Omit<
  PublicNewsletterCampaignDetail,
  'sentAt' | 'archiveCorrectedAt'
> & {
  sentAt: string | null;
  archiveCorrectedAt: string | null;
};
type CachedNewsletterCampaignResult = {
  available: boolean;
  campaign: CachedNewsletterCampaignDetail | null;
  redirectTo: string | null;
};

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function hydrateDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function serializeCampaign(campaign: PublicNewsletterCampaign): CachedNewsletterCampaign {
  return {
    ...campaign,
    sentAt: serializeDate(campaign.sentAt),
    archiveCorrectedAt: serializeDate(campaign.archiveCorrectedAt),
  };
}

function hydrateCampaign(campaign: CachedNewsletterCampaign): PublicNewsletterCampaign {
  return {
    ...campaign,
    sentAt: hydrateDate(campaign.sentAt),
    archiveCorrectedAt: hydrateDate(campaign.archiveCorrectedAt),
  };
}

function serializeCampaignDetail(
  campaign: PublicNewsletterCampaignDetail
): CachedNewsletterCampaignDetail {
  return {
    ...campaign,
    sentAt: serializeDate(campaign.sentAt),
    archiveCorrectedAt: serializeDate(campaign.archiveCorrectedAt),
  };
}

function hydrateCampaignDetail(
  campaign: CachedNewsletterCampaignDetail
): PublicNewsletterCampaignDetail {
  return {
    ...campaign,
    sentAt: hydrateDate(campaign.sentAt),
    archiveCorrectedAt: hydrateDate(campaign.archiveCorrectedAt),
  };
}

async function loadPublicNewsletterArchiveUncached(
  limit: number = 50
): Promise<PublicNewsletterArchiveResult> {
  const campaigns = await withDataFallback(
    'newsletter-archive.list',
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

const loadPublicNewsletterArchiveCached = cachePublicData(
  ['newsletter-archive'],
  async (limit: number = 50): Promise<CachedNewsletterArchiveResult> => {
    const result = await loadPublicNewsletterArchiveUncached(limit);
    return {
      available: result.available,
      campaigns: result.campaigns.map(serializeCampaign),
    };
  },
  ['newsletter']
);

export async function loadPublicNewsletterArchive(
  limit: number = 50
): Promise<PublicNewsletterArchiveResult> {
  if (process.env.NODE_ENV === 'test') {
    return loadPublicNewsletterArchiveUncached(limit);
  }

  const result = await loadPublicNewsletterArchiveCached(limit);
  return {
    available: result.available,
    campaigns: result.campaigns.map(hydrateCampaign),
  };
}

async function loadPublicNewsletterCampaignUncached(
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

const loadPublicNewsletterCampaignCached = cachePublicData(
  ['newsletter-campaign'],
  async (id: string): Promise<CachedNewsletterCampaignResult> => {
    const result = await loadPublicNewsletterCampaignUncached(id);
    return {
      available: result.available,
      campaign: result.campaign ? serializeCampaignDetail(result.campaign) : null,
      redirectTo: result.redirectTo,
    };
  },
  ['newsletter']
);

export async function loadPublicNewsletterCampaign(
  id: string
): Promise<PublicNewsletterCampaignResult> {
  if (process.env.NODE_ENV === 'test') {
    return loadPublicNewsletterCampaignUncached(id);
  }

  const result = await loadPublicNewsletterCampaignCached(id);
  return {
    available: result.available,
    campaign: result.campaign ? hydrateCampaignDetail(result.campaign) : null,
    redirectTo: result.redirectTo,
  };
}
