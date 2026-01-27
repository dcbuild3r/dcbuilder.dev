import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { affiliations } from "@/data/affiliations";

export const metadata = {
	title: "About",
};

export default function About() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-24 px-6">
				<div className="max-w-4xl mx-auto py-12 space-y-20">
					{/* Bio Section */}
					<section className="flex flex-col md:flex-row items-center gap-12">
						<Link href="/" className="shrink-0">
							<Image
								src="/images/dcbuilder.png"
								alt="dcbuilder.eth"
								width={200}
								height={200}
								className="rounded-full hover:scale-105 transition-transform"
							/>
						</Link>
						<div className="space-y-6 text-xl text-neutral-700 dark:text-neutral-300">
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
						<h2 className="text-4xl font-bold text-center mb-12">
							Affiliations
						</h2>
						<div className="space-y-8">
							{affiliations.map((affiliation) => (
								<a
									key={affiliation.title}
									href={affiliation.imageUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="block p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
								>
									<div className="flex flex-col sm:flex-row gap-6">
										<div className="shrink-0 flex items-center justify-center sm:w-32">
											<Image
												src={affiliation.logo}
												alt={affiliation.title}
												width={100}
												height={100}
												className="object-contain bg-white rounded-lg p-2"
											/>
										</div>
										<div className="flex-1">
											<div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
												<h3 className="text-xl font-semibold">
													{affiliation.title}
												</h3>
												<span className="text-neutral-500 dark:text-neutral-400">
													• {affiliation.role}
												</span>
											</div>
											<p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
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
