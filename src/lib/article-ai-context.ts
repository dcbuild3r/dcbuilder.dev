export interface ArticleMarkdownInput {
	title: string;
	description?: string;
	date: string;
	source?: string;
	sourceUrl?: string;
	canonicalUrl: string;
	content: string;
}

export type AIProvider = "chatgpt" | "claude" | "gemini" | "grok" | "notebooklm";

export function buildArticleMarkdown(article: ArticleMarkdownInput): string {
	const metadata = [
		`Published: ${article.date}`,
		`Canonical URL: ${article.canonicalUrl}`,
		article.source
			? `Source: ${article.source}${article.sourceUrl ? ` (${article.sourceUrl})` : ""}`
			: null,
	].filter(Boolean);

	return [
		`# ${article.title}`,
		article.description ? `> ${article.description}` : null,
		metadata.join("\n"),
		"---",
		article.content.trim(),
	]
		.filter(Boolean)
		.join("\n\n")
		.concat("\n");
}

export function buildArticleMarkdownUrl(pageUrl: string): string {
	const url = new URL(pageUrl);
	url.search = "";
	url.hash = "";
	url.pathname = `${url.pathname.replace(/\/$/, "")}/markdown`;
	return url.toString();
}

export function buildAIProviderUrl(provider: AIProvider, pageUrl: string, title: string): string {
	const markdownUrl = buildArticleMarkdownUrl(pageUrl);

	if (provider === "notebooklm") {
		const url = new URL("https://notebooklm.google.com/");
		url.searchParams.set("addSource", "true");
		url.searchParams.set("url", markdownUrl);
		return url.toString();
	}

	const prompt = `Read the Markdown source for "${title}" at ${markdownUrl}. Use it as context so I can ask questions about the article or build from its ideas.`;
	const encodedPrompt = encodeURIComponent(prompt);

	switch (provider) {
		case "chatgpt":
			return `https://chatgpt.com/?hints=search&q=${encodedPrompt}`;
		case "claude":
			return `https://claude.ai/new?q=${encodedPrompt}`;
		case "gemini":
			return `https://gemini.google.com/app?q=${encodedPrompt}`;
		case "grok":
			return `https://x.com/i/grok?text=${encodedPrompt}`;
	}
}
