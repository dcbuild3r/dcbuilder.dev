"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Job, RelationshipCategory } from "@/data/jobs";

type FilterCategory = "all" | RelationshipCategory;

interface JobsGridProps {
	jobs: Job[];
}

export function JobsGrid({ jobs }: JobsGridProps) {
	const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const filteredJobs = useMemo(() => {
		return jobs.filter((job) => {
			// Category filter
			if (
				filterCategory !== "all" &&
				job.company.category !== filterCategory
			) {
				return false;
			}

			// Search filter (title, company name, location)
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				const searchableText = [
					job.title,
					job.company.name,
					job.location,
					job.department,
				]
					.filter(Boolean)
					.join(" ")
					.toLowerCase();
				if (!searchableText.includes(query)) {
					return false;
				}
			}

			return true;
		});
	}, [jobs, filterCategory, searchQuery]);

	// Sort: featured first, then alphabetically by company
	const sortedJobs = useMemo(() => {
		return [...filteredJobs].sort((a, b) => {
			if (a.featured !== b.featured) return a.featured ? -1 : 1;
			return a.company.name.localeCompare(b.company.name);
		});
	}, [filteredJobs]);

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="flex flex-wrap items-center gap-4">
				{/* Category Filter */}
				<div className="flex items-center gap-2">
					<label
						htmlFor="category-filter"
						className="text-sm text-neutral-600 dark:text-neutral-400"
					>
						Show:
					</label>
					<select
						id="category-filter"
						value={filterCategory}
						onChange={(e) =>
							setFilterCategory(e.target.value as FilterCategory)
						}
						className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
					>
						<option value="all">All Companies</option>
						<option value="portfolio">Portfolio</option>
						<option value="network">Network</option>
					</select>
				</div>

				{/* Search */}
				<div className="flex-1 min-w-[200px]">
					<input
						type="text"
						placeholder="Search jobs..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
					/>
				</div>

				{/* Results count */}
				<span className="text-sm text-neutral-500">
					{sortedJobs.length} {sortedJobs.length === 1 ? "job" : "jobs"}
				</span>
			</div>

			{/* Jobs List */}
			<div className="space-y-4">
				{sortedJobs.length === 0 ? (
					<p className="text-center py-8 text-neutral-500">
						No jobs found matching your criteria.
					</p>
				) : (
					sortedJobs.map((job) => (
						<a
							key={job.id}
							href={job.link}
							target="_blank"
							rel="noopener noreferrer"
							className="group block p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
						>
							<div className="flex items-start gap-4">
								{/* Company Logo */}
								<div className="w-12 h-12 flex-shrink-0 flex items-center justify-center">
									<Image
										src={job.company.logo}
										alt={job.company.name}
										width={48}
										height={48}
										className="object-contain bg-white rounded-lg p-1 group-hover:scale-105 transition-transform"
									/>
								</div>

								{/* Job Details */}
								<div className="flex-1 min-w-0">
									<div className="flex items-start justify-between gap-2">
										<div>
											<h3 className="font-semibold group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
												{job.title}
												{job.featured && (
													<span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
														★
													</span>
												)}
											</h3>
											<p className="text-sm text-neutral-600 dark:text-neutral-400">
												{job.company.name}
											</p>
										</div>
										<span
											className={`flex-shrink-0 px-2 py-0.5 text-xs rounded-full ${
												job.company.category === "portfolio"
													? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
													: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
											}`}
										>
											{job.company.category === "portfolio"
												? "Portfolio"
												: "Network"}
										</span>
									</div>

									{/* Meta info */}
									<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
										<span>{job.location}</span>
										{job.type && (
											<span className="capitalize">
												{job.type.replace("-", " ")}
											</span>
										)}
										{job.department && <span>{job.department}</span>}
										{job.salary && <span>{job.salary}</span>}
									</div>
								</div>
							</div>
						</a>
					))
				)}
			</div>
		</div>
	);
}
