import { withDataFallback } from "@/lib/resilient-data";
import { getPublicJobById, getJobTagsWithFallback } from "@/lib/data";
import { getJobCompanyLogo } from "@/lib/job-company-branding";
import { getJobTagLabel, normalizeJobTags } from "@/lib/job-tags";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg, type OgBadge } from "@/lib/og";
import { isNew } from "@/lib/shuffle";

export const alt = "Job";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [job, tagDefs] = await Promise.all([
		withDataFallback("jobs.og", getPublicJobById(id), null),
		getJobTagsWithFallback().catch(() => []),
	]);
	const labels = Object.fromEntries(tagDefs.map((t) => [t.slug, t.label]));
	const tags = normalizeJobTags(job?.tags);
	const badges: OgBadge[] = [];
	if (tags.includes("hot")) badges.push("Hot");
	if (job?.featured) badges.push("Featured");
	if (isNew(job?.createdAt)) badges.push("New");
	const company = job?.company ?? "";

	return renderOg({
		kind: "job",
		title: job?.title || "Job Opening",
		company,
		logoUrl: getJobCompanyLogo(company, job?.companyLogo),
		meta: [job?.location, job?.remote, job?.salary].filter((v): v is string => !!v),
		tags: tags.filter((t) => !["hot", "top", "new"].includes(t)).map((t) => getJobTagLabel(t, labels)),
		badges,
		affiliation: job?.category === "portfolio" ? "Portfolio" : "Network",
	});
}
