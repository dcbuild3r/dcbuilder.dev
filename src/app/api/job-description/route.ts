import { NextRequest, NextResponse } from "next/server";

type JobDescriptionResponse = {
	description?: string;
	responsibilities?: string[];
	qualifications?: string[];
	benefits?: string[];
};

type CacheEntry = {
	data: JobDescriptionResponse;
	expiresAt: number;
};

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const cache =
	(globalThis as { __jobDescriptionCache?: Map<string, CacheEntry> })
		.__jobDescriptionCache ?? new Map<string, CacheEntry>();
(globalThis as { __jobDescriptionCache?: Map<string, CacheEntry> }).__jobDescriptionCache =
	cache;

const sectionMatchers: Array<{
	key: keyof JobDescriptionResponse;
	patterns: RegExp[];
}> = [
	{
		key: "description",
		patterns: [
			/^about the role$/i,
			/^about the position$/i,
			/^job description$/i,
			/^role overview$/i,
			/^the role$/i,
		],
	},
	{
		key: "responsibilities",
		patterns: [
			/^responsibilities$/i,
			/^what you will do$/i,
			/^what you'll do$/i,
			/^what we are looking for$/i,
			/^key responsibilities$/i,
		],
	},
	{
		key: "qualifications",
		patterns: [
			/^qualifications$/i,
			/^requirements$/i,
			/^what we're looking for$/i,
			/^you are$/i,
			/^skills$/i,
		],
	},
	{
		key: "benefits",
		patterns: [
			/^benefits$/i,
			/^what we offer$/i,
			/^perks$/i,
			/^compensation$/i,
			/^why work here$/i,
		],
	},
];

const decodeEntities = (input: string) =>
	input
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

const stripHtml = (html: string) => {
	const withoutScripts = html
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ");
	const withBreaks = withoutScripts
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n")
		.replace(/<\/li>/gi, "\n")
		.replace(/<\/h[1-6]>/gi, "\n")
		.replace(/<li[^>]*>/gi, "- ");
	const text = withBreaks.replace(/<[^>]+>/g, " ");
	return decodeEntities(text)
		.replace(/[\u2013\u2014]/g, "-")
		.replace(/\r/g, "")
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.replace(/[ \t]{2,}/g, " ")
		.trim();
};

const normalizeHeading = (line: string) =>
	line
		.trim()
		.replace(/[:\-\u2013\u2014]+$/g, "")
		.replace(/\s{2,}/g, " ");

const matchSection = (line: string) => {
	const normalized = normalizeHeading(line);
	if (normalized.length > 80) return null;
	for (const matcher of sectionMatchers) {
		if (matcher.patterns.some((pattern) => pattern.test(normalized))) {
			return matcher.key;
		}
	}
	return null;
};

const normalizeList = (lines: string[]) => {
	const items: string[] = [];
	for (const line of lines) {
		const cleaned = line
			.replace(/^[-*\u2022]+\s+/g, "")
			.replace(/^\d+\.\s+/g, "")
			.trim();
		if (!cleaned) continue;
		if (cleaned.length > 140) {
			cleaned.split(/(?<=[.!?])\s+/).forEach((sentence) => {
				const trimmed = sentence.trim();
				if (trimmed.length > 3) items.push(trimmed);
			});
		} else if (cleaned.length > 3) {
			items.push(cleaned);
		}
	}
	return Array.from(new Set(items)).slice(0, 12);
};

const extractSections = (text: string): JobDescriptionResponse => {
	const lines = text
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	const buckets: Record<string, string[]> = {
		intro: [],
		description: [],
		responsibilities: [],
		qualifications: [],
		benefits: [],
	};

	let current: keyof JobDescriptionResponse | "intro" = "intro";
	for (const line of lines) {
		const section = matchSection(line);
		if (section) {
			current = section;
			continue;
		}
		buckets[current].push(line);
	}

	const descriptionLines =
		buckets.description.length > 0 ? buckets.description : buckets.intro;

	return {
		description: descriptionLines.join("\n").trim() || undefined,
		responsibilities: normalizeList(buckets.responsibilities),
		qualifications: normalizeList(buckets.qualifications),
		benefits: normalizeList(buckets.benefits),
	};
};

const isBlockedHost = (hostname: string) => {
	const lower = hostname.toLowerCase();
	if (lower === "localhost" || lower.endsWith(".local")) return true;
	if (/^127\./.test(lower)) return true;
	if (/^10\./.test(lower)) return true;
	if (/^192\.168\./.test(lower)) return true;
	if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
	return false;
};

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const target = searchParams.get("url");
	if (!target) {
		return NextResponse.json({ error: "Missing url" }, { status: 400 });
	}

	let parsed: URL;
	try {
		parsed = new URL(target);
	} catch {
		return NextResponse.json({ error: "Invalid url" }, { status: 400 });
	}

	if (!["http:", "https:"].includes(parsed.protocol)) {
		return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
	}

	if (isBlockedHost(parsed.hostname)) {
		return NextResponse.json({ error: "Blocked host" }, { status: 400 });
	}

	const cached = cache.get(target);
	if (cached && cached.expiresAt > Date.now()) {
		return NextResponse.json(cached.data);
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 12000);

	try {
		const response = await fetch(target, {
			headers: {
				"user-agent":
					"Mozilla/5.0 (compatible; JobDescriptionFetcher/1.0; +https://dcbuilder.dev)",
			},
			signal: controller.signal,
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch job description" },
				{ status: 502 },
			);
		}

		const html = await response.text();
		const text = stripHtml(html);
		const data = extractSections(text);

		cache.set(target, {
			data,
			expiresAt: Date.now() + CACHE_TTL_MS,
		});

		return NextResponse.json(data);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to fetch job description";
		return NextResponse.json({ error: message }, { status: 502 });
	} finally {
		clearTimeout(timeout);
	}
}
