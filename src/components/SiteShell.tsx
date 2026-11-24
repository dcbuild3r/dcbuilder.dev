import { Navbar } from "./Navbar";
import { SiteFooter } from "./SiteFooter";

export function SiteShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="bg-[#0a0a0a] text-ink">
			<div className="relative z-[1] flex min-h-screen flex-col bg-ground">
				<Navbar />
				<main id="main-content" className="flex-1">
					{children}
				</main>
				<SiteFooter />
			</div>
			{/* Wordmark pinned under the page; the content scrolls off it at the very end. */}
			<div
				aria-hidden="true"
				className="sticky bottom-0 z-0 overflow-hidden whitespace-nowrap bg-[#0a0a0a] px-4 pt-7 text-center text-[clamp(3.5rem,15.5vw,15rem)] font-bold leading-[0.8] tracking-[-0.07em] text-white"
			>
				dcbuilder.eth
			</div>
		</div>
	);
}
