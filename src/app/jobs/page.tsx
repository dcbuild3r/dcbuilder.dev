import { Navbar } from "@/components/Navbar";
import { JobsGrid } from "@/components/JobsGrid";
import { jobs } from "@/data/jobs";

export const metadata = {
	title: "dcbuilder - Jobs",
	description: "Job opportunities at companies in my network",
};

export default function Jobs() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-24 px-6">
				<div className="max-w-4xl mx-auto py-12 space-y-8">
					{/* Header */}
					<section className="text-center space-y-4">
						<h1 className="text-4xl font-bold">Jobs</h1>
						<p className="max-w-2xl mx-auto text-lg text-neutral-700 dark:text-neutral-300">
							Open positions at companies I&apos;ve invested in, advise,
							work with, or am friends with. These are teams I believe in
							building products that matter.
						</p>
					</section>

					{/* Jobs Grid */}
					<JobsGrid jobs={jobs} />
				</div>
			</main>
		</>
	);
}
