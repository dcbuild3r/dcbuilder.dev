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

export interface AIShareData {
	title: string;
	text: string;
	url?: string;
}

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

export function buildAIProviderPrompt(pageUrl: string, title: string): string {
	const markdownUrl = buildArticleMarkdownUrl(pageUrl);
	return `Read the Markdown source for "${title}" at ${markdownUrl}. Use it as context so I can ask questions about the article or build from its ideas.`;
}

export function buildAIProviderShareData(
	provider: "gemini" | "notebooklm",
	pageUrl: string,
	title: string,
): AIShareData {
	if (provider === "notebooklm") {
		return {
			title,
			text: "Add this article to NotebookLM as a website source.",
			url: pageUrl,
		};
	}

	return {
		title: `Ask Gemini about ${title}`,
		text: buildAIProviderPrompt(pageUrl, title),
	};
}

export function buildAIProviderUrl(provider: AIProvider, pageUrl: string, title: string): string {
	if (provider === "notebooklm") {
		return "https://notebooklm.google.com/";
	}

	const prompt = buildAIProviderPrompt(pageUrl, title);
	const encodedPrompt = encodeURIComponent(prompt);

	switch (provider) {
		case "chatgpt":
			return `https://chatgpt.com/?hints=search&q=${encodedPrompt}`;
		case "claude":
			return `https://claude.ai/new?q=${encodedPrompt}`;
		case "gemini":
			return "https://gemini.google.com/app";
		case "grok":
			return `https://x.com/i/grok?text=${encodedPrompt}`;
	}
}
