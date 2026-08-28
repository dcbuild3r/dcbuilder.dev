import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { HomeGpuCanvas } from "@/components/HomeGpuCanvas";
import { HERO, SECTIONS } from "@/data/home";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="home-landing min-h-[100dvh] overflow-x-hidden pt-[var(--navbar-height)]">
        <HomeGpuCanvas />
        <div className="home-landing-grid relative mx-auto grid min-h-[calc(100dvh-var(--navbar-height))] max-w-[1600px] items-center gap-6 px-4 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(26rem,1.1fr)] lg:gap-[clamp(3rem,7vw,8rem)] lg:px-[5vw] lg:py-10">
          <div className="home-copy relative z-[1] max-w-[42rem]">
            <p className="mb-5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-neutral-600 dark:text-neutral-300">
              Researcher, engineer, angel investor
            </p>
            <h1 className="max-w-[13ch] text-[clamp(2.8rem,6vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.065em] text-neutral-950 dark:text-neutral-50">
              Credible systems.
            </h1>
            <p className="mt-6 max-w-[34rem] text-base leading-relaxed text-neutral-700 sm:text-lg dark:text-neutral-200">
              Cryptography, distributed systems, digital identity, and AI, from research through production.
            </p>

            <div className="mt-8 grid max-w-[38rem] grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3">
              <section>
                <h2 className="mb-2 text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                  {SECTIONS.research.title}
                </h2>
                <ul className="space-y-1 text-xs leading-relaxed text-neutral-600 sm:text-sm dark:text-neutral-300">
                  {SECTIONS.research.items.map((item) => (
                    <li key={item.text}>
                      {item.text}
                      {item.suffix && <span className="hidden sm:inline">{item.suffix}</span>}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="mb-2 text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                  {SECTIONS.engineering.title}
                </h2>
                <ul className="space-y-1 text-xs leading-relaxed text-neutral-600 sm:text-sm dark:text-neutral-300">
                  {SECTIONS.engineering.items.map((item) => (
                    <li key={item.text}>{item.text}</li>
                  ))}
                </ul>
              </section>

              <section className="col-span-2 sm:col-span-1">
                <h2 className="mb-2 text-sm font-semibold text-neutral-950 dark:text-neutral-50">
                  {SECTIONS.angelInvesting.title}
                </h2>
                <Link href="/portfolio" className="home-portfolio-link inline-flex items-center gap-2 text-xs font-medium sm:text-sm">
                  View portfolio <span aria-hidden="true">↗</span>
                </Link>
              </section>
            </div>
          </div>

          <div className="home-kaneki-shell relative z-[1] flex justify-center lg:justify-end">
            <div className="home-kaneki-frame group relative overflow-hidden rounded-[1.25rem] border border-white/50 bg-white/55 p-3 shadow-[0_28px_90px_rgba(15,23,42,0.16)] backdrop-blur-xl sm:rounded-[2rem] sm:p-5 dark:border-white/10 dark:bg-neutral-950/45 dark:shadow-[0_28px_90px_rgba(0,0,0,0.38)]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.45),transparent_45%)] dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.1),transparent_45%)]" />
              <Image
                src={HERO.image}
                alt={HERO.alt}
                width={800}
                height={800}
                className="relative h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.025]"
                priority
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
