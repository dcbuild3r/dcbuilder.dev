const canonicalCompanyLogos: Record<string, string> = {
	succinct: "/logos/succinct.png",
};

/** Prefer canonical local brand assets over stale job-record logo URLs. */
export function getJobCompanyLogo(
	companyName: string,
	storedLogo?: string | null,
): string | undefined {
	return canonicalCompanyLogos[companyName.trim().toLowerCase()] ?? (storedLogo || undefined);
}
