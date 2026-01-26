import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12 py-12">
            {/* Image */}
            <div className="lg:w-3/5 flex justify-center">
              <div className="bg-neutral-100 rounded-2xl p-6">
                <Image
                  src="/images/kaneki.png"
                  alt="dcbuilder"
                  width={600}
                  height={600}
                  className="w-full"
                  priority
                />
              </div>
            </div>

            {/* Content */}
            <div className="lg:w-2/5 space-y-12">
              {/* Research */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Research</h2>
                <ul className="space-y-2 text-lg text-neutral-800 dark:text-neutral-300">
                  <li>• Ethereum</li>
                  <li>• Programmable Cryptography (ZK, FHE, MPC, TEE, ...)</li>
                  <li>• Digital Identity</li>
                  <li>• Distributed Systems</li>
                  <li>• Decentralized AI</li>
                </ul>
              </section>

              {/* Development */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Development</h2>
                <ul className="space-y-2 text-lg text-neutral-800 dark:text-neutral-300">
                  <li>• Rust</li>
                  <li>• Solidity</li>
                </ul>
              </section>

              {/* Angel Investing */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Angel Investing</h2>
                <p className="text-lg text-neutral-800 dark:text-neutral-300">
                  Supporting teams building cool things in the areas of programmable
                  cryptography, distributed systems, digital identity, AI, scalability,
                  privacy, and more. Read more in the{" "}
                  <Link href="/portfolio" className="underline hover:opacity-70 transition-opacity">
                    Portfolio
                  </Link>{" "}
                  section.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
