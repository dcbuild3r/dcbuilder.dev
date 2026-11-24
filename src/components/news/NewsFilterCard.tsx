"use client";

import { categoryLabels, type NewsCategory } from "@/data/news";
import { CustomSelect } from "@/components/CustomSelect";
import { CloseIcon } from "@/components/ui/icons";
import { fieldClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
	sortModeLabels,
	typeLabels,
	type NewsSortMode,
	type NewsType,
} from "@/lib/news-filtering";

const pillSelect = "min-h-12 rounded-full border-transparent bg-surface-2 px-4 text-sm font-medium text-ink";

export interface NewsFilterCardProps {
	typeFilter: NewsType;
	onTypeChange: (value: NewsType) => void;
	categoryFilter: "all" | NewsCategory;
	onCategoryChange: (value: "all" | NewsCategory) => void;
	categories: NewsCategory[];
	sortMode: NewsSortMode;
	onSortChange: (value: NewsSortMode) => void;
	minimumRelevance: number;
	onRelevanceChange: (value: number) => void;
	searchQuery: string;
	onSearchChange: (value: string) => void;
	hidePortfolioUpdates: boolean;
	onHidePortfolioChange: (value: boolean) => void;
	itemCount: number;
	companyFilter: string;
	companyClearHref: string;
}

export function NewsFilterCard({
	typeFilter,
	onTypeChange,
	categoryFilter,
	onCategoryChange,
	categories,
	sortMode,
	onSortChange,
	minimumRelevance,
	onRelevanceChange,
	searchQuery,
	onSearchChange,
	hidePortfolioUpdates,
	onHidePortfolioChange,
	itemCount,
	companyFilter,
	companyClearHref,
}: NewsFilterCardProps) {
	return (
		<div>
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative flex min-w-0 flex-[1_1_320px]">
					<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-[18px] top-[15px] size-[18px] text-muted">
						<circle cx="11" cy="11" r="7" />
						<path d="M20 20l-3.5-3.5" />
					</svg>
					<input
						type="text"
						aria-label="Search news"
						placeholder="Search news"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className={cn(fieldClass, "min-h-12 w-full rounded-full border-transparent bg-surface-2 pl-[46px] pr-11 text-[15px]")}
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => onSearchChange("")}
							className="absolute right-0 top-0.5 flex size-11 items-center justify-center text-muted hover:text-ink"
							aria-label="Clear search"
						>
							<CloseIcon className="size-4" />
						</button>
					)}
				</div>
				<label htmlFor="category-filter" className="sr-only">Category</label>
				<CustomSelect
					id="category-filter"
					value={categoryFilter}
					onChange={(value) => onCategoryChange(value as "all" | NewsCategory)}
					options={[
						{ value: "all", label: "All categories" },
						...categories.map((category) => ({ value: category, label: categoryLabels[category] })),
					]}
					className="min-w-40"
					triggerClassName={pillSelect}
				/>
				<label htmlFor="sort-mode" className="sr-only">Order</label>
				<CustomSelect
					id="sort-mode"
					value={sortMode}
					onChange={(value) => onSortChange(value as NewsSortMode)}
					options={Object.entries(sortModeLabels).map(([value, label]) => ({ value, label }))}
					className="min-w-44"
					triggerClassName={pillSelect}
				/>
			</div>

			<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
				<div role="group" aria-label="Type" className="flex flex-wrap gap-1.5">
					{(Object.keys(typeLabels) as NewsType[]).map((value) => (
						<button
							key={value}
							type="button"
							aria-pressed={typeFilter === value}
							onClick={() => onTypeChange(value)}
							className={cn(
								"min-h-11 rounded-full px-4 text-sm transition-colors",
								typeFilter === value
									? "bg-inverse font-semibold text-inverse-ink"
									: "bg-surface-2 font-medium text-body hover:bg-line",
							)}
						>
							{typeLabels[value]}
						</button>
					))}
				</div>
				<p className="font-mono text-xs text-muted">
					{itemCount} {itemCount === 1 ? "item" : "items"}
				</p>
			</div>

			<div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
				<div className="flex min-h-11 items-center gap-2.5 rounded-full bg-surface-2 pl-4 pr-2 text-sm text-body">
					<label htmlFor="relevance-filter" className="whitespace-nowrap">Relevance</label>
					<input
						id="relevance-filter"
						type="range"
						min={0}
						max={10}
						step={1}
						value={minimumRelevance}
						onChange={(event) => onRelevanceChange(Number(event.target.value))}
						aria-valuetext={minimumRelevance === 0 ? "All" : `${minimumRelevance} and up`}
						className="thin-range w-24"
					/>
					<span className="min-w-9 rounded-full bg-surface px-2 py-0.5 text-center text-xs font-medium text-body">
						{minimumRelevance === 0 ? "All" : `${minimumRelevance}+`}
					</span>
				</div>

				<label className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm text-body">
					<span className="whitespace-nowrap">Hide portfolio updates</span>
					<input
						type="checkbox"
						checked={hidePortfolioUpdates}
						onChange={(event) => onHidePortfolioChange(event.target.checked)}
						className="peer sr-only"
					/>
					<span
						aria-hidden="true"
						className="relative h-5 w-9 rounded-full bg-line-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-surface after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-4 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
					/>
				</label>
			</div>

			{companyFilter && (
				<div className="mt-2 flex flex-wrap items-center gap-2">
					<span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-body">
						Company: {companyFilter}
					</span>
					<a
						href={companyClearHref}
						className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-medium text-accent hover:text-accent-ink"
					>
						Clear
					</a>
				</div>
			)}
		</div>
	);
}
