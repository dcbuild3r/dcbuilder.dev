import Image from "next/image";
import Link from "next/link";
import { GitHubIcon, SignalIcon, XIcon } from "./ui/icons";
import { MCP_URL } from "@/lib/site";

const RAINBOW =
	"linear-gradient(90deg, #3b82f6 0 20%, #8b5cf6 20% 40%, #ec4899 40% 60%, #f97316 60% 80%, #f59e0b 80% 100%)";

const linkClass = "inline-flex min-h-11 items-center text-[15px] text-neutral-300 hover:text-white";
const headingClass = "mb-1 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-neutral-400";
const socialClass =
	"inline-flex size-11 items-center justify-center rounded-xl border border-white/15 text-white hover:border-white/40";

const columns = [
	{ title: "Site", links: [["/about", "About"], ["/blog", "Blog"], ["/news", "News"]] },
	{ title: "Network", links: [["/portfolio", "Portfolio"], ["/jobs", "Jobs"], ["/candidates", "Candidates"]] },
] as const;

const socials = [
	["https://x.com/dcbuilder", "X (Twitter)", XIcon],
	["https://github.com/dcbuild3r", "GitHub", GitHubIcon],
	["https://signal.me/#eu/BUzdJ333lbZAKVUKEPl4r9zN7asssokhqWQ1gc4Rb6ofFU3QAqBNqJZH2Ho6TQ3X", "Signal", SignalIcon],
] as const;

// Always dark, in both themes.
export function SiteFooter() {
	return (
		<footer className="mt-6 overflow-hidden bg-[#0a0a0a] text-white">
			<div aria-hidden="true" className="h-1.5" style={{ background: RAINBOW }} />
			<div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-x-16 gap-y-10 px-6 pt-12">
				<div className="flex flex-[1_1_280px] flex-col gap-4">
					<div className="flex items-center gap-3">
						<Image src="/avatar.png" alt="" width={44} height={44} className="size-11 rounded-full object-cover" />
						<span className="text-xl font-bold tracking-[-0.02em]">dcbuilder.eth</span>
					</div>
					<p className="max-w-[340px] text-[15px] leading-relaxed text-neutral-300">
						Research, Engineering, Angel Investing in cryptography, distributed systems, and AI
					</p>
					<div className="flex gap-2">
						{socials.map(([href, label, Icon]) => (
							<a key={href} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={socialClass}>
								<Icon className="size-4" />
							</a>
						))}
					</div>
				</div>
				<nav aria-label="Footer" className="flex flex-wrap gap-x-[72px] gap-y-6">
					{columns.map((col) => (
						<div key={col.title} className="flex flex-col">
							<span className={headingClass}>{col.title}</span>
							{col.links.map(([href, label]) => (
								<Link key={href} href={href} className={linkClass}>
									{label}
								</Link>
							))}
						</div>
					))}
					<div className="flex flex-col">
						<span className={headingClass}>More</span>
						<span className="inline-flex min-h-11 items-center font-mono text-[13px] text-white">
							{MCP_URL.replace("https://", "")}
						</span>
						<Link href="/newsletters" className={linkClass}>
							Newsletter archive
						</Link>
						<a href="https://www.convergencelabs.xyz/" target="_blank" rel="noopener noreferrer" className={`${linkClass} gap-2`}>
							<Image src="/convergence-labs.svg" alt="" width={24} height={24} unoptimized className="size-6 shrink-0" />
							Convergence Labs ↗
						</a>
					</div>
				</nav>
			</div>
			<div className="mx-auto max-w-[1200px] px-6 pt-4 pb-5 font-mono text-xs text-neutral-400">
				Personal views, not financial advice
			</div>
		</footer>
	);
}
