import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { HomeGpuCanvas } from "@/components/HomeGpuCanvas";
import { HERO, SECTIONS } from "@/data/home";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="home-landing h-dvh overflow-hidden pt-[var(--navbar-height)] px-4 sm:px-[7.5vw] lg:px-[2vw]">
        <HomeGpuCanvas />
        <div className="relative z-[1] mx-auto flex h-full max-w-[1700px] flex-col-reverse items-center justify-center gap-3 py-3 sm:gap-5 sm:py-5 lg:flex-row lg:gap-[clamp(3rem,4vw,5rem)] lg:py-3">
          {/* Image */}
          <div className="home-kaneki-shell flex justify-center">
            <div className="home-kaneki-frame transition-transform duration-300 hover:scale-[1.03]">
              <Image
                src={HERO.image}
                alt={HERO.alt}
                width={800}
                height={832}
                sizes="(min-width: 1024px) 50vw, (min-width: 640px) 48vw, 64vw"
                className="h-auto w-full drop-shadow-[0_18px_36px_rgba(55,15,10,0.18)] dark:drop-shadow-[0_18px_36px_rgba(0,0,0,0.38)]"
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
