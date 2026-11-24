import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Candidates | dcbuilder.eth";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
	return renderOg({
		kind: "section",
		eyebrow: "Candidates",
		title: "Talent network",
		description: "Engineers and researchers looking for their next role.",
	});
}
