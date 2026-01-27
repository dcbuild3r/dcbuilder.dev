import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

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

export function getAllPosts(): BlogPostMeta[] {
	if (!fs.existsSync(BLOG_DIR)) {
		return [];
	}

	const files = fs.readdirSync(BLOG_DIR);

	const posts = files
		.filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
		.map((file) => {
			const slug = file.replace(/\.mdx?$/, "");
			const filePath = path.join(BLOG_DIR, file);
			const fileContent = fs.readFileSync(filePath, "utf-8");
			const { data, content } = matter(fileContent);

			return {
				slug,
				title: data.title || slug,
				date: data.date || "",
				description: data.description || "",
				source: data.source,
				sourceUrl: data.sourceUrl,
				readingTime: calculateReadingTime(content),
			};
		})
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

	const fileContent = fs.readFileSync(filePath, "utf-8");
	const { data, content } = matter(fileContent);

	return {
		slug,
		title: data.title || slug,
		date: data.date || "",
		description: data.description || "",
		content,
		source: data.source,
		sourceUrl: data.sourceUrl,
		readingTime: calculateReadingTime(content),
	};
}

export function getAllSlugs(): string[] {
	if (!fs.existsSync(BLOG_DIR)) {
		return [];
	}

	const files = fs.readdirSync(BLOG_DIR);

	return files
		.filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
		.map((file) => file.replace(/\.mdx?$/, ""));
}
