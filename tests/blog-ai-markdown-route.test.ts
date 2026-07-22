import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/blog", () => ({
	getPostBySlug: async (slug: string) =>
		slug === "published"
			? {
					slug,
					title: "Published article",
					description: "Useful context.",
					date: "2026-07-22",
					content: "## Build it\n\nStart with the interface.",
				}
			: null,
}));

const { GET } = await import("../src/app/blog/[slug]/markdown/route");

describe("blog Markdown endpoint", () => {
	test("returns a published article as fetchable Markdown", async () => {
		const response = await GET(new Request("https://dcbuilder.dev/blog/published/markdown"), {
			params: Promise.resolve({ slug: "published" }),
		});
		const markdown = await response.text();
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
		expect(response.headers.get("x-robots-tag")).toBe("noindex");
		expect(markdown).toContain("# Published article");
		expect(markdown).toContain("Canonical URL: https://dcbuilder.dev/blog/published");
	});

	test("does not expose missing or unpublished articles", async () => {
		const response = await GET(new Request("https://dcbuilder.dev/blog/missing/markdown"), {
			params: Promise.resolve({ slug: "missing" }),
		});
		expect(response.status).toBe(404);
	});
});
