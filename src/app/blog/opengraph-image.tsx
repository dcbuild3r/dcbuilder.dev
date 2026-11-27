import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Blog | dcbuilder.eth";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
	return renderOg({
		kind: "section",
		label: "Blog",
		title: "Writing",
		description: "Essays and notes on cryptography, distributed systems, digital identity, and AI.",
	});
}
