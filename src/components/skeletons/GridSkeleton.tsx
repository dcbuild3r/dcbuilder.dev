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
        <CardSkeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

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
