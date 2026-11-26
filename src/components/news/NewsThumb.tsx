"use client";

import Image from "next/image";
import type { AggregatedNewsItem } from "@/lib/news";
import { DCBUILDER_X_HANDLE } from "@/lib/news-filtering";
import { DocumentIcon, LinkIcon, XIcon } from "@/components/ui/icons";

const THUMB_SIZE = 68;
const THUMB_REQUEST_SIZE = "136px";
const THUMB_QUALITY = 90;
const BLOG_IMAGE_CACHE_VERSION = "20260206";
const MONAD_TWITTER_LOGO_URL = "https://pbs.twimg.com/profile_images/1945153889881243648/CehOdEnT_400x400.jpg";
const MONAD_LOGO_SRC = "/logos/monad.png";
const GOOGLE_RESEARCH_LOGO_SRC = "/logos/google-research.jpg";
const CUSTOM_X_LOGO_HANDLES = new Set(["googleresearch"]);
const DCBUILDER_AVATAR_SRC = "/logos/dcbuilder.jpg";

export function getNormalizedLogoSrc(src: string): string {
	return src.trim() === MONAD_TWITTER_LOGO_URL ? MONAD_LOGO_SRC : src.trim();
}

function hasCustomXLogo(handle?: string | null): boolean {
	const normalizedHandle = handle?.trim().toLowerCase();
	return Boolean(normalizedHandle && CUSTOM_X_LOGO_HANDLES.has(normalizedHandle));
}

function getXAvatarClassName(handle?: string | null): string {
	return hasCustomXLogo(handle)
		? "size-[68px] object-contain"
		: "size-[68px] rounded-full border border-line object-cover";
}

function getXAvatarSrc(handle: string): string {
	const normalized = handle.trim().toLowerCase();
	if (normalized === "googleresearch") return GOOGLE_RESEARCH_LOGO_SRC;
	if (normalized === DCBUILDER_X_HANDLE) return DCBUILDER_AVATAR_SRC;
	return `https://unavatar.io/twitter/${handle}`;
}

function normalizeImageUrlForComparison(src?: string | null): string {
	return (src ?? "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
}

function getXHandle(url: string): string | null {
	const match = url.match(/x\.com\/([^/]+)/);
	return match ? match[1] : null;
}

function getBlogImageUrl(rawUrl: string): string {
	const url = rawUrl.trim();
	if (!url.includes(".r2.dev/blog/images/")) return url;
	return `${url}${url.includes("?") ? "&" : "?"}v=${BLOG_IMAGE_CACHE_VERSION}`;
}

function XBadge() {
	return (
		<span className="absolute -bottom-1 -right-1 flex size-[18px] items-center justify-center rounded-full border-2 border-surface bg-inverse text-inverse-ink">
			<XIcon className="size-2.5" />
		</span>
	);
}

function IconTile({ children }: { children: React.ReactNode }) {
	return (
		<span className="flex size-[68px] items-center justify-center rounded-full border border-line bg-surface-2 text-muted">
			{children}
		</span>
	);
}

function AnnouncementIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
			<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z" />
			<path d="M16 8.5a5 5 0 0 1 0 7" />
		</svg>
	);
}

interface NewsThumbProps {
	item: AggregatedNewsItem;
	failedImageKeys: Record<string, true>;
	markImageFailed: (key: string) => void;
}

/** Leading avatar/thumbnail for a news row, chosen from the item's type and source. */
export function NewsThumb({ item, failedImageKeys, markImageFailed }: NewsThumbProps) {
	const imageProps = {
		width: THUMB_SIZE,
		height: THUMB_SIZE,
		sizes: THUMB_REQUEST_SIZE,
		quality: THUMB_QUALITY,
	};
	const isXPost = item.url.includes("x.com/");
	const company = item.portfolioCompany;
	const useCompanyPrimaryIcon = !isXPost || company?.sourceIsCompanyAccount !== false;

	if (useCompanyPrimaryIcon && company?.logo?.trim()) {
		const imageKey = `${item.id}:portfolio-primary`;
		if (!failedImageKeys[imageKey]) {
			return (
				<div className="relative flex size-[68px] items-center justify-center">
					<Image
						src={getNormalizedLogoSrc(company.logo)}
						alt={company.title}
						{...imageProps}
						className="h-full w-full object-contain rounded-sm dark:bg-logo-backdrop"
						unoptimized
						onError={() => markImageFailed(imageKey)}
					/>
					{isXPost && <XBadge />}
				</div>
			);
		}
	}

	if (isXPost) {
		const imageKey = `${item.id}:x`;
		const sourceImage = item.sourceImage?.trim();
		const xHandle = getXHandle(item.url);
		const showXLogo = !hasCustomXLogo(xHandle);
		const sourceImageMatchesCompanyLogo =
			company?.sourceIsCompanyAccount === false &&
			normalizeImageUrlForComparison(sourceImage) === normalizeImageUrlForComparison(company.logo);
		const src =
			sourceImage && !sourceImageMatchesCompanyLogo
				? sourceImage
				: xHandle
					? getXAvatarSrc(xHandle)
					: null;

		if (src && !failedImageKeys[imageKey]) {
			return (
				<div className="relative">
					<Image
						src={src}
						alt={sourceImage && !sourceImageMatchesCompanyLogo ? item.source || "X source" : xHandle ?? "X source"}
						{...imageProps}
						className={getXAvatarClassName(xHandle)}
						onError={() => markImageFailed(imageKey)}
					/>
					{showXLogo && <XBadge />}
				</div>
			);
		}
		return <IconTile><XIcon className="size-5" /></IconTile>;
	}

	switch (item.type) {
		case "blog": {
			const imageKey = `${item.id}:blog`;
			if (item.image?.trim() && !failedImageKeys[imageKey]) {
				return (
					<Image
						src={getBlogImageUrl(item.image)}
						alt={item.title}
						{...imageProps}
						className="size-[68px] rounded-full border border-line object-cover"
						onError={() => markImageFailed(imageKey)}
					/>
				);
			}
			return <IconTile><DocumentIcon className="size-5" /></IconTile>;
		}
		case "curated": {
			const imageKey = `${item.id}:curated`;
			if (item.sourceImage?.trim() && !failedImageKeys[imageKey]) {
				return (
					<Image
						src={item.sourceImage.trim()}
						alt={item.source || item.title}
						{...imageProps}
						className="size-[68px] rounded-full border border-line object-cover"
						onError={() => markImageFailed(imageKey)}
					/>
				);
			}
			return <IconTile><LinkIcon className="size-5" /></IconTile>;
		}
		case "announcement": {
			const imageKey = `${item.id}:announcement`;
			if (item.companyLogo?.trim() && !failedImageKeys[imageKey]) {
				return (
					<Image
						src={getNormalizedLogoSrc(item.companyLogo)}
						alt={item.company || "Company"}
						{...imageProps}
						unoptimized
						className="size-[68px] rounded-lg object-contain dark:bg-logo-backdrop"
						onError={() => markImageFailed(imageKey)}
					/>
				);
			}
			return <IconTile><AnnouncementIcon className="size-5" /></IconTile>;
		}
		default:
			return null;
	}
}
