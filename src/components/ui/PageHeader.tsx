import { Eyebrow } from "./Eyebrow";

export function PageHeader({
	eyebrow,
	title,
	lede,
	aside,
}: {
	eyebrow: string;
	title: React.ReactNode;
	lede?: React.ReactNode;
	aside?: React.ReactNode;
}) {
	return (
		<header className="mb-10 flex flex-wrap items-start justify-between gap-6">
			<div>
				<Eyebrow className="mb-3">{eyebrow}</Eyebrow>
				<h1 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-ink">
					{title}
				</h1>
				{lede && (
					<p className="mt-4 max-w-[35rem] text-lg leading-relaxed text-body">{lede}</p>
				)}
			</div>
			{aside && <div className="min-w-0 max-w-full lg:shrink-0">{aside}</div>}
		</header>
	);
}
