import { SignalIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/badge";
import { CANDIDATES_PAGE } from "@/data/page-content";

const items = CANDIDATES_PAGE.howItWorks.items;
const strip = (label: string) => label.replace(/:$/, "");

/** Header shared by the page and its loading state; `count` is omitted while loading. */
export function CandidatesHeader({ count }: { count?: number }) {
	const anonymous = items.find((i) => i.type === "anonymous");
	const publicItem = items.find((i) => i.type === "public");
	return (
		<PageHeader
			eyebrow={count === undefined ? "Available" : `${count} available`}
			title="Candidates"
			lede={CANDIDATES_PAGE.description}
			aside={
				<div className="max-w-[400px] rounded-2xl border border-line bg-surface p-5">
					<h2 className="mb-2.5 text-[15px] font-semibold text-ink">
						{CANDIDATES_PAGE.howItWorks.title}
					</h2>
					<ul className="flex flex-col gap-2 text-[13.5px] leading-[1.55] text-body">
						{publicItem && publicItem.type === "public" && (
							<li>
								<strong className="text-ink">{strip(publicItem.label)}</strong> {publicItem.text}
							</li>
						)}
						{anonymous && anonymous.type === "anonymous" && (
							<li>
								<strong className="text-ink">{strip(anonymous.label)}</strong> {anonymous.text}{" "}
								<a
									href={anonymous.signalUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1.5 align-middle font-semibold text-[#2c6bed] hover:underline dark:text-[#6f9bff]"
								>
									<SignalIcon className="size-4 shrink-0" />
									Signal
								</a>
							</li>
						)}
						<li>
							<Pill variant="accent">Vouched</Pill> I personally know this candidate.
						</li>
						<li>
							<Pill variant="outline">Referred</Pill> Not personally known, proceed with caution.
						</li>
					</ul>
				</div>
			}
		/>
	);
}
