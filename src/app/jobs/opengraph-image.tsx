import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og";

export const alt = "Jobs | dcbuilder.eth";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
	return renderOg({
		kind: "section",
		eyebrow: "Jobs",
		title: "Open roles",
		description: "Roles at portfolio companies and in the dcbuilder network.",
	});
}
