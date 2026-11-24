import { SignalIcon } from "@/components/ui/icons";
import { JOBS_PAGE } from "@/data/page-content";

export function JobsHelpText() {
	return (
		<p className="max-w-xs text-[13.5px] leading-relaxed text-muted">
			{JOBS_PAGE.helpText}{" "}
			<a
				href={JOBS_PAGE.signalUrl}
				target="_blank"
				rel="noopener noreferrer"
				className="inline-flex items-center gap-1.5 align-middle font-semibold text-[#2c6bed] hover:underline dark:text-[#6f9bff]"
			>
				<SignalIcon className="size-4 shrink-0" />
				Signal
			</a>
		</p>
	);
}
