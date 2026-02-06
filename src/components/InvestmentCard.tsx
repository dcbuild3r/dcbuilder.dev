"use client";

import Image from "next/image";
import { Investment } from "@/types/investments";
import { isNew } from "@/lib/shuffle";

interface InvestmentCardProps {
  investment: Investment;
  jobCount?: number;
  jobsUrl?: string;
}

export function InvestmentCard({
  investment,
  jobCount = 0,
  jobsUrl,
}: InvestmentCardProps) {
  const isDefunct = investment.status === "defunct";

  return (
    <article
      data-testid="investment-card"
      className={`group relative p-6 pb-8 rounded-xl border transition-colors flex flex-col items-center text-center ${
        isDefunct
          ? "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
          : investment.tier === 1
          ? "border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 dark:hover:border-neutral-400"
          : investment.tier === 3
          ? "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 opacity-80"
          : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
      }`}
    >
      <div className="w-32 h-32 sm:w-24 sm:h-24 mb-4 flex items-center justify-center">
        {investment.logo && (
          <Image
            src={investment.logo}
            alt={investment.title}
            width={120}
            height={120}
            className={`w-28 h-28 sm:w-20 sm:h-20 object-contain bg-white rounded-lg p-2 group-hover:scale-[1.08] transition-transform duration-150 ${
              isDefunct ? "grayscale opacity-80" : ""
            }`}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.style.display = "none";
            }}
          />
        )}
      </div>
      <h3 className="font-semibold mb-2">
        {investment.website ? (
          <a
            href={investment.website}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {investment.title}
          </a>
        ) : (
          investment.title
        )}
        {investment.featured && (
          <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
            ★
          </span>
        )}
        {isNew(investment.createdAt) && !isDefunct && (
          <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 animate-pulse-new">
            NEW
          </span>
        )}
      </h3>
      {isDefunct && (
        <span className="inline-block px-2 py-0.5 mb-2 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Ceased Operations
        </span>
      )}
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
        {investment.description}
      </p>
      {/* Social Links */}
      <div className="flex items-center gap-1">
        {/* Website */}
        {investment.website && (
          <a
            href={investment.website}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            title="Website"
            aria-label={`Visit ${investment.title} website`}
          >
            <svg
              className="w-5 h-5 sm:w-4 sm:h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </a>
        )}
        {/* X */}
        {investment.x && (
          <a
            href={investment.x}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            title="X"
            aria-label={`Visit ${investment.title} on X`}
          >
            <svg
              className="w-5 h-5 sm:w-4 sm:h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        )}
        {/* GitHub */}
        {investment.github && (
          <a
            href={investment.github}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 sm:p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            title="GitHub"
            aria-label={`Visit ${investment.title} on GitHub`}
          >
            <svg
              className="w-5 h-5 sm:w-4 sm:h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        )}
      </div>
      {/* Join Button */}
      {jobCount > 0 && jobsUrl && (
        <a
          href={jobsUrl}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm hover:bg-black dark:hover:bg-neutral-100 hover:shadow-md hover:scale-105 active:scale-100 transition-[transform,box-shadow,background-color] duration-150"
          aria-label={`View ${jobCount} job openings at ${investment.title}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white dark:bg-neutral-900 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white dark:bg-neutral-900"></span>
          </span>
          <span>Hiring</span>
          <span className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
            {jobCount}
          </span>
        </a>
      )}
    </article>
  );
}
