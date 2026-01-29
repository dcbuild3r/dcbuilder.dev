"use client";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  headerColor?: string;
  rowHeight?: string;
  headerHeight?: string;
}

// Fixed widths for skeleton bars to avoid randomness causing layout shifts
const skeletonWidths = [75, 60, 85, 70, 55, 80, 65, 90, 50, 72];

export function TableSkeleton({
  columns,
  rows = 8,
  headerColor = "bg-neutral-100 dark:bg-neutral-800",
  rowHeight = "h-[60px]",
  headerHeight = "h-[48px]"
}: TableSkeletonProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <table className="w-full">
        <thead className={headerColor}>
          <tr className={headerHeight}>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="h-4 bg-neutral-200/60 dark:bg-neutral-700/60 rounded animate-pulse w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className={rowHeight}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <div
                    className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse"
                    style={{ width: `${skeletonWidths[(rowIndex + colIndex) % skeletonWidths.length]}%` }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr className="animate-pulse h-[60px]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// Re-export from admin-utils for backwards compatibility
export { withMinDelay, MIN_LOADING_DELAY } from "@/lib/admin-utils";
