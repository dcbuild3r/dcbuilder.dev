import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, TWITTER_HANDLE } from "@/lib/site";

const SOCIAL_IMAGE_PATHS = new Set(["/", "/about", "/blog", "/candidates", "/jobs", "/news", "/portfolio"]);

interface PageMetadataInput {
	title: string;
	description?: string;
	path: string;
	type?: "website" | "article";
	publishedTime?: string;
	noindex?: boolean;
}

// Complete og/twitter objects on purpose: Next shallow-merges, so a partial object
// would inherit the root layout's og:title.
export function pageMetadata({
	title,
	description = SITE_DESCRIPTION,
	path,
	type = "website",
	publishedTime,
	noindex,
}: PageMetadataInput): Metadata {
	const url = `${SITE_URL}${path === "/" ? "" : path}`;
	const images = SOCIAL_IMAGE_PATHS.has(path) ? [`${url}/opengraph-image`] : undefined;
	return {
		title,
		description,
		alternates: { canonical: url },
		openGraph: {
			title,
			description,
			url,
			siteName: SITE_NAME,
			locale: "en_US",
			type,
			...(images ? { images } : {}),
			...(type === "article" && publishedTime ? { publishedTime } : {}),
		},
		twitter: { card: "summary_large_image", title, description, creator: TWITTER_HANDLE, ...(images ? { images } : {}) },
		...(noindex ? { robots: { index: false, follow: false } } : {}),
	};
}

const AUTHOR = { "@type": "Person", name: "dcbuilder", url: SITE_URL };

export function personJsonLd() {
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Person",
				"@id": `${SITE_URL}/#person`,
				name: "dcbuilder",
				alternateName: "dcbuilder.eth",
				url: SITE_URL,
				description: SITE_DESCRIPTION,
				sameAs: ["https://x.com/dcbuilder", "https://github.com/dcbuild3r"],
			},
			{ "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "dcbuilder.eth", url: SITE_URL, publisher: { "@id": `${SITE_URL}/#person` } },
		],
	};
}

export function blogPostingJsonLd(post: { slug: string; title: string; description?: string; date: string; updatedAt?: string; image?: string }) {
	const url = `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
	return {
		"@context": "https://schema.org",
		"@type": "BlogPosting",
		headline: post.title,
		...(post.description ? { description: post.description } : {}),
		datePublished: post.date,
		dateModified: post.updatedAt ?? post.date,
		image: [post.image || `${url}/opengraph-image`],
		author: AUTHOR,
		publisher: AUTHOR,
		mainEntityOfPage: { "@type": "WebPage", "@id": url },
		url,
	};
}

export interface JobPostingInput {
	id: string;
	title: string;
	company: string;
	description?: string | null;
	createdAt: Date | string;
	location?: string | null;
	remote?: string | null;
	type?: string | null;
	companyWebsite?: string | null;
}

const EMPLOYMENT: Record<string, string> = {
	"full-time": "FULL_TIME",
	"part-time": "PART_TIME",
	contract: "CONTRACTOR",
};

export function jobPostingJsonLd(job: JobPostingInput) {
	if (!job.description?.trim()) return null;
	const employmentType = EMPLOYMENT[job.type?.trim().toLowerCase() ?? ""];
	const remote = job.remote?.toLowerCase() === "remote";
	return {
		"@context": "https://schema.org",
		"@type": "JobPosting",
		title: job.title,
		description: job.description,
		datePosted: new Date(job.createdAt).toISOString(),
		hiringOrganization: {
			"@type": "Organization",
			name: job.company,
			...(job.companyWebsite ? { sameAs: job.companyWebsite } : {}),
		},
		...(job.location
			? { jobLocation: { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location } } }
			: {}),
		...(remote || !job.location ? { jobLocationType: "TELECOMMUTE" } : {}),
		...(employmentType ? { employmentType } : {}),
		directApply: false,
		url: `${SITE_URL}/jobs?job=${job.id}`,
	};
}

export function JsonLd({ data }: { data: object | null }) {
	if (!data) return null;
	return (
		<script
			type="application/ld+json"
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
		/>
	);
}

/** One-line plain-text summary for meta descriptions. */
export function summarize(text: string, max = 200) {
	const flat = text.replace(/\s+/g, " ").trim();
	return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

/** Explicit image for routes where the file convention would pick the parent's card. */
export function withImage(meta: Metadata, image: string): Metadata {
	return {
		...meta,
		openGraph: { ...meta.openGraph, images: [image] },
		twitter: { ...meta.twitter, images: [image] },
	};
}
