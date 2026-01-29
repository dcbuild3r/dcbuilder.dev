import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { db, affiliations as affiliationsTable } from "@/db";
import { R2_PUBLIC_URL } from "@/lib/r2";

export const metadata = {
	title: "About",
};

// Revalidate every 60 seconds
export const revalidate = 60;

// Check if role is advisory (secondary to full jobs)
const isAdvisoryRole = (role: string): boolean => {
	const advisoryKeywords = ["advisor", "co-organizer", "coorganizer", "mentor", "fellow"];
	return advisoryKeywords.some((keyword) => role.toLowerCase().includes(keyword));
};

// Check if affiliation is currently active
const isActive = (dateEnd: string | null): boolean => {
	return dateEnd?.toLowerCase() === "present" || dateEnd === null;
};

// Parse date string like "Mar 2022", "July 2022", "Dec 2024" to comparable value
const parseEndDate = (dateEnd: string | null): number => {
	if (!dateEnd || dateEnd.toLowerCase() === "present") return Infinity;
	const months: Record<string, number> = {
		jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
		apr: 4, april: 4, may: 5, jun: 6, june: 6,
		jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
		oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
	};
	const parts = dateEnd.toLowerCase().split(" ");
	const month = months[parts[0]] || 1;
	const year = parseInt(parts[1]) || 2000;
	return year * 100 + month;
};

// Custom sorting for affiliations
const sortAffiliations = <T extends { title: string; role: string; dateEnd: string | null }>(
	affiliations: T[]
): T[] => {
	return [...affiliations].sort((a, b) => {
		// 1. World Foundation always first
		if (a.title === "World Foundation") return -1;
		if (b.title === "World Foundation") return 1;

		// 2. Tools For Humanity always second
		if (a.title === "Tools For Humanity") return -1;
		if (b.title === "Tools For Humanity") return 1;

		// 3. Active vs inactive
		const aActive = isActive(a.dateEnd);
		const bActive = isActive(b.dateEnd);
		if (aActive && !bActive) return -1;
		if (!aActive && bActive) return 1;

		// 4. For ACTIVE roles only: full jobs before advisory roles
		if (aActive && bActive) {
			const aAdvisory = isAdvisoryRole(a.role);
			const bAdvisory = isAdvisoryRole(b.role);
			if (!aAdvisory && bAdvisory) return -1;
			if (aAdvisory && !bAdvisory) return 1;
		}

		// 5. Sort by end date (most recent first)
		return parseEndDate(b.dateEnd) - parseEndDate(a.dateEnd);
	});
};

async function getAffiliations() {
	const affiliations = await db.select().from(affiliationsTable);
	return sortAffiliations(affiliations);
}

export default async function About() {
	const affiliations = await getAffiliations();
	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-6">
				<div className="max-w-4xl mx-auto py-8 sm:py-12 space-y-12 sm:space-y-20">
					{/* Bio Section */}
					<section className="flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
						<Link href="/" className="shrink-0">
							<Image
								src={`${R2_PUBLIC_URL}/dcbuilder.png`}
								alt="dcbuilder.eth"
								width={280}
								height={280}
								className="w-48 sm:w-64 md:w-[200px] rounded-full object-cover aspect-square hover:scale-[1.08] transition-transform duration-150"
							/>
						</Link>
						<div className="space-y-6 text-lg sm:text-xl text-neutral-700 dark:text-neutral-300">
							<p>
								My meta-goal is to maximize the positive impact
								I have on the world to help people and take
								humanity to a new age of prosperity and
								abundance.
							</p>
							<p>
								After a few years of trying out different things
								I decided that cryptography and distributed
								systems are the domains that interest me the
								most.
							</p>
						</div>
					</section>

					{/* Affiliations Section */}
					<section>
						<h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12">
							Affiliations
						</h2>
						<div className="space-y-6 sm:space-y-8">
							{affiliations.map((affiliation) => (
								<a
									key={affiliation.title}
									href={affiliation.website || "#"}
									target="_blank"
									rel="noopener noreferrer"
									className="group block p-4 sm:p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
								>
									<div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-center sm:text-left">
										<div className="shrink-0 flex items-center justify-center sm:w-32">
											{affiliation.logo && (
												<Image
													src={affiliation.logo}
													alt={affiliation.title}
													width={160}
													height={160}
													className="w-32 h-32 sm:w-24 sm:h-24 object-contain bg-white rounded-lg p-2 group-hover:scale-[1.08] transition-transform duration-150"
												/>
											)}
										</div>
										<div className="flex-1">
											<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
												<h3 className="text-lg sm:text-xl font-semibold">
													{affiliation.title}
												</h3>
												<span className="text-neutral-500 dark:text-neutral-400">
													{affiliation.role}
												</span>
											</div>
											<p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2 sm:mb-3">
												{affiliation.dateBegin} –{" "}
												{affiliation.dateEnd}
											</p>
											<p className="text-neutral-700 dark:text-neutral-300">
												{affiliation.description}
											</p>
										</div>
									</div>
								</a>
							))}
						</div>
					</section>
				</div>
			</main>
		</>
	);
}
