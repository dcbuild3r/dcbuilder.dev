"use client";

import { useState } from "react";

// Icons as components for reuse
const SearchIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SortIcon = ({ direction, active }: { direction: "asc" | "desc"; active: boolean }) => (
  active ? (
    <svg className={`w-4 h-4 transition-transform ${direction === "asc" ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ) : (
    <span className="text-neutral-400">↕</span>
  )
);

// Searchable column header with text input
interface SearchableHeaderProps {
  label: string;
  searchKey: string;
  isActive: boolean;
  searchValue: string;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onSearchChange: (value: string) => void;
  // Optional sorting
  sortable?: boolean;
  sortActive?: boolean;
  sortDirection?: "asc" | "desc";
  onSort?: () => void;
  align?: "left" | "center" | "right";
  className?: string;
}

export function SearchableHeader({
  label,
  isActive,
  searchValue,
  onSearchOpen,
  onSearchClose,
  onSearchChange,
  sortable,
  sortActive,
  sortDirection = "desc",
  onSort,
  align = "left",
  className = "",
}: SearchableHeaderProps) {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  const justifyClass =
    align === "center" ? "justify-center" : align === "right" ? "justify-end" : "";
  if (isActive) {
    return (
      <th className={`px-4 py-3 ${alignClass} text-sm font-medium whitespace-nowrap ${className}`}>
        <div className={`flex items-center gap-2 ${justifyClass}`}>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="w-full px-2 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700"
            autoFocus
          />
          <button
            onClick={onSearchClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <CloseIcon />
          </button>
        </div>
      </th>
    );
  }

  return (
    <th className={`px-4 py-3 ${alignClass} text-sm font-medium whitespace-nowrap ${className}`}>
      <div className={`flex items-center gap-1 ${justifyClass}`}>
        {sortable && onSort ? (
          <button
            className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white"
            onClick={onSort}
          >
            <span>{label}</span>
            <SortIcon direction={sortDirection} active={!!sortActive} />
          </button>
        ) : (
          <span>{label}</span>
        )}
        <button
          onClick={onSearchOpen}
          className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          title={`Search by ${label.toLowerCase()}`}
        >
          <SearchIcon />
        </button>
      </div>
    </th>
  );
}

// Multi-select filter column header
interface MultiSelectHeaderProps {
  label: string;
  filterKey: string;
  options: string[];
  selectedValues: string[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelectionChange: (values: string[]) => void;
  // Optional sorting
  sortable?: boolean;
  sortActive?: boolean;
  sortDirection?: "asc" | "desc";
  onSort?: () => void;
  // Display options
  formatOption?: (option: string) => string;
  className?: string;
}

export function MultiSelectHeader({
  label,
  options,
  selectedValues,
  isOpen,
  onToggle,
  onClose,
  onSelectionChange,
  sortable,
  sortActive,
  sortDirection = "desc",
  onSort,
  formatOption = (o) => o,
  className = "",
}: MultiSelectHeaderProps) {
  const handleCheck = (option: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, option]);
    } else {
      onSelectionChange(selectedValues.filter((v) => v !== option));
    }
  };

  return (
    <th className={`px-4 py-3 text-left text-sm font-medium whitespace-nowrap relative ${className}`}>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 z-10 min-w-32 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-500">Filter by {label.toLowerCase()}</span>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <CloseIcon />
            </button>
          </div>
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2 py-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 px-1 rounded"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={(e) => handleCheck(option, e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{formatOption(option)}</span>
            </label>
          ))}
          {selectedValues.length > 0 && (
            <button
              onClick={() => onSelectionChange([])}
              className="text-xs text-blue-600 hover:text-blue-700 mt-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-1">
        {sortable && onSort ? (
          <button
            className={`flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white ${sortActive ? "text-blue-600 dark:text-blue-400" : ""}`}
            onClick={onSort}
          >
            <span>{label}</span>
            <SortIcon direction={sortDirection} active={!!sortActive} />
          </button>
        ) : (
          <span>{label}</span>
        )}
        {selectedValues.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 rounded-full">
            {selectedValues.length}
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          title={`Filter by ${label.toLowerCase()}`}
        >
          <FilterIcon />
        </button>
      </div>
    </th>
  );
}

// Searchable multi-select filter (for large option sets like tags)
interface SearchableMultiSelectHeaderProps {
  label: string;
  filterKey: string;
  options: string[];
  selectedValues: string[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelectionChange: (values: string[]) => void;
  // Optional sorting
  sortable?: boolean;
  sortActive?: boolean;
  sortDirection?: "asc" | "desc";
  onSort?: () => void;
  // Display options
  formatOption?: (option: string) => string;
  className?: string;
}

export function SearchableMultiSelectHeader({
  label,
  options,
  selectedValues,
  isOpen,
  onToggle,
  onClose,
  onSelectionChange,
  sortable,
  sortActive,
  sortDirection = "desc",
  onSort,
  formatOption = (o) => o,
  className = "",
}: SearchableMultiSelectHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCheck = (option: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, option]);
    } else {
      onSelectionChange(selectedValues.filter((v) => v !== option));
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <th className={`px-4 py-3 text-left text-sm font-medium whitespace-nowrap relative ${className}`}>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 z-10 min-w-48 max-h-80 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-500">Filter by {label.toLowerCase()}</span>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <CloseIcon />
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="w-full px-2 py-1.5 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 mb-2"
            autoFocus
          />
          <div className="overflow-y-auto flex-1 max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="text-sm text-neutral-400 py-2 text-center">
                No matches found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-2 py-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 px-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option)}
                    onChange={(e) => handleCheck(option, e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm truncate">{formatOption(option)}</span>
                </label>
              ))
            )}
          </div>
          {selectedValues.length > 0 && (
            <button
              onClick={() => onSelectionChange([])}
              className="text-xs text-blue-600 hover:text-blue-700 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700"
            >
              Clear all ({selectedValues.length})
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-1">
        {sortable && onSort ? (
          <button
            className={`flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white ${sortActive ? "text-blue-600 dark:text-blue-400" : ""}`}
            onClick={onSort}
          >
            <span>{label}</span>
            <SortIcon direction={sortDirection} active={!!sortActive} />
          </button>
        ) : (
          <span>{label}</span>
        )}
        {selectedValues.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 rounded-full">
            {selectedValues.length}
          </span>
        )}
        <button
          onClick={onToggle}
          className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          title={`Filter by ${label.toLowerCase()}`}
        >
          <FilterIcon />
        </button>
      </div>
    </th>
  );
}

// Sortable column header (no search/filter)
interface SortableHeaderProps {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onSort: () => void;
  center?: boolean;
  className?: string;
}

export function SortableHeader({
  label,
  active,
  direction,
  onSort,
  center,
  className = "",
}: SortableHeaderProps) {
  return (
    <th
      className={`px-4 py-3 text-sm font-medium cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 select-none ${center ? "text-center" : "text-left"} ${className}`}
      onClick={onSort}
    >
      <div className={`flex items-center gap-1 ${center ? "justify-center" : ""}`}>
        <span>{label}</span>
        <SortIcon direction={direction} active={active} />
      </div>
    </th>
  );
}

// Hook to manage column filter state
export function useColumnFilters() {
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const openSearch = (column: string) => {
    setActiveColumn(column);
    setSearchValue("");
  };

  const closeSearch = () => {
    setActiveColumn(null);
    setSearchValue("");
  };

  const toggleFilter = (column: string) => {
    setActiveColumn(activeColumn === column ? null : column);
  };

  return {
    activeColumn,
    searchValue,
    setSearchValue,
    openSearch,
    closeSearch,
    toggleFilter,
    isActive: (column: string) => activeColumn === column,
  };
}
