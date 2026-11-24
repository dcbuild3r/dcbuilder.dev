import { CandidatesHeader } from "@/components/candidates/CandidatesHeader";

export default function CandidatesLoading() {
	return (
		<div className="mx-auto max-w-[1200px] px-6 pt-[72px] pb-24">
			<CandidatesHeader />
			<div className="h-[68px] rounded-2xl border border-line bg-surface" />
			<div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(360px,100%),1fr))] gap-4">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className="h-[360px] animate-pulse rounded-2xl border border-line bg-surface" />
				))}
			</div>
		</div>
	);
}
