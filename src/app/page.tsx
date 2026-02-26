import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { HERO, SECTIONS } from "@/data/home";
import { R2_PUBLIC_URL } from "@/services/r2";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 sm:pt-24 px-4 sm:px-[7.5vw]">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-6 sm:gap-8 py-8 sm:py-12">
          {/* Image */}
          <div className="w-full lg:w-[65%]">
            <div className="bg-white dark:bg-[radial-gradient(circle,_#d9d9d9_0%,_#d9d9d9_50%,_#161616_100%)] rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 w-full overflow-hidden hover:scale-[1.03] transition-transform duration-150">
              <Image
                src={`${R2_PUBLIC_URL}${HERO.image}`}
                alt={HERO.alt}
                width={800}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Content */}
          <div className="w-full lg:w-[35%] space-y-8 sm:space-y-10 text-center sm:text-left">
            {/* Research */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                {SECTIONS.research.title}
              </h2>
              <ul className="space-y-1.5 sm:space-y-2 text-base sm:text-lg">
                {SECTIONS.research.items.map((item, index) => (
                  <li key={index}>
                    {item.text}
                    {item.suffix && <span className="hidden sm:inline">{item.suffix}</span>}
                  </li>
                ))}
              </ul>
            </section>

            {/* Engineering */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                {SECTIONS.engineering.title}
              </h2>
              <ul className="space-y-1.5 sm:space-y-2 text-base sm:text-lg">
                {SECTIONS.engineering.items.map((item, index) => (
                  <li key={index}>{item.text}</li>
                ))}
              </ul>
            </section>

            {/* Angel Investing */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                {SECTIONS.angelInvesting.title}
              </h2>
              <p className="text-base sm:text-lg">
                {SECTIONS.angelInvesting.text}{" "}
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
