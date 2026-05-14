import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { HERO, SECTIONS } from "@/data/home";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="h-dvh overflow-hidden pt-[var(--navbar-height)] px-4 sm:px-[7.5vw] lg:px-[2vw]">
        <div className="mx-auto flex h-full max-w-[1700px] flex-col-reverse items-center justify-center gap-3 py-3 sm:gap-5 sm:py-5 lg:flex-row lg:gap-[clamp(3rem,4vw,5rem)] lg:py-3">
          {/* Image */}
          <div className="home-kaneki-shell flex justify-center">
            <div className="home-kaneki-frame bg-white dark:bg-[radial-gradient(circle,_#d9d9d9_0%,_#d9d9d9_50%,_#161616_100%)] rounded-2xl sm:rounded-[2.5rem] p-3 sm:p-5 lg:p-8 overflow-hidden hover:scale-[1.03] transition-transform duration-150">
              <Image
                src={HERO.image}
                alt={HERO.alt}
                width={800}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>
          </div>

          {/* Content */}
          <div className="w-full space-y-4 text-center sm:space-y-6 sm:text-left lg:w-[clamp(26rem,36vw,33rem)] lg:max-w-none lg:space-y-8">
            {/* Research */}
            <section>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4">
                {SECTIONS.research.title}
              </h2>
              <ul className="space-y-1 sm:space-y-1.5 lg:space-y-2 text-sm sm:text-base lg:text-lg lg:whitespace-nowrap">
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
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4">
                {SECTIONS.engineering.title}
              </h2>
              <ul className="space-y-1 sm:space-y-1.5 lg:space-y-2 text-sm sm:text-base lg:text-lg lg:whitespace-nowrap">
                {SECTIONS.engineering.items.map((item, index) => (
                  <li key={index}>{item.text}</li>
                ))}
              </ul>
            </section>

            {/* Angel Investing */}
            <section>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 lg:mb-4">
                {SECTIONS.angelInvesting.title}
              </h2>
              <p className="text-sm sm:text-base lg:text-lg">
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
