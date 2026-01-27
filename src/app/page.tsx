import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-[7.5vw]">
				<div className="flex flex-col-reverse lg:flex-row items-center gap-6 sm:gap-8 py-8 sm:py-12">
					{/* Image */}
					<div className="w-full lg:w-[65%]">
						<div className="bg-white dark:bg-[radial-gradient(circle,_#d9d9d9_0%,_#d9d9d9_50%,_#161616_100%)] rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 w-full overflow-hidden hover:scale-[1.03] transition-transform duration-150">
							<Image
								src="/images/kaneki.png"
								alt="dcbuilder.eth"
								width={800}
								height={800}
								className="w-full h-auto"
								priority
							/>
						</div>
					</div>

					{/* Content */}
					<div className="w-full lg:w-[35%] space-y-8 sm:space-y-10">
						{/* Research */}
						<section>
							<h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
								Research
							</h2>
							<ul className="space-y-1.5 sm:space-y-2 text-base sm:text-lg">
								<li>• Ethereum</li>
								<li>• Programmable Cryptography (ZK, FHE, MPC, TEE)</li>
								<li>• Digital Identity</li>
								<li>• Distributed Systems</li>
								<li>• Decentralized AI</li>
							</ul>
						</section>

						{/* Engineering */}
						<section>
							<h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
								Engineering
							</h2>
							<ul className="space-y-1.5 sm:space-y-2 text-base sm:text-lg">
								<li>• Rust</li>
								<li>• Solidity</li>
							</ul>
						</section>

						{/* Angel Investing */}
						<section>
							<h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
								Angel Investing
							</h2>
							<p className="text-base sm:text-lg">
								Supporting teams building cool things in the
								areas of programmable cryptography, distributed
								systems, digital identity, AI, scalability,
								privacy, and more. Read more in the{" "}
								<Link
									href="/portfolio"
									className="underline hover:opacity-70 transition-opacity"
								>
									Portfolio
								</Link>{" "}
								section.
							</p>
						</section>
					</div>
				</div>
			</main>
		</>
	);
}
