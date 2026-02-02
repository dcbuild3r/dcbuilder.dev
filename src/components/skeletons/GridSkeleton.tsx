/**
 * Reusable skeleton loading components for grids and cards.
 * Also includes static filter components that render immediately while data loads.
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

// ============================================================================
// Static Filter Components (render immediately, no data dependency)
// ============================================================================

/**
 * Static select component that matches CustomSelect styling
 * Used in loading states to show filter UI immediately
 */
function StaticSelect({
  label,
  placeholder,
  className = "",
}: {
  label: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
        {label}
      </label>
      <div className={`relative ${className}`}>
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-400 dark:text-neutral-500 cursor-default min-w-[120px]">
          <span className="truncate">{placeholder}</span>
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Static search input that's fully functional (no data dependency)
 */
function StaticSearchInput({ placeholder = "Search..." }: { placeholder?: string }) {
  return (
    <div className="flex-1 relative">
      <input
        type="text"
        placeholder={placeholder}
        disabled
        className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 cursor-default"
      />
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}

/**
 * Static button component for filter toggles
 */
function StaticButton({
  children,
  active = false,
  className = "",
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors cursor-default ${
        active
          ? "bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"
          : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Jobs Page Static Filters
// ============================================================================

export function JobsFiltersStatic() {
  return (
    <div className="space-y-4">
      {/* Row 1: Affiliation, Role, Company */}
      <div className="flex flex-col sm:flex-row gap-3">
        <StaticSelect label="Affiliation:" placeholder="All" className="sm:min-w-[120px]" />
        <StaticSelect label="Role:" placeholder="All Roles" className="sm:min-w-[140px]" />
        <StaticSelect label="Company:" placeholder="All Companies" className="sm:min-w-[160px]" />
      </div>

      {/* Row 2: Location and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <StaticSelect label="Location:" placeholder="All Locations" className="sm:min-w-[160px]" />
        <StaticSearchInput placeholder="Search jobs..." />
      </div>

      {/* Results count placeholder */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-400 dark:text-neutral-500">
          Loading jobs...
        </span>
      </div>

      {/* Tag Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <StaticButton>
          <span className="flex items-center gap-2">
            <span className="text-amber-500">★</span>
            <span>Featured only</span>
          </span>
        </StaticButton>
        <StaticButton>
          <span className="flex items-center gap-2">
            <span>Filter by tags</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </StaticButton>
      </div>
    </div>
  );
}

// ============================================================================
// Candidates Page Static Filters
// ============================================================================

export function CandidatesFiltersStatic() {
  return (
    <div className="space-y-4">
      {/* Row 1: Status, Experience, Looking For */}
      <div className="flex flex-col sm:flex-row gap-3">
        <StaticSelect label="Status:" placeholder="All Statuses" className="sm:min-w-[160px]" />
        <StaticSelect label="Experience:" placeholder="All Levels" className="sm:min-w-[140px]" />
        <StaticSelect label="Looking For:" placeholder="All Roles" className="sm:min-w-[140px]" />
      </div>

      {/* Row 2: Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <StaticSearchInput placeholder="Search candidates..." />
        <span className="text-sm text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
          Loading candidates...
        </span>
      </div>

      {/* Skills filter button */}
      <div className="flex items-center gap-2">
        <StaticButton>
          <span className="flex items-center gap-2">
            <span>Filter by skills</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </StaticButton>
      </div>
    </div>
  );
}

// ============================================================================
// Portfolio Page Static Filters
// ============================================================================

export function PortfolioFiltersStatic() {
  return (
    <div className="space-y-6">
      {/* Sort and filter buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600 dark:text-neutral-400">
            Sort by:
          </label>
          <select
            disabled
            className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 cursor-default"
            defaultValue="relevance"
          >
            <option value="relevance">Relevance</option>
            <option value="alphabetical">A → Z</option>
            <option value="alphabetical-desc">Z → A</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <StaticButton active>Main</StaticButton>
          <StaticButton>Featured</StaticButton>
          <StaticButton>All</StaticButton>
        </div>
      </div>

      {/* Category filters - show loading placeholder */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          Categories:
        </span>
        <div className="flex flex-wrap gap-2">
          {/* Skeleton category pills */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse"
              style={{ width: `${60 + (i % 3) * 20}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// News Page Static Filters
// ============================================================================

export function NewsFiltersStatic() {
  return (
    <div className="space-y-4">
      {/* Row 1: Type, Category */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
            Type:
          </label>
          <select
            disabled
            className="px-3 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 cursor-default min-w-[140px]"
            defaultValue="all"
          >
            <option value="all">All</option>
            <option value="blog">Blog Posts</option>
            <option value="curated">Curated Links</option>
            <option value="announcement">Announcements</option>
          </select>
        </div>
        <StaticSelect label="Category:" placeholder="All Categories" className="sm:min-w-[140px]" />
      </div>

      {/* Row 2: Search + Count */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <StaticSearchInput placeholder="Search news..." />
        <span className="text-sm text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
          Loading news...
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// Legacy Skeleton Components (kept for backwards compatibility)
// ============================================================================

// Generic filter row skeleton (legacy - use static versions instead)
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

// Jobs-specific filters skeleton (legacy)
export function JobsFiltersSkeleton() {
  return <JobsFiltersStatic />;
}

// Candidates-specific filters skeleton (legacy)
export function CandidatesFiltersSkeleton() {
  return <CandidatesFiltersStatic />;
}

// Portfolio-specific controls skeleton (legacy)
export function PortfolioFiltersSkeleton() {
  return <PortfolioFiltersStatic />;
}

// News-specific filters skeleton (legacy)
export function NewsFiltersSkeleton() {
  return <NewsFiltersStatic />;
}

// ============================================================================
// Card/Item Skeletons (for actual data loading)
// ============================================================================

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

// Job card skeleton (matches JobsGrid job item layout)
export function JobCardSkeleton() {
  return (
    <div className="animate-pulse p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Company Logo */}
        <div className="w-full sm:w-auto flex justify-center sm:justify-start">
          <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        </div>
        {/* Job Details */}
        <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
          <div className="h-5 w-3/4 mx-auto sm:mx-0 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-4 w-1/2 mx-auto sm:mx-0 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-2/3 mx-auto sm:mx-0 rounded bg-neutral-200 dark:bg-neutral-800" />
          {/* Tags */}
          <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-1">
            <div className="h-6 w-16 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-6 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          </div>
          {/* Buttons */}
          <div className="mt-3 flex items-center justify-center sm:justify-end gap-2">
            <div className="h-9 w-24 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-9 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
