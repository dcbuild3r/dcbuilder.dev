import fs from "node:fs/promises";
import path from "node:path";

type JobDescriptionContent = {
	description?: string;
	responsibilities?: string[];
	qualifications?: string[];
	benefits?: string[];
};

const sectionMatchers: Array<{
	key: keyof JobDescriptionContent;
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

const toAscii = (input: string) =>
	input
		.replace(/[\u2013\u2014]/g, "-")
		.replace(/[\u2018\u2019]/g, "'")
		.replace(/[\u201C\u201D]/g, '"')
		.replace(/[\u2022]/g, "-")
		.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");

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
	return toAscii(decodeEntities(text))
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
			.replace(/^[-*]+\\s+/g, "")
			.replace(/^\d+\\.\\s+/g, "")
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

const extractSections = (text: string): JobDescriptionContent => {
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

	let current: keyof JobDescriptionContent | "intro" = "intro";
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

const formatArray = (items: string[]) => {
	if (items.length === 0) return "[]";
	return `[\n${items
		.map((item) => `\t\t\t${JSON.stringify(item)},`)
		.join("\n")}\n\t\t]`;
};

const formatFields = (content: JobDescriptionContent) => {
	const fields: string[] = [];
	if (content.description) {
		fields.push(`\t\tdescription: ${JSON.stringify(content.description)},`);
	}
	if (content.responsibilities && content.responsibilities.length > 0) {
		fields.push(
			`\t\tresponsibilities: ${formatArray(content.responsibilities)},`,
		);
	}
	if (content.qualifications && content.qualifications.length > 0) {
		fields.push(
			`\t\tqualifications: ${formatArray(content.qualifications)},`,
		);
	}
	if (content.benefits && content.benefits.length > 0) {
		fields.push(`\t\tbenefits: ${formatArray(content.benefits)},`);
	}
	return fields.join("\n");
};

const shouldFill = (
	objectText: string,
	field: keyof JobDescriptionContent,
	data?: string | string[],
) => {
	if (!data || (Array.isArray(data) && data.length === 0)) return false;
	const regex = new RegExp(`\\b${field}\\s*:`);
	if (!regex.test(objectText)) return true;
	const emptyArrayRegex = new RegExp(`\\b${field}\\s*:\\s*\\[\\s*\\]`);
	return emptyArrayRegex.test(objectText);
};

const stripField = (objectText: string, field: keyof JobDescriptionContent) => {
	const stringValue = '"(?:\\\\.|[^"\\\\])*"';
	const inlineString = new RegExp(
		`\\n\\t\\t${field}:\\s*${stringValue},?`,
		"g",
	);
	const blockString = new RegExp(
		`\\n\\t\\t${field}:\\n\\t\\t\\t${stringValue},?`,
		"g",
	);
	const arrayBlock = new RegExp(
		`\\n\\t\\t${field}:\\s*\\[\\n[\\s\\S]*?\\n\\t\\t\\],?`,
		"g",
	);
	return objectText.replace(arrayBlock, "").replace(blockString, "").replace(inlineString, "");
};

const insertFields = (objectText: string, content: JobDescriptionContent) => {
	const fields = formatFields(content);
	if (!fields) return objectText;

	const insertAfterCandidates = ["salary", "tags", "featured", "link"];
	let insertPos = -1;
	for (const key of insertAfterCandidates) {
		const match = objectText.match(new RegExp(`\\b${key}\\s*:[^\\n]*`));
		if (match && match.index !== undefined) {
			const lineEnd = objectText.indexOf("\n", match.index);
			insertPos = lineEnd === -1 ? objectText.length : lineEnd + 1;
			break;
		}
	}

	if (insertPos === -1) return objectText;

	return (
		objectText.slice(0, insertPos) +
		fields +
		"\n" +
		objectText.slice(insertPos)
	);
};

const parseJobs = (content: string) => {
	const start = content.indexOf("export const jobs");
	if (start === -1) throw new Error("Jobs array not found");
	const assignment = content.indexOf("=", start);
	if (assignment === -1) throw new Error("Jobs array assignment not found");
	const arrayStart = content.indexOf("[", assignment);
	if (arrayStart === -1) throw new Error("Jobs array opening not found");

	let i = arrayStart + 1;
	let inString: string | null = null;
	let escape = false;
	let braceDepth = 0;
	let objectStart = -1;
	const blocks: Array<{ start: number; end: number; text: string }> = [];

	while (i < content.length) {
		const char = content[i];
		if (inString) {
			if (escape) {
				escape = false;
			} else if (char === "\\") {
				escape = true;
			} else if (char === inString) {
				inString = null;
			}
			i += 1;
			continue;
		}

		if (char === '"' || char === "'" || char === "`") {
			inString = char;
			i += 1;
			continue;
		}

		if (char === "{") {
			if (braceDepth === 0) {
				objectStart = i;
			}
			braceDepth += 1;
		} else if (char === "}") {
			braceDepth -= 1;
			if (braceDepth === 0 && objectStart !== -1) {
				const end = i + 1;
				blocks.push({
					start: objectStart,
					end,
					text: content.slice(objectStart, end),
				});
				objectStart = -1;
			}
		} else if (char === "]" && braceDepth === 0) {
			break;
		}
		i += 1;
	}

	return { blocks, arrayEnd: i };
};

const fetchJobContent = async (url: string) => {
	const parsed = new URL(url);
	if (!["http:", "https:"].includes(parsed.protocol)) {
		throw new Error("Unsupported protocol");
	}
	if (isBlockedHost(parsed.hostname)) {
		throw new Error("Blocked host");
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15000);

	try {
		const response = await fetch(url, {
			headers: {
				"user-agent":
					"Mozilla/5.0 (compatible; JobDescriptionFetcher/1.0; +https://dcbuilder.dev)",
			},
			signal: controller.signal,
		});
		if (!response.ok) throw new Error(`Failed to fetch (${response.status})`);
		const html = await response.text();
		const text = stripHtml(html);
		return extractSections(text);
	} finally {
		clearTimeout(timeout);
	}
};

const run = async () => {
	const filePath = path.resolve("src/data/jobs.ts");
	const content = await fs.readFile(filePath, "utf8");
	const { blocks } = parseJobs(content);
	console.log(`Found ${blocks.length} job blocks.`);

	const updates = new Map<number, string>();
	const queue: Array<{
		index: number;
		id: string;
		link: string;
		objectText: string;
	}> = [];

	for (const block of blocks) {
		const idMatch = block.text.match(/\bid:\s*"([^"]+)"/);
		const linkMatch = block.text.match(/\blink:\s*"([^"]+)"/);
		if (!idMatch || !linkMatch) continue;
		const id = idMatch[1];
		const link = linkMatch[1];
		queue.push({ index: block.start, id, link, objectText: block.text });
	}
	console.log(`Queued ${queue.length} jobs for fetch.`);

	const concurrency = 4;
	let cursor = 0;
	const results: Array<Promise<void>> = [];

	const worker = async () => {
		while (cursor < queue.length) {
			const current = queue[cursor];
			cursor += 1;
			try {
				const data = await fetchJobContent(current.link);
				const content: JobDescriptionContent = {};
				if (shouldFill(current.objectText, "description", data.description)) {
					content.description = data.description;
				}
				if (
					shouldFill(
						current.objectText,
						"responsibilities",
						data.responsibilities,
					)
				) {
					content.responsibilities = data.responsibilities;
				}
				if (
					shouldFill(
						current.objectText,
						"qualifications",
						data.qualifications,
					)
				) {
					content.qualifications = data.qualifications;
				}
				if (shouldFill(current.objectText, "benefits", data.benefits)) {
					content.benefits = data.benefits;
				}
				let updated = current.objectText;
				(
					Object.keys(content) as Array<keyof JobDescriptionContent>
				).forEach((field) => {
					updated = stripField(updated, field);
				});
				updated = insertFields(updated, content);
				updates.set(current.index, updated);
				console.log(`Updated ${current.id}`);
			} catch (error) {
				console.warn(
					`Failed to update ${current.id} (${current.link}):`,
					error instanceof Error ? error.message : error,
				);
			}
		}
	};

	for (let i = 0; i < concurrency; i += 1) {
		results.push(worker());
	}
	await Promise.all(results);

	if (updates.size === 0) {
		console.log("No updates needed.");
		return;
	}

	const sortedBlocks = [...updates.entries()].sort((a, b) => a[0] - b[0]);
	let nextIndex = 0;
	let output = "";

	for (const block of blocks) {
		const updated = updates.get(block.start);
		output += content.slice(nextIndex, block.start);
		output += updated ?? block.text;
		nextIndex = block.end;
	}
	output += content.slice(nextIndex);

	await fs.writeFile(filePath, output);
	console.log(`Wrote updates to ${filePath}`);
};

void run();
