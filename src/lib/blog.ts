import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");
const FALLBACK_DATE = "1970-01-01";
const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface BlogPost {
	slug: string;
	title: string;
	date: string;
	description: string;
	content: string;
	source?: string;
	sourceUrl?: string;
	readingTime: number;
}

export interface BlogPostMeta {
	slug: string;
	title: string;
	date: string;
	description: string;
	source?: string;
	sourceUrl?: string;
	readingTime: number;
}

function calculateReadingTime(content: string): number {
	const wordsPerMinute = 200;
	const words = content.trim().split(/\s+/).length;
	return Math.ceil(words / wordsPerMinute);
}

function normalizeDate(dateString: string): string {
	return DATE_ONLY_RE.test(dateString) ? `${dateString}T00:00:00.000Z` : dateString;
}

function parseDate(dateString: string | undefined, context: string): string {
	if (!dateString) {
		console.warn(`[blog.ts] ${context}: Missing date in frontmatter`);
		return FALLBACK_DATE;
	}
	const parsed = new Date(normalizeDate(dateString));
	if (isNaN(parsed.getTime())) {
		console.warn(`[blog.ts] ${context}: Invalid date format "${dateString}"`);
		return FALLBACK_DATE;
	}
	return dateString;
}

function getDateValue(dateString: string): number {
	const parsed = new Date(normalizeDate(dateString));
	return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function formatBlogDate(dateString: string): string {
	if (dateString === FALLBACK_DATE) {
		return "Unknown date";
	}
	const parsed = new Date(normalizeDate(dateString));
	if (isNaN(parsed.getTime())) {
		return "Unknown date";
	}
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	}).format(parsed);
}

export function getAllPosts(): BlogPostMeta[] {
	if (!fs.existsSync(BLOG_DIR)) {
		console.warn(
			`[blog.ts] Blog directory not found at ${BLOG_DIR}. ` +
				`Expected location: ${path.resolve(BLOG_DIR)}. ` +
				`Current working directory: ${process.cwd()}`
		);
		return [];
	}

	const files = fs.readdirSync(BLOG_DIR);

	const posts = files
		.filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
		.map((file) => {
			const slug = file.replace(/\.mdx?$/, "");
			const filePath = path.join(BLOG_DIR, file);

			try {
				const fileContent = fs.readFileSync(filePath, "utf-8");
				const { data, content } = matter(fileContent);

				const post: BlogPostMeta = {
					slug,
					title: data.title || slug,
					date: parseDate(data.date, `Post "${slug}"`),
					description: data.description || "",
					source: data.source,
					sourceUrl: data.sourceUrl,
					readingTime: calculateReadingTime(content),
				};
				return post;
			} catch (error) {
				console.error(`[blog.ts] Failed to read post "${slug}":`, {
					filePath,
					error: error instanceof Error ? error.message : String(error),
				});
				return null;
			}
		})
		.filter((post): post is BlogPostMeta => post !== null)
		.sort((a, b) => getDateValue(b.date) - getDateValue(a.date));

	return posts;
}

export function getPostBySlug(slug: string): BlogPost | null {
	const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
	const mdPath = path.join(BLOG_DIR, `${slug}.md`);

	let filePath: string;
	if (fs.existsSync(mdxPath)) {
		filePath = mdxPath;
	} else if (fs.existsSync(mdPath)) {
		filePath = mdPath;
	} else {
		return null;
	}

	try {
		const fileContent = fs.readFileSync(filePath, "utf-8");
		const { data, content } = matter(fileContent);

		return {
			slug,
			title: data.title || slug,
			date: parseDate(data.date, `Post "${slug}"`),
			description: data.description || "",
			content,
			source: data.source,
			sourceUrl: data.sourceUrl,
			readingTime: calculateReadingTime(content),
		};
	} catch (error) {
		console.error(`[blog.ts] Failed to read post "${slug}":`, {
			filePath,
			error: error instanceof Error ? error.message : String(error),
		});
		return null;
	}
}

export function getAllSlugs(): string[] {
	if (!fs.existsSync(BLOG_DIR)) {
		console.warn(
			`[blog.ts] Blog directory not found at ${BLOG_DIR}. ` +
				`Expected location: ${path.resolve(BLOG_DIR)}. ` +
				`Current working directory: ${process.cwd()}`
		);
		return [];
	}

	const files = fs.readdirSync(BLOG_DIR);

	return files
		.filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
		.map((file) => file.replace(/\.mdx?$/, ""));
}
