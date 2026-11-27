import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Portfolio | dcbuilder.eth";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
	return renderOg({
		kind: "section",
		title: "Portfolio",
		description: "Supporting teams building in programmable cryptography, distributed systems, digital identity, AI, scalability and privacy.",
	});
}
