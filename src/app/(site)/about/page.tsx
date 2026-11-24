import Image from "next/image";
import Link from "next/link";
import { db, affiliations as affiliationsTable } from "@/db";
import { cachePublicData } from "@/lib/public-cache";
import { withDataFallback } from "@/lib/resilient-data";
import { R2_PUBLIC_URL } from "@/services/r2";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
	title: "About",
	description: "Research, engineering, and angel investing in cryptography, distributed systems, and AI.",
	path: "/about",
});

// Force dynamic rendering since we need database access
export const dynamic = "force-dynamic";

// Check if affiliation is currently active
const isActive = (dateEnd: string | null): boolean => {
	return dateEnd?.toLowerCase() === "present" || dateEnd === null;
};

const months: Record<string, number> = {
	jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
	apr: 4, april: 4, may: 5, jun: 6, june: 6,
	jul: 7, july: 7, aug: 8, august: 8, sep: 9, september: 9,
	oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

const parseMonthDate = (date: string | null): { year: number; month: number } | null => {
	if (!date || date.toLowerCase() === "present") return null;
	const parts = date.toLowerCase().split(" ");
	const month = months[parts[0]];
	const year = Number.parseInt(parts[1], 10);
	if (!month || Number.isNaN(year)) return null;
	return { year, month };
};

const formatAffiliationDuration = (
	dateBegin: string | null,
	dateEnd: string | null
): string | null => {
	const start = parseMonthDate(dateBegin);
	if (!start) return null;

	const now = new Date();
	const end = parseMonthDate(dateEnd) ?? {
		year: now.getFullYear(),
		month: now.getMonth() + 1,
	};

	const totalMonths = Math.max(1, (end.year - start.year) * 12 + end.month - start.month);
	const years = Math.floor(totalMonths / 12);
	const monthsRemaining = totalMonths % 12;

	if (years === 0) {
		return `${monthsRemaining} ${monthsRemaining === 1 ? "month" : "months"}`;
	}

	if (monthsRemaining === 0) {
		return `${years} ${years === 1 ? "year" : "years"}`;
	}

	return `${years} ${years === 1 ? "year" : "years"} ${monthsRemaining} ${monthsRemaining === 1 ? "month" : "months"}`;
};

// Newest start first (timeline order)
const startKey = (dateBegin: string | null): number => {
	const d = parseMonthDate(dateBegin);
	return d ? d.year * 100 + d.month : 0;
};
const sortAffiliations = <T extends { dateBegin: string | null }>(affiliations: T[]): T[] =>
	[...affiliations].sort((a, b) => startKey(b.dateBegin) - startKey(a.dateBegin));

type Contribution = { date: string; level: number };

// shortcut: unofficial public contributions proxy, swap for the GitHub GraphQL API if it becomes unreliable
async function getContributions(): Promise<Contribution[]> {
	try {
		const res = await fetch("https://github-contributions-api.jogruber.de/v4/dcbuild3r?y=last", {
			next: { revalidate: 86400 },
		});
		if (!res.ok) return [];
		const data = (await res.json()) as { contributions?: Contribution[] };
		return data.contributions ?? [];
	} catch {
		return [];
	}
}

const LEVEL_CLASS = [
	"bg-[#ebedf0] dark:bg-white/10",
	"bg-[#9be9a8]",
	"bg-[#40c463]",
	"bg-[#30a14e]",
	"bg-[#216e39]",
];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LIGHT_TILE = ["Tools For Humanity", "Moralis", "Octet"];

async function getAffiliations() {
	const affiliations = await db.select().from(affiliationsTable);
	return sortAffiliations(affiliations);
}

const getPublicAffiliations = cachePublicData(["affiliations"], getAffiliations, ["affiliations"]);

export default async function About() {
	const [affiliations, contributions] = await Promise.all([
    withDataFallback("about.affiliations", getPublicAffiliations(), []),
    withDataFallback("about.contributions", getContributions(), []),
  ]);
	// Pad the first week so rows line up Sun..Sat.
	const cells: (Contribution | null)[] = contributions.length
		? [...Array<null>(new Date(`${contributions[0].date}T00:00:00Z`).getUTCDay()).fill(null), ...contributions]
		: [];
	const monthLabels = Array.from({ length: 12 }, (_, i) => {
		const end = contributions.length ? new Date(`${contributions[contributions.length - 1].date}T00:00:00Z`) : new Date();
		return MONTH_NAMES[(end.getUTCMonth() + 1 + i) % 12];
	});
	const activeCount = affiliations.filter((a) => isActive(a.dateEnd)).length;
	return (
		<div className="mx-auto max-w-[960px] px-6 pt-8 pb-20">
			<section className="flex flex-wrap items-start gap-x-14 gap-y-10">
				<Link href="/" className="shrink-0">
					<Image
						src={`${R2_PUBLIC_URL}/dcbuilder.png`}
						alt="Dominik Clemente"
						width={336}
						height={336}
						className="size-[168px] rounded-[28px] border border-line object-cover"
					/>
				</Link>
				<div className="min-w-[min(100%,22rem)] flex-1">
					<Eyebrow className="mb-4">About · dcbuilder.eth</Eyebrow>
					<h1 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-ink">
						Dominik Clemente
					</h1>
					<div className="mt-6 flex flex-col gap-4 text-lg leading-relaxed text-body">
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
				</div>
			</section>

			<section className="mt-16">
				<div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 pb-4">
					<h2 className="text-[28px] font-semibold tracking-[-0.035em] text-ink">GitHub activity</h2>
					<a
						href="https://github.com/dcbuild3r"
						target="_blank"
						rel="noopener noreferrer"
						className="py-3 font-mono text-xs text-muted hover:text-accent"
					>
						github.com/dcbuild3r ↗
					</a>
				</div>
				{cells.length > 0 && (
					<div className="rounded-2xl border border-line bg-surface p-5">
						<div className="overflow-x-auto">
							<div className="flex min-w-[760px] gap-2">
								<div
									aria-hidden="true"
									className="grid grid-rows-[repeat(7,12px)] gap-[3px] pt-[22px] text-[10px] leading-3 text-muted"
								>
									<span />
									<span>Mon</span>
									<span />
									<span>Wed</span>
									<span />
									<span>Fri</span>
									<span />
								</div>
								<div className="min-w-0 flex-1">
									<div
										aria-hidden="true"
										className="grid h-[22px] grid-cols-12 text-[10px] leading-3 text-muted"
									>
										{monthLabels.map((m, i) => (
											<span key={i}>{m}</span>
										))}
									</div>
									<div
										role="img"
										aria-label="Contribution calendar for the past year"
										className="grid auto-cols-fr grid-flow-col grid-rows-[repeat(7,12px)] gap-[3px]"
									>
										{cells.map((c, i) => (
											<span
												key={i}
												title={c ? `${c.date}: level ${c.level}` : undefined}
												className={`rounded-[3px] ${c ? LEVEL_CLASS[c.level] : ""}`}
											/>
										))}
									</div>
								</div>
							</div>
						</div>
						<div
							aria-hidden="true"
							className="mt-3.5 flex items-center justify-end gap-1 text-xs text-muted"
						>
							Less
							{LEVEL_CLASS.map((c) => (
								<span key={c} className={`size-3 rounded-[3px] ${c}`} />
							))}
							More
						</div>
					</div>
				)}
			</section>

			<section className="mt-16">
				<div className="flex items-baseline justify-between gap-3 pb-4">
					<h2 className="text-[28px] font-semibold tracking-[-0.035em] text-ink">Affiliations</h2>
					<span className="font-mono text-xs text-muted">
						{affiliations.length} total · {activeCount} active
					</span>
				</div>
				<div className="relative mt-2">
					<div
						aria-hidden="true"
						className="absolute bottom-3 top-3 left-[7px] w-0.5 rounded-sm bg-line min-[641px]:left-[155px]"
					/>
					{affiliations.map((affiliation) => {
						const duration = formatAffiliationDuration(affiliation.dateBegin, affiliation.dateEnd);
						const active = isActive(affiliation.dateEnd);
						const devpill = affiliation.title.toLowerCase() === "devpill.me";
						const logo = devpill ? "/logos/devpill-light.png" : affiliation.logo;
						const lightTile = LIGHT_TILE.includes(affiliation.title);
						const dot = active ? "bg-green-600 shadow-[0_0_0_1px_#16a34a]" : "bg-neutral-400 shadow-[0_0_0_1px_#a3a3a3]";

						return (
							<a
								key={affiliation.title}
								href={affiliation.website || "#"}
								target="_blank"
								rel="noopener noreferrer"
								className="relative block py-5 pl-8 hover:text-accent min-[641px]:grid min-[641px]:grid-cols-[132px_48px_minmax(0,1fr)] min-[641px]:items-start min-[641px]:pl-0"
							>
								<span className="block whitespace-pre-line pb-1.5 pt-0 font-mono text-xs leading-[1.6] text-muted min-[641px]:pb-0 min-[641px]:pt-1.5 min-[641px]:text-right">
									{affiliation.dateBegin} – {affiliation.dateEnd}
									{duration && `\n${duration}`}
								</span>
								<span
									aria-hidden="true"
									className={`absolute left-0 top-[22px] box-border size-4 rounded-full border-[3px] border-ground min-[641px]:static min-[641px]:mt-2 min-[641px]:justify-self-center ${dot}`}
								/>
								<div className="flex min-w-0 flex-wrap items-start gap-x-6 gap-y-4">
									{logo ? (
										<span
											className={`box-border flex size-28 shrink-0 rounded-3xl border ${lightTile ? "border-line bg-white p-3.5" : "border-transparent"}`}
										>
											<Image
												src={logo}
												alt=""
												width={112}
												height={112}
												className={`size-full rounded-[inherit] object-contain ${devpill ? "dark:hidden" : ""}`}
											/>
											{devpill && (
												<Image
													src="/logos/devpill-dark.png"
													alt=""
													width={112}
													height={112}
													className="hidden size-full rounded-[inherit] object-contain dark:block"
												/>
											)}
										</span>
									) : (
										<div
											aria-hidden="true"
											className="box-border flex size-28 shrink-0 flex-col items-center justify-center gap-1 rounded-3xl border border-dashed border-line-strong bg-surface-2 text-muted"
										>
											<span className="text-4xl font-bold leading-none text-ink">{affiliation.title[0]}</span>
											<span className="font-mono text-[10px]">logo</span>
										</div>
									)}
									<div className="min-w-0 flex-[1_1_320px]">
										<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
											<h3 className="text-xl font-semibold leading-[1.3] tracking-[-0.015em] text-ink">
												{affiliation.title}
											</h3>
											<span className="text-lg font-medium text-body">{affiliation.role}</span>
										</div>
										<p className="mt-2 text-[15px] leading-relaxed text-body">{affiliation.description}</p>
									</div>
								</div>
							</a>
						);
					})}
				</div>
			</section>
		</div>
	);
}
