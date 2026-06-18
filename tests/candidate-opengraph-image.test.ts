import { afterEach, describe, expect, mock, test } from "bun:test";

type ElementLike = {
	type?: unknown;
	props?: {
		alt?: unknown;
		children?: unknown;
		style?: Record<string, unknown>;
	};
};

function isElementLike(value: unknown): value is ElementLike {
	return typeof value === "object" && value !== null && "props" in value;
}

function findImageByAlt(node: unknown, alt: string): ElementLike | null {
	if (!isElementLike(node)) return null;

	if (node.type === "img" && node.props?.alt === alt) {
		return node;
	}

	const children = node.props?.children;
	if (Array.isArray(children)) {
		for (const child of children) {
			const match = findImageByAlt(child, alt);
			if (match) return match;
		}
		return null;
	}

	return findImageByAlt(children, alt);
}

describe("candidate opengraph image", () => {
	afterEach(() => {
		mock.restore();
	});

	test("masks square candidate profile images directly as circles", async () => {
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
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
			}),
		}));

		const { default: CandidateOpenGraphImage } = await import(
			`../src/app/candidates/[id]/opengraph-image?candidate-og-image=${Date.now()}`
		);
		const response = await CandidateOpenGraphImage({
			params: Promise.resolve({ id: "square-image-candidate" }),
		});

		const candidateImage = findImageByAlt(
			(response as { element: unknown }).element,
			"Square Image Candidate"
		);

		expect(candidateImage).not.toBeNull();
		expect(candidateImage?.props?.style).toMatchObject({
			width: 240,
			height: 240,
			borderRadius: 120,
			objectFit: "cover",
		});
	});
});
