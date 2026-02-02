/**
 * Shared static content for pages.
 * Used by both page.tsx and loading.tsx to avoid duplication.
 */

export const JOBS_PAGE = {
  title: "Jobs",
  description:
    "Open positions at companies I've invested in, advise, work with, or am friends with. These are teams I believe in building products that matter.",
  helpText:
    "Am I missing any job openings from these companies or are any no longer available? Please let me know on",
  telegramUrl: "https://t.me/dcbuilder",
};

export const CANDIDATES_PAGE = {
  title: "Candidates",
  description:
    "Talented builders looking for new opportunities. I've personally vouched for each of these candidates.",
  howItWorks: {
    title: "How introductions work",
    items: [
      {
        type: "public" as const,
        label: "Public profiles:",
        text: "Contact the candidate directly via their social links",
      },
      {
        type: "anonymous" as const,
        label: "Anonymous profiles:",
        text: "Request an introduction through me on",
        telegramUrl: "https://t.me/dcbuilder",
      },
      {
        type: "vouched" as const,
        symbol: "✓",
        symbolClass: "text-green-600 dark:text-green-400",
        text: "= I personally know and vouch for this candidate",
      },
      {
        type: "referred" as const,
        symbol: "◇",
        symbolClass: "text-amber-600 dark:text-amber-400",
        text: "= Referred candidate (not personally known, proceed with caution)",
      },
    ],
  },
};

export const PORTFOLIO_PAGE = {
  disclaimer: {
    title: "Disclaimer",
    text: "All information and opinions presented on this website reflect only my personal views and experiences. They are not intended to represent or imply the views, policies, or endorsements of any organization, entity, or other individuals. The investments, strategies, and opinions expressed are solely my own and should not be considered financial advice. Please consult a qualified financial advisor before making any investment decisions.",
  },
  investments: {
    title: "Investments",
  },
};

export const NEWS_PAGE = {
  title: "News",
  description:
    "Curated articles, my blog posts, and announcements from portfolio companies.",
};

export const BLOG_PAGE = {
  title: "Blog",
};
