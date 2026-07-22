import { describe, expect, test } from "bun:test";
import {
	buildAIProviderUrl,
	buildArticleMarkdown,
	buildArticleMarkdownUrl,
} from "../src/lib/article-ai-context";

describe("blog AI context actions", () => {
	test("builds a complete copyable Markdown document", () => {
		const markdown = buildArticleMarkdown({
			title: "A useful system",
			description: "Notes for people building one.",
			date: "2026-07-22",
			source: "Example",
			sourceUrl: "https://example.com/source",
			canonicalUrl: "https://dcbuilder.dev/blog/a-useful-system",
			content: "## Start here\n\nBuild the smallest useful version.",
		});
		expect(markdown).toContain("# A useful system");
		expect(markdown).toContain("Canonical URL: https://dcbuilder.dev/blog/a-useful-system");
		expect(markdown).toContain("## Start here");
	});

	test("uses a clean Markdown endpoint for assistant context", () => {
		expect(buildArticleMarkdownUrl("https://dcbuilder.dev/blog/a-useful-system?ref=home#intro")).toBe(
			"https://dcbuilder.dev/blog/a-useful-system/markdown",
		);
	});

	test("creates provider links including NotebookLM source import", () => {
		const pageUrl = "https://dcbuilder.dev/blog/a-useful-system";
		const notebookUrl = new URL(buildAIProviderUrl("notebooklm", pageUrl, "A useful system"));
		expect(notebookUrl.hostname).toBe("notebooklm.google.com");
		expect(notebookUrl.searchParams.get("addSource")).toBe("true");
		expect(notebookUrl.searchParams.get("url")).toBe(`${pageUrl}/markdown`);

		const expectedHosts = {
			chatgpt: "chatgpt.com",
			claude: "claude.ai",
			gemini: "gemini.google.com",
			grok: "x.com",
		} as const;
		for (const [provider, hostname] of Object.entries(expectedHosts)) {
			const providerUrl = new URL(
				buildAIProviderUrl(provider as keyof typeof expectedHosts, pageUrl, "A useful system"),
			);
			expect(providerUrl.hostname).toBe(hostname);
			expect(providerUrl.toString()).toContain(encodeURIComponent("/markdown"));
		}
	});
});
