import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 px-[7.5vw]">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 py-12">
          {/* Image */}
          <div className="lg:w-[65%]">
            <div className="bg-white dark:bg-[radial-gradient(circle,_rgba(120,120,120,0.25)_0%,_rgba(60,60,60,0.1)_40%,_transparent_70%)] rounded-[2.5rem] p-8 w-full overflow-hidden">
              <Image
                src="/images/kaneki.png"
                alt="dcbuilder"
                width={800}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Content */}
          <div className="lg:w-[35%] space-y-10">
              {/* Research */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Research</h2>
                <ul className="space-y-2 text-lg text-inherit">
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
                <ul className="space-y-2 text-lg text-inherit">
                  <li>• Rust</li>
                  <li>• Solidity</li>
                </ul>
              </section>

              {/* Angel Investing */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Angel Investing</h2>
                <p className="text-lg text-inherit">
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
      </main>
    </>
  );
}
