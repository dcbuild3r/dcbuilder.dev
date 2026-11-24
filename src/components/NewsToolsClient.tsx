"use client";

import Link from "next/link";
import { useState } from "react";
import { OTHER_CONTENT_I_LIKE, getRecommendedLinks } from "@/lib/recommendations";
import { getNewsToolsRecommendationSummary } from "@/lib/news-tools";
import { Badge } from "@/components/ui/badge";
import { Card, CardList } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ChevronDownIcon } from "@/components/ui/icons";

type ArchiveCampaignPreview = {
	id: string;
	publicSlug: string;
	subject: string;
	previewText: string | null;
	newsletterType: string;
	sentAt: string | null;
};

type NewsToolsClientProps = {
	campaigns: ArchiveCampaignPreview[];
	archiveAvailable?: boolean;
};

const TYPE_LABELS: Record<string, string> = {
	news: "News",
	portfolio: "Portfolio",
	jobs: "Jobs",
	candidates: "Candidates",
};

function formatShortDate(value: string | null) {
	if (!value) return null;

	return new Date(value).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	});
}

function ArchivePanel({
	campaigns,
	archiveAvailable,
}: {
	campaigns: ArchiveCampaignPreview[];
	archiveAvailable: boolean;
}) {
	if (!archiveAvailable) {
		return (
			<div className="rounded-2xl border border-dashed border-warm bg-warm-soft px-4 py-5 text-sm text-warm">
				Newsletter archive is temporarily unavailable. The rest of the news page
				still works, but newsletter history is offline until the newsletter
				database is available again.
			</div>
		);
	}

	if (campaigns.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-5 text-sm text-muted">
				No newsletter issues yet.
			</div>
		);
	}

	return (
		<CardList>
			{campaigns.map((campaign) => (
				<Link
					key={campaign.id}
					href={`/newsletters/${campaign.publicSlug}`}
					className="flex min-h-11 items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2/60"
				>
					<div className="min-w-0">
						<p className="line-clamp-1 text-sm font-semibold text-ink">{campaign.subject}</p>
						{campaign.previewText && (
							<p className="mt-1 line-clamp-1 text-xs text-muted">{campaign.previewText}</p>
						)}
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Badge variant="neutral">
							{TYPE_LABELS[campaign.newsletterType] ?? campaign.newsletterType}
						</Badge>
						{campaign.sentAt && (
							<span className="font-mono text-xs text-muted">{formatShortDate(campaign.sentAt)}</span>
						)}
					</div>
				</Link>
			))}
			<Link
				href="/newsletters"
				className="flex min-h-11 items-center justify-between px-4 py-3 text-sm font-medium text-accent hover:bg-surface-2/60"
			>
				Browse full archive
				<span aria-hidden="true">/</span>
			</Link>
		</CardList>
	);
}

const isExternalUrl = (url: string) => url.startsWith("http");

function RecommendationLink({
	item,
}: {
	item: { name: string; url: string; description?: string };
}) {
	const external = isExternalUrl(item.url);
	return (
		<a
			href={item.url}
			target={external ? "_blank" : undefined}
			rel={external ? "noopener noreferrer" : undefined}
			className="block rounded-2xl border border-line bg-surface px-3.5 py-3 transition-colors hover:border-line-strong"
		>
			<p className="text-sm font-semibold text-ink">{item.name}</p>
			{item.description && (
				<p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{item.description}</p>
			)}
		</a>
	);
}

function RecommendationsPanel() {
	const [showFullList, setShowFullList] = useState(false);
	const recommendationSummary = getNewsToolsRecommendationSummary();
	const remainingRecommendations = getRecommendedLinks().filter(
		(link) => !recommendationSummary.highlights.some((highlight) => highlight.name === link.name),
	);

	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)]">
			<div>
				<Eyebrow className="mb-3">Recommendations</Eyebrow>
				<div className="grid gap-2 sm:grid-cols-2">
					{recommendationSummary.highlights.map((item) => (
						<RecommendationLink key={item.name} item={item} />
					))}
				</div>

				<button
					type="button"
					onClick={() => setShowFullList((current) => !current)}
					aria-expanded={showFullList}
					className="mt-3 inline-flex min-h-11 items-center rounded-full border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2"
				>
					{showFullList ? "Hide full list" : `Show ${recommendationSummary.hiddenCount} more`}
				</button>

				{showFullList && (
					<div className="mt-3 grid gap-2 sm:grid-cols-2">
						{remainingRecommendations.map((item) => (
							<RecommendationLink key={item.name} item={{ name: item.name, url: item.url }} />
						))}
					</div>
				)}
			</div>

			<div>
				<Eyebrow className="mb-3">Other content I like</Eyebrow>
				<div className="space-y-2">
					{OTHER_CONTENT_I_LIKE.map((item) => (
						<RecommendationLink key={item.name} item={item} />
					))}
				</div>
			</div>
		</div>
	);
}

/** Secondary section on /news: past newsletter issues and recommendations behind one disclosure. */
export function NewsToolsClient({ campaigns, archiveAvailable = true }: NewsToolsClientProps) {
	return (
		<Card className="mt-12">
			<details className="group">
				<summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
					<span className="text-base font-semibold text-ink">Past issues and recommendations</span>
					<ChevronDownIcon className="size-5 text-muted transition-transform group-open:rotate-180" />
				</summary>
				<div className="space-y-8 border-t border-line px-5 py-6">
					<section aria-label="Past newsletter issues">
						<Eyebrow className="mb-3">Latest issues</Eyebrow>
						<ArchivePanel campaigns={campaigns} archiveAvailable={archiveAvailable} />
					</section>
					<RecommendationsPanel />
				</div>
			</details>
		</Card>
	);
}
