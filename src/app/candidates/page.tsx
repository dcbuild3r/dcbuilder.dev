import { Navbar } from "@/components/Navbar";
import { CandidatesGrid } from "@/components/CandidatesGrid";
import { candidates } from "@/data/candidates";

export const metadata = {
	title: "dcbuilder - Candidates",
	description: "Talented builders looking for opportunities in crypto",
};

export default function Candidates() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-24 px-6">
				<div className="max-w-5xl mx-auto py-12 space-y-8">
					{/* Header */}
					<section className="text-center space-y-4">
						<h1 className="text-4xl font-bold">Candidates</h1>
						<p className="max-w-2xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
							Talented builders looking for new opportunities in crypto.
							I&apos;ve personally vouched for each of these candidates.
						</p>
					</section>

					{/* How it works info box */}
					<div className="max-w-2xl mx-auto p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
						<h3 className="font-medium mb-2">How introductions work</h3>
						<ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
							<li>
								• <strong>Public profiles:</strong> Contact the candidate
								directly via their social links
							</li>
							<li>
								• <strong>Anonymous profiles:</strong> Request an introduction
								through me on Telegram
							</li>
							<li>
								• All candidates have been personally vetted and vouched for
							</li>
						</ul>
					</div>

					{/* Candidates Grid */}
					<CandidatesGrid candidates={candidates} />
				</div>
			</main>
		</>
	);
}
