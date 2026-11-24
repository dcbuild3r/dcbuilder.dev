import Image from "next/image";
import Link from "next/link";
import { HomeGpuCanvas } from "@/components/HomeGpuCanvas";
import { DescentFigure } from "@/components/convergence/DescentFigure";
import { buttonClass } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HERO, SECTIONS } from "@/data/home";
import { formatBlogDate, getPublicAllPosts } from "@/lib/blog";
import { getInvestmentLogoVariants, getInvestmentTile } from "@/lib/investment-branding";
import { getCandidateCount, getInvestments, getJobCountsByCompany } from "@/lib/portfolio-data";
import { withDataFallback } from "@/lib/resilient-data";
import { cn } from "@/lib/utils";
import { JsonLd, pageMetadata, personJsonLd } from "@/lib/seo";
import { SITE_TITLE } from "@/lib/site";

// Cached reads (unstable_cache, 300s) keep this page off Postgres per request.
export const revalidate = 300;

const sectionHeading = "text-[28px] font-semibold tracking-[-0.035em] text-ink";
const card = "rounded-2xl border border-line bg-surface";
const heroHeading = "mb-[0.5em] text-[1.25em] font-bold tracking-[-0.02em] text-ink";
const heroText = "text-[1.03em] leading-[1.4] text-body";
// em units: the hero scales with .home-hero-scale's viewport-driven font size.
const heroButton = "min-h-[3.03em] gap-[0.69em] rounded-[0.83em] pl-[1.1em] pr-[1.24em] text-[0.906em]";
const textLink = "inline-flex min-h-11 items-center text-[14.5px] font-medium text-accent";
const stat = "block text-[56px] font-semibold leading-none tracking-[-0.05em]";

function HeroList({ title, items }: { title: string; items: { text: string; suffix?: string }[] }) {
  return (
    <section>
      <h2 className={heroHeading}>{title}</h2>
      <ul className={cn(heroText, "flex flex-col gap-[0.36em]")}>
        {items.map((item) => (
          <li key={item.text}>
            {item.text}
            {item.suffix}
          </li>
        ))}
      </ul>
    </section>
  );
}

export const metadata = {
  ...pageMetadata({ title: SITE_TITLE, path: "/" }),
  title: { absolute: SITE_TITLE },
};

