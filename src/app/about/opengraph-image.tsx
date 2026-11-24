import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "About dcbuilder.eth";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
	return renderOg({
		kind: "section",
		eyebrow: "About",
		title: "About dcbuilder",
		description: "Research, engineering, and angel investing in cryptography, distributed systems, and AI.",
	});
}
