import { describe, expect, test } from "bun:test";
import {
	buildAIProviderPrompt,
	buildAIProviderShareData,
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

	test("uses supported provider links and avoids undocumented Google query parameters", () => {
		const pageUrl = "https://dcbuilder.dev/blog/a-useful-system";
		const notebookUrl = new URL(buildAIProviderUrl("notebooklm", pageUrl, "A useful system"));
		expect(notebookUrl.hostname).toBe("notebooklm.google.com");
		expect(notebookUrl.search).toBe("");

		const geminiUrl = new URL(buildAIProviderUrl("gemini", pageUrl, "A useful system"));
		expect(geminiUrl.hostname).toBe("gemini.google.com");
		expect(geminiUrl.search).toBe("");

		const expectedHosts = {
			chatgpt: "chatgpt.com",
			claude: "claude.ai",
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

	test("builds clipboard and mobile share handoffs for Google apps", () => {
		const pageUrl = "https://dcbuilder.dev/blog/a-useful-system";
		const prompt = buildAIProviderPrompt(pageUrl, "A useful system");
		expect(prompt).toContain(`${pageUrl}/markdown`);

		expect(buildAIProviderShareData("gemini", pageUrl, "A useful system")).toEqual({
			title: "Ask Gemini about A useful system",
			text: prompt,
		});
		expect(buildAIProviderShareData("notebooklm", pageUrl, "A useful system")).toEqual({
			title: "A useful system",
			text: "Add this article to NotebookLM as a website source.",
			url: pageUrl,
		});
	});
});
