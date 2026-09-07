import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { compile } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import { getMermaidSource } from "../src/components/MDXComponents";

describe("blog Markdown rendering", () => {
	test("compiles GFM pipe tables as semantic tables", async () => {
		const result = await compile(
			"| Component | Job |\n|---|---|\n| Matrix | Archive |",
			{ remarkPlugins: [remarkGfm] }
		);

		expect(String(result)).toContain("_components.table");
		expect(String(result)).toContain("_components.thead");
		expect(String(result)).toContain("_components.tbody");
	});

	test("recognizes Mermaid fenced-code output", () => {
		const mermaidCode = createElement(
			"code",
			{ className: "language-mermaid" },
			"flowchart LR\n  source --> archive\n"
		);

		expect(getMermaidSource(mermaidCode)).toBe(
			"flowchart LR\n  source --> archive"
		);
	});

	test("leaves ordinary code blocks unchanged", () => {
		const typescriptCode = createElement(
			"code",
			{ className: "language-typescript" },
			"const ready = true;"
		);

		expect(getMermaidSource(typescriptCode)).toBeNull();
	});
});