export default async function Home() {
  const [posts, investments, jobCounts, candidateCount] = await Promise.all([
    withDataFallback("home.posts", getPublicAllPosts(), null),
    withDataFallback("home.investments", getInvestments(), null),
    withDataFallback("home.jobs", getJobCountsByCompany(), null),
    withDataFallback("home.candidates", getCandidateCount(), null),
  ]);

  const latest = posts?.slice(0, 3) ?? [];
  const featured = investments?.filter((i) => i.featured) ?? [];
  const logos = featured
    .map((i) => ({ title: i.title, logo: getInvestmentLogoVariants(i.title, i.logo), tile: getInvestmentTile(i.title) }))
    .filter((l) => l.logo)
    .slice(0, 12);
  const openRoles = jobCounts ? Object.values(jobCounts).reduce((a, b) => a + b, 0) : null;

  return (
    <>
      <JsonLd data={personJsonLd()} />
      <section className="home-landing flex min-h-[calc(100dvh-64px)] items-center lg:min-h-[calc(100dvh-70px)]">
        <HomeGpuCanvas />
        <div className="home-hero-scale relative z-[1] mx-auto grid w-full max-w-[81em] gap-x-[2em] gap-y-[3em] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.16fr)] px-6 pt-6 pb-[4.5em]">
          <div className="home-hero-panel min-w-0 rounded-[1.75em] p-[1.5em]">
            <p className="mb-[1.43em] font-mono text-[0.875em] font-semibold uppercase tracking-[0.14em] text-ink">
              Researcher, engineer, angel investor
            </p>
            <h1 className="text-[clamp(2.8rem,6vw,5.4em)] font-semibold leading-[0.92] tracking-[-0.065em] text-ink">
              dcbuilder.eth
            </h1>
            <div className="mt-[1.5em] flex flex-wrap gap-[0.75em]">
              <Link href="/blog" className={buttonClass({ className: heroButton })}>
                <svg aria-hidden="true" className="size-[1.24em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
                Read the blog
              </Link>
              <Link href="/portfolio" className={buttonClass({ className: heroButton })}>
                <svg aria-hidden="true" className="size-[1.24em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                View portfolio
              </Link>
            </div>
            <div className="mt-[1.65em] grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-[1em]">
              <HeroList title={SECTIONS.research.title} items={SECTIONS.research.items} />
              <HeroList title={SECTIONS.engineering.title} items={SECTIONS.engineering.items} />
              <section className="col-span-full">
                <h2 className={heroHeading}>{SECTIONS.angelInvesting.title}</h2>
                <p className={cn(heroText, "max-w-[34em]")}>
                  Supporting teams building cool things in the areas of programmable cryptography, distributed
                  systems, digital identity, AI, scalability, privacy, and more.
                </p>
              </section>
            </div>
          </div>

          <div className="home-kaneki relative mx-auto w-full max-w-[34rem] overflow-clip xl:max-w-none">
            <Image
              src={HERO.image}
              alt={HERO.alt}
              width={1254}
              height={1254}
              sizes="(min-width: 1280px) 55vw, (min-width: 592px) 34rem, calc(100vw - 3rem)"
              className="home-kaneki-image absolute left-1/2 -translate-x-1/2 object-contain object-top"
              preload
              draggable={false}
            />
          </div>
        </div>
        <a
          href="#latest"
          aria-label="Scroll to latest writing"
          className="absolute bottom-3 left-1/2 z-[1] flex size-11 -translate-x-1/2 items-center justify-center rounded-full text-body"
        >
          <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
      </section>

      <section id="latest" className="mx-auto max-w-[1200px] scroll-mt-20 px-6 pt-[72px]">
        {latest.length > 0 && (
          <>
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className={sectionHeading}>Latest writing</h2>
              <Link href="/blog" className={textLink}>
                All posts
              </Link>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
              {latest.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className={cn(card, "flex flex-col gap-3 p-6")}>
                  <span className="font-mono text-xs text-muted">
                    {formatBlogDate(post.date)} · {post.readingTime} min
                  </span>
                  <span className="text-xl font-semibold leading-tight tracking-[-0.02em] text-ink">{post.title}</span>
                  <span className="text-[14.5px] leading-[1.55] text-body">{post.description}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pt-[72px] pb-20">
        <div className="flex flex-wrap gap-4">
          <div className={cn(card, "flex-[2_1_480px] p-7")}>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className={sectionHeading}>Portfolio</h2>
              {investments && (
                <span className="font-mono text-xs text-muted">
                  {investments.length} investments · {featured.length} featured
                </span>
              )}
            </div>
            <p className="mt-3 mb-6 max-w-[560px] text-[15px] leading-relaxed text-body">
              Supporting teams building in programmable cryptography, distributed systems, digital identity, AI,
              scalability and privacy.
            </p>
            {logos.length > 0 && (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                {logos.map(({ title, logo, tile }) => (
                  <Link
                    key={title}
                    href="/portfolio"
                    aria-label={title}
                    style={tile ? { background: tile } : undefined}
                    className={cn(
                      "flex aspect-square items-center justify-center overflow-hidden rounded-[14px]",
                      !tile && "border border-line bg-white p-2",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo!.light}
                      alt=""
                      loading="lazy"
                      className={cn("size-full object-contain", logo!.dark && "dark:hidden")}
                    />
                    {logo!.dark && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logo!.dark} alt="" loading="lazy" className="hidden size-full object-contain dark:block" />
                    )}
                  </Link>
                ))}
              </div>
            )}
            <Link href="/portfolio" className={cn(textLink, "mt-4")}>
              See all investments
            </Link>
          </div>

          <div className="flex flex-[1_1_300px] flex-col gap-4">
            <Link href="/jobs" className={cn(card, "flex flex-1 flex-col justify-between gap-6 p-7")}>
              <Eyebrow>Jobs board</Eyebrow>
              <span>
                {openRoles !== null && <span className={cn(stat, "text-ink")}>{openRoles}</span>}
                <span className="mt-2 block text-[15px] leading-normal text-body">
                  open roles at portfolio and network companies
                </span>
              </span>
            </Link>
            <Link href="/candidates" className={cn(card, "flex flex-1 flex-col justify-between gap-6 p-7")}>
              <Eyebrow>Candidates</Eyebrow>
              <span>
                {candidateCount !== null && <span className={cn(stat, "text-ink")}>{candidateCount}</span>}
                <span className="mt-2 block text-[15px] leading-normal text-body">
                  talented builders looking for new opportunities
                </span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-20">
        {/* Always dark, in Convergence Labs' own red/yellow/green. */}
        <div className="flex flex-wrap items-center justify-between gap-x-14 gap-y-8 rounded-[20px] border border-white/10 bg-[#0b0b0a] p-8 text-[#f4f3ee]">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-6">
            <div>
              <p className="mb-3 font-mono text-[11.5px] font-medium uppercase tracking-[0.16em] text-[#e9c15f]">Research, Engineering, Capital</p>
              <div className="flex items-center gap-3.5">
                <Image src="/convergence-labs.svg" alt="" width={56} height={56} unoptimized className="size-14 shrink-0 rounded-[14px] border border-white/10 bg-[#161614] p-1.5" />
                <h2 className="text-[28px] font-semibold tracking-[-0.035em]">Convergence Labs</h2>
              </div>
              <p className="mt-3 max-w-[520px] text-base leading-relaxed text-[#f4f3ee]/75">
                A founder-led studio for digital identity, cryptography, distributed systems and agentic software.
              </p>
              <a
                href="https://www.convergencelabs.xyz/"
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass({ className: "mt-5 bg-gradient-to-r from-[#ff6f54] via-[#e9c15f] to-[#91f27f] px-4 font-semibold text-[#0b0b0a]" })}
              >
                convergencelabs.xyz <span aria-hidden="true">↗</span>
              </a>
            </div>
            <ul className="flex flex-col gap-3">
              <li className="rounded-[14px] bg-[#ff6f54]/12 px-[18px] py-4">
                <span className="block text-[15px] font-semibold text-[#ff6f54]">Research and engineering</span>
                <span className="mt-0.5 block text-sm leading-normal text-[#f4f3ee]/75">
                  Digital identity, cryptography and distributed systems
                </span>
              </li>
              <li className="rounded-[14px] bg-[#91f27f]/12 px-[18px] py-4">
                <span className="block text-[15px] font-semibold text-[#91f27f]">Developing agentic tooling</span>
                <span className="mt-0.5 block text-sm leading-normal text-[#f4f3ee]/75">
                  <a href="https://portal.convergencelabs.xyz/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#e9c15f] underline">
                    Portal
                  </a>
                  : your people, plans, notes, health and money in one app, on your own computer.{" "}
                  <a href="https://epicenter.convergencelabs.xyz/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#e9c15f] underline">
                    Epicenter
                  </a>
                  : a self-hosted inbox for your messaging apps, email, and full message history. Your agents plug into
                  both with scoped access.
                </span>
              </li>
            </ul>
          </div>
          <div className="relative aspect-[5/4] w-full flex-[0_1_440px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0a]">
            <DescentFigure />
          </div>
        </div>
      </section>
    </>
  );
}
