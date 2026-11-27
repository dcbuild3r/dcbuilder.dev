import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { load } from "cheerio";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

describe("candidate opengraph image", () => {
	const pngHeader = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
	function mockProfileImage() {
		return spyOn(globalThis, "fetch").mockResolvedValue(
			new Response(pngHeader, { headers: { "Content-Type": "image/png" } })
		);
	}

	afterEach(() => {
		mock.restore();
	});

	test("masks square candidate profile images directly as circles", async () => {
		mockProfileImage();
		mock.module("next/og", () => ({
			ImageResponse: function ImageResponse(element: unknown, options: unknown) {
				return { element, options };
			},
		}));

		mock.module("@/lib/data", () => ({
			getCandidateById: async () => ({
				id: "square-image-candidate",
				name: "Square Image Candidate",
				title: "Protocol Engineer",
				skills: ["Rust", "TypeScript"],
				image: "https://example.com/square-profile.png",
				availability: "looking",
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			}),
		}));

		const { default: CandidateOpenGraphImage } = await import(
			`../src/app/candidates/[id]/opengraph-image?candidate-og-image=${Date.now()}`
		);
		const response = await CandidateOpenGraphImage({
			params: Promise.resolve({ id: "square-image-candidate" }),
		});

		const markup = renderToStaticMarkup((response as unknown as { element: ReactElement }).element);
		const image = load(markup)('img[alt="Square Image Candidate"]');
		expect(image).toHaveLength(1);
		expect(image.attr("style")).toContain("border-radius:84px");
		expect(image.attr("style")).toContain("object-fit:cover");
		expect(image.attr("width")).toBe("168");
		expect(image.attr("height")).toBe("168");
		expect(markup).toContain("Candidate · Actively Looking");
	});

	test("renders Atakan's custom image when the database is unavailable", async () => {
		const fetchImage = mockProfileImage();
		mock.module("next/og", () => ({
			ImageResponse: function ImageResponse(element: unknown, options: unknown) {
				return { element, options };
			},
		}));

		mock.module("@/lib/data", () => ({
			getCandidateById: async () => {
				throw new Error("database unavailable");
			},
		}));

		const { default: CandidateOpenGraphImage } = await import(
			`../src/app/candidates/[id]/opengraph-image?candidate-og-fallback=${Date.now()}`
		);
		const response = await CandidateOpenGraphImage({
			params: Promise.resolve({ id: "atakan-yavuzarslan" }),
		});
		const markup = renderToStaticMarkup((response as unknown as { element: ReactElement }).element);
		const $ = load(markup);
		expect($("body").text()).toContain("Atakan Yavuzarslan");
		expect($("body").text()).toContain("Web3 & AI Partnerships / BD Director");
		expect($('img[alt="Atakan Yavuzarslan"]').attr("src")).toStartWith("data:image/png;base64,");
		expect(fetchImage).toHaveBeenCalledWith(
			"https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/images/695070cb-069a-46f0-aa0d-d34c94cb50bd.png",
			expect.any(Object)
		);
	});
});
