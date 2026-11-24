"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { AggregatedNewsItem } from "@/lib/news";
import { categoryLabels } from "@/data/news";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { renderInlineNewsMarkdown } from "@/components/news-inline-markdown";
import {
	getNewsDisplayCompany,
	getNewsDisplaySource,
	isFreshItem,
	isPortfolioUpdateItem,
} from "@/lib/news-filtering";
import { NewsThumb, getNormalizedLogoSrc } from "./NewsThumb";

const inlineLinkClass = "pointer-events-auto inline-flex rounded-sm";

interface NewsRowProps {
	item: AggregatedNewsItem;
	dateLabel: string;
	isDescriptionExpanded: boolean;
	onToggleDescription: (itemId: string) => void;
	onOpen: (item: AggregatedNewsItem) => void;
	failedImageKeys: Record<string, true>;
	markImageFailed: (key: string) => void;
	clicksLoaded: boolean;
	clickCount: number;
	isPopular: boolean;
}

function renderSourceTokens(value: string | undefined, keyPrefix: string): ReactNode {
	if (!value?.trim()) return null;
	return value
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
		.flatMap((token, idx) => [
			idx > 0 ? <span key={`${keyPrefix}:sep:${idx}`}> - </span> : null,
			<span key={`${keyPrefix}:${idx}`}>{token}</span>,
		]);
}

function PortfolioCompanyMeta({
	item,
	failedImageKeys,
	markImageFailed,
}: Pick<NewsRowProps, "item" | "failedImageKeys" | "markImageFailed">) {
	const company = item.portfolioCompany;
	if (!company) return null;

	const imageKey = `${item.id}:portfolio-company-meta`;
	const logoSrc = company.logo?.trim();
	const logo =
		logoSrc && !failedImageKeys[imageKey] ? (
			<Image
				src={getNormalizedLogoSrc(logoSrc)}
				alt={company.title}
				width={24}
				height={24}
				sizes="24px"
				className="h-full w-full object-contain"
				unoptimized
				onError={() => markImageFailed(imageKey)}
			/>
		) : null;
	const title = company.title?.trim();

	const wrap = (children: ReactNode, className: string, label: string) =>
		company.website ? (
			<a
				href={company.website}
				target="_blank"
				rel="noopener noreferrer"
				onClick={(event) => event.stopPropagation()}
				className={className}
				aria-label={`Open ${company.title}`}
				title={label}
			>
				{children}
			</a>
		) : (
			<span className={className} title={label}>
				{children}
			</span>
		);

	return (
		<>
			{logo && wrap(logo, cn(inlineLinkClass, "size-6 flex-shrink-0 items-center justify-center"), company.title)}
			{title && wrap(title, cn(inlineLinkClass, "font-semibold text-ink underline-offset-4 hover:underline"), company.title)}
		</>
	);
}

function HiringLink({ item }: { item: AggregatedNewsItem }) {
	const company = item.portfolioCompany;
	if (!company?.jobsUrl || company.jobCount <= 0) return null;

	return (
		<a
			href={company.jobsUrl}
			onClick={(event) => event.stopPropagation()}
			className="pointer-events-auto inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-inverse px-2.5 py-1 text-xs font-semibold leading-none text-inverse-ink"
			aria-label={`View ${company.jobCount} job openings at ${company.title}`}
		>
			Hiring
			<span className="rounded-full bg-inverse-ink px-1.5 py-0.5 text-[10px] font-bold leading-none text-inverse">
				{company.jobCount}
			</span>
		</a>
	);
}

export function NewsRow({
	item,
	dateLabel,
	isDescriptionExpanded,
	onToggleDescription,
	onOpen,
	failedImageKeys,
	markImageFailed,
	clicksLoaded,
	clickCount,
	isPopular,
}: NewsRowProps) {
	const isExternal = item.type !== "blog";
	const isPortfolioItem = isPortfolioUpdateItem(item);
	const displayCompany = getNewsDisplayCompany(item);

	return (
		<article className={cn(
				"group relative px-5 py-5 transition-colors hover:bg-surface-2/60 sm:px-6",
				isPortfolioItem && "bg-purple-50 dark:bg-purple-500/10",
			)}>
			<a
				href={item.url}
				target={isExternal ? "_blank" : undefined}
				rel={isExternal ? "noopener noreferrer" : undefined}
				onClick={() => onOpen(item)}
				className="absolute inset-0 z-0"
				aria-label={`Open ${item.title}`}
			>
				<span className="sr-only">Open {item.title}</span>
			</a>
			<div className="pointer-events-none relative z-10 flex flex-wrap items-start gap-x-5 gap-y-3">
				<div className="flex size-[68px] flex-shrink-0 items-center justify-center">
					<NewsThumb item={item} failedImageKeys={failedImageKeys} markImageFailed={markImageFailed} />
				</div>

				<div className="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
					<h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink group-hover:text-accent">
						<span>{item.title}</span>
						{isFreshItem(item.date, item.platform) && <Badge variant="outline">FRESH</Badge>}
						<HiringLink item={item} />
						{clicksLoaded && isPopular && <Badge variant="warm">POPULAR</Badge>}
					</h3>

					{item.description && (
						<p
							className={cn(
								"text-[14.5px] leading-relaxed text-body",
								isDescriptionExpanded ? "" : "line-clamp-3 sm:line-clamp-2",
							)}
						>
							{renderInlineNewsMarkdown(item.description)}
						</p>
					)}

					{item.description && (
						<button
							type="button"
							onClick={() => onToggleDescription(item.id)}
							className="pointer-events-auto -my-2 inline-flex min-h-11 items-center self-start text-xs font-medium text-body underline decoration-line-strong underline-offset-4 hover:text-ink sm:hidden"
							aria-expanded={isDescriptionExpanded}
						>
							{isDescriptionExpanded ? "Show less" : "Show more"}
						</button>
					)}

					<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[12.5px] text-muted">
						{renderSourceTokens(getNewsDisplaySource(item), `${item.id}:source`)}
						{displayCompany && (
							<span className={isPortfolioItem ? "font-semibold text-ink" : undefined}>{displayCompany}</span>
						)}
						<PortfolioCompanyMeta item={item} failedImageKeys={failedImageKeys} markImageFailed={markImageFailed} />
						{isPortfolioItem && (
							<span className="rounded-full bg-purple-500 px-2.5 py-0.5 font-semibold text-white">Portfolio</span>
						)}
						<span className="rounded-full bg-purple-100 px-2.5 py-0.5 font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
							{categoryLabels[item.category]}
						</span>
						{clicksLoaded && clickCount > 0 && <span>{clickCount} clicks</span>}
						{item.readingTime && <span>{item.readingTime}</span>}
					</div>
				</div>

				<time
					dateTime={item.date}
					className="flex-shrink-0 font-mono text-xs leading-7 text-muted"
				>
					{dateLabel}
					{isExternal && (
						<svg
							className="ml-1 inline size-3.5 align-[-2px]"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M7 17 17 7M8 7h9v9" />
						</svg>
					)}
				</time>
			</div>
		</article>
	);
}
