"use client";

import Image from "next/image";
import { Investment } from "@/types/investments";
import { isNew } from "@/lib/shuffle";
import { getInvestmentLogoVariants, getInvestmentTile, getInvestmentLogoClass } from "@/lib/investment-branding";
import { Badge } from "@/components/ui/badge";
import { GitHubIcon, WebsiteIcon, XIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface InvestmentCardProps {
  investment: Investment;
  jobCount?: number;
  jobsUrl?: string;
  newsUrl?: string;
}

const iconLinkClass =
  "flex size-10 items-center justify-center rounded-[10px] text-body hover:text-accent";

const CATEGORY_TINTS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
  "bg-warm-soft text-warm",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
];

function categoryTint(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return CATEGORY_TINTS[h % CATEGORY_TINTS.length];
}

export function InvestmentCard({
  investment,
  jobCount = 0,
  jobsUrl,
  newsUrl,
}: InvestmentCardProps) {
  const isDefunct = investment.status === "defunct";
  const isExited = investment.status === "exited";
  const logoVariants = getInvestmentLogoVariants(
    investment.title,
    investment.logo
  );
  const tile = getInvestmentTile(investment.title);
  const logoClassName = cn(
    "size-[104px] shrink-0 rounded-[20px] object-contain",
    !tile && "border border-line bg-white p-2",
    getInvestmentLogoClass(investment.title),
    isDefunct && "grayscale opacity-80"
  );
  const hideOnError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.style.display = "none";
  };
  const showNew = isNew(investment.createdAt) && !isDefunct && !isExited;

  return (
    <article
      data-testid="investment-card"
      className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-surface"
    >
      <div
        className={cn(
          "relative flex h-[148px] items-center justify-center",
          !tile && "bg-surface-2"
        )}
        style={tile ? { background: tile } : undefined}
      >
        {logoVariants && (
          <Image
            src={logoVariants.light}
            alt=""
            width={104}
            height={104}
            className={cn(logoClassName, logoVariants.dark && "dark:hidden")}
            onError={hideOnError}
          />
        )}
        {logoVariants?.dark && (
          <Image
            src={logoVariants.dark}
            alt=""
            width={104}
            height={104}
            className={cn(logoClassName, "hidden dark:block")}
            onError={hideOnError}
          />
        )}
        {investment.featured && (
          <span
            role="img"
            aria-label="Featured"
            title="Featured"
            className="absolute left-3 top-2.5 flex drop-shadow-[0_1px_3px_rgb(0_0_0/0.35)]"
          >
            <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.2" strokeLinejoin="round">
              <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z" />
            </svg>
          </span>
        )}
        <div className="absolute right-3 top-2.5 flex flex-col items-end gap-1">
          {showNew && <Badge variant="outline" className="bg-surface">NEW</Badge>}
          {isExited && <Badge variant="outline" className="bg-surface">Exited</Badge>}
          {isDefunct && <Badge variant="warm">Ceased Operations</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="min-w-0 text-xl font-semibold leading-tight tracking-[-0.02em] text-ink">
            {investment.title}
          </h3>
          <div className="-mr-2.5 flex shrink-0">
            {investment.website && (
              <a
                href={investment.website}
                target="_blank"
                rel="noopener noreferrer"
                className={iconLinkClass}
                aria-label={`Visit ${investment.title} website`}
              >
                <WebsiteIcon className="size-[18px]" />
              </a>
            )}
            {investment.x && (
              <a
                href={investment.x}
                target="_blank"
                rel="noopener noreferrer"
                className={iconLinkClass}
                aria-label={`Visit ${investment.title} on X`}
              >
                <XIcon className="size-[15px]" />
              </a>
            )}
            {investment.github && (
              <a
                href={investment.github}
                target="_blank"
                rel="noopener noreferrer"
                className={iconLinkClass}
                aria-label={`Visit ${investment.title} on GitHub`}
              >
                <GitHubIcon className="size-[17px]" />
              </a>
            )}
          </div>
        </div>

        <p className="mt-1.5 text-[14.5px] leading-[1.55] text-body">
          {investment.description}
        </p>

        {investment.categories && investment.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {investment.categories.map((c) => (
              <span
                key={c}
                className={cn(
                  "rounded-full px-2.5 py-[3px] text-[12.5px] font-medium",
                  categoryTint(c)
                )}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {(newsUrl || (jobCount > 0 && jobsUrl)) && (
          <div className="mt-auto flex flex-wrap items-center gap-x-2 pt-2.5">
            {newsUrl && (
              <a
                href={newsUrl}
                className="inline-flex min-h-11 items-center"
                aria-label={`View news for ${investment.title}`}
              >
                <span className="inline-flex h-[30px] items-center rounded-full border border-line-strong px-3 text-[13px] font-semibold text-ink">
                  News
                </span>
              </a>
            )}
            {jobCount > 0 && jobsUrl && (
              <a
                href={jobsUrl}
                className="inline-flex min-h-11 items-center"
                aria-label={`View ${jobCount} job openings at ${investment.title}`}
              >
                <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-inverse pl-3 pr-2 text-[13px] font-semibold text-inverse-ink">
                  Hiring
                  <span className="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-bold leading-none text-ink">
                    {jobCount}
                  </span>
                </span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
