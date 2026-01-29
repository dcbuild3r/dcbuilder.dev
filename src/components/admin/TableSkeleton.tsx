"use client";

import { ReactNode } from "react";

// Icons matching the real column filter icons
const SearchIcon = () => (
  <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const SortIcon = () => (
  <span className="text-neutral-400">↕</span>
);

// Header definition can be a simple string or object with more control
interface HeaderDef {
  label: string;
  className?: string;
  align?: "left" | "center" | "right";
  width?: string;
  // Show placeholder icons to prevent layout shift
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
}

interface TableSkeletonProps {
  // Can pass headers as strings, HeaderDef objects, or raw ReactNodes
  headers: (string | HeaderDef | ReactNode)[];
  rows?: number;
  headerColor?: string;
  rowHeight?: string;
  headerHeight?: string;
  // Column widths for skeleton bars (percentages)
  columnWidths?: number[];
}

// Fixed widths for skeleton bars to avoid randomness causing layout shifts
const defaultSkeletonWidths = [75, 60, 85, 70, 55, 80, 65, 90, 50, 72];

function renderHeader(header: string | HeaderDef | ReactNode, index: number): ReactNode {
  // String header
  if (typeof header === "string") {
    return (
      <th key={index} className="px-4 py-3 text-left text-sm font-medium">
        <span>{header}</span>
      </th>
    );
  }

  // HeaderDef object
  if (header && typeof header === "object" && "label" in header) {
    const def = header as HeaderDef;
    const alignClass = def.align === "right" ? "text-right" : def.align === "center" ? "text-center" : "text-left";
    const justifyClass = def.align === "right" ? "justify-end" : def.align === "center" ? "justify-center" : "";

    // Render with icons if any are specified
    const hasIcons = def.sortable || def.searchable || def.filterable;

    return (
      <th
        key={index}
        className={`px-4 py-3 text-sm font-medium ${alignClass} ${def.className || ""}`}
        style={def.width ? { width: def.width } : undefined}
      >
        {hasIcons ? (
          <div className={`flex items-center gap-1 ${justifyClass}`}>
            <span>{def.label}</span>
            {def.sortable && <SortIcon />}
            {def.searchable && <span className="p-1"><SearchIcon /></span>}
            {def.filterable && <span className="p-1"><FilterIcon /></span>}
          </div>
        ) : (
          def.label
        )}
      </th>
    );
  }

  // Raw ReactNode (for custom headers)
  return header;
}

export function TableSkeleton({
  headers,
  rows = 8,
  headerColor = "bg-neutral-100 dark:bg-neutral-800",
  rowHeight = "h-[60px]",
  headerHeight = "h-[48px]",
  columnWidths,
}: TableSkeletonProps) {
  const widths = columnWidths || defaultSkeletonWidths;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <table className="w-full">
        <thead className={headerColor}>
          <tr className={headerHeight}>
            {headers.map((header, i) => renderHeader(header, i))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className={rowHeight}>
              {headers.map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <div
                    className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"
                    style={{ width: `${widths[(rowIndex + colIndex) % widths.length]}%` }}
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

// Skeleton rows to use inside an existing table - prevents header DOM changes
interface SkeletonRowsProps {
  columns: number;
  rows?: number;
  rowHeight?: string;
}

const defaultWidths = [75, 60, 85, 70, 55, 80, 65, 90, 50, 72];

export function SkeletonRows({ columns, rows = 8, rowHeight = "h-[60px]" }: SkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className={rowHeight}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div
                className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse"
                style={{ width: `${defaultWidths[(rowIndex + colIndex) % defaultWidths.length]}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// Re-export from admin-utils for backwards compatibility
export { withMinDelay, MIN_LOADING_DELAY } from "@/lib/admin-utils";
