/**
 * Reusable skeleton loading components for grids and cards.
 */

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/50 ${className}`}
    />
  );
}

export function GridSkeleton({
  columns = 3,
  rows = 2,
  cardHeight = "h-64",
}: {
  columns?: number;
  rows?: number;
  cardHeight?: string;
}) {
  const colClasses: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${colClasses[columns] || colClasses[3]} gap-4`}>
      {Array.from({ length: columns * rows }).map((_, i) => (
        <CardSkeleton key={i} className={cardHeight} />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

// Generic filter row skeleton
export function FiltersSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-wrap gap-3">
        <div className="h-10 w-32 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-36 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="h-10 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}

// Jobs-specific filters skeleton (matches JobsGrid filter layout)
export function JobsFiltersSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Row 1: Affiliation, Role, Company, Location */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-32 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-36 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-36 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
      {/* Row 2: Search + Featured + Count */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-32 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-5 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

// Candidates-specific filters skeleton
export function CandidatesFiltersSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Row 1: Status, Experience, Looking For */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-12 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-44 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
      {/* Row 2: Search + Count */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-5 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      {/* Skills filter button */}
      <div className="flex items-center gap-2">
        <div className="h-9 w-32 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

// Portfolio-specific controls skeleton
export function PortfolioFiltersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Sort and filter buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-14 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-9 w-28 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-9 w-28 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-9 w-20 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}

// News-specific filters skeleton
export function NewsFiltersSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Row 1: Type, Category */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-10 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-10 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
      {/* Row 2: Search + Count */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 h-10 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-5 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}

// News item skeleton (matches NewsGrid item layout)
export function NewsItemSkeleton() {
  return (
    <div className="animate-pulse p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex items-center gap-3">
            <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-5 w-14 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Blog article skeleton (matches blog list item layout)
export function BlogArticleSkeleton() {
  return (
    <article className="animate-pulse">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-2 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <div className="h-7 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800 mt-1 mb-2" />
      <div className="h-5 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
    </article>
  );
}

// Candidate card skeleton (matches CandidateCard layout)
export function CandidateCardSkeleton() {
  return (
    <div className="animate-pulse p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
      {/* Header - centered */}
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Profile image */}
        <div className="w-14 h-14 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="space-y-2 w-full">
          <div className="h-5 w-32 mx-auto rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-40 mx-auto rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="flex items-center justify-center gap-1.5">
            <div className="h-5 w-24 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
      {/* Bio */}
      <div className="mt-3 space-y-2">
        <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-3/4 mx-auto rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      {/* Meta */}
      <div className="mt-3 flex justify-center gap-3">
        <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
      {/* Skills */}
      <div className="mt-3 flex justify-center gap-1">
        <div className="h-6 w-16 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-6 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-6 w-14 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>
      {/* View Details button */}
      <div className="mt-4 h-10 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      {/* Contact section */}
      <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex justify-center gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-9 h-9 rounded bg-neutral-200 dark:bg-neutral-800" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Investment card skeleton (matches InvestmentCard layout)
export function InvestmentCardSkeleton() {
  return (
    <div className="animate-pulse p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
      {/* Header with logo */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
        </div>
      </div>
      {/* Categories */}
      <div className="mt-3 flex flex-wrap gap-1">
        <div className="h-5 w-16 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-5 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>
      {/* Links */}
      <div className="mt-3 flex items-center gap-2">
        <div className="h-8 w-8 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-8 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-8 rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
