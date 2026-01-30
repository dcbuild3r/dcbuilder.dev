"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Combobox, MultiCombobox } from "@/components/admin/Combobox";
import { ImageInput } from "@/components/admin/ImagePreview";
import { MultiSelectHeader, SearchableMultiSelectHeader, useColumnFilters } from "@/components/admin/ColumnFilters";
import { getSkillColor } from "@/lib/skill-colors";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { getAdminApiKey, adminFetch, withMinDelay } from "@/lib/admin-utils";
import { StarToggle, HotToggle, EditButton, DeleteButton, TableImage, ErrorAlert } from "@/components/admin/ActionButtons";
import { ADMIN_THEMES } from "@/lib/admin-themes";

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  link: string;
  location: string | null;
  remote: string | null;
  type: string | null;
  salary: string | null;
  department: string | null;
  tags: string[] | null;
  category: string;
  featured: boolean | null;
  description: string | null;
  companyWebsite: string | null;
  companyX: string | null;
  companyGithub: string | null;
  createdAt: string;
}

const emptyJob: Partial<Job> = {
  title: "",
  company: "",
  companyLogo: "",
  link: "",
  location: "",
  remote: "",
  type: "full-time",
  salary: "",
  department: "",
  tags: [],
  category: "portfolio",
  featured: false,
  description: "",
  companyWebsite: "",
  companyX: "",
  companyGithub: "",
};

type SortField = "title" | "company" | "category" | "clicks" | "createdAt" | null;
type SortDirection = "asc" | "desc";

interface SearchableSortHeaderProps {
  field: SortField;
  searchKey: string;
  children: React.ReactNode;
  sortField: SortField;
  sortDirection: SortDirection;
  columnSearch: string | null;
  columnSearchValue: string;
  onSort: (field: SortField) => void;
  onColumnSearchChange: (value: string) => void;
  onOpenSearch: () => void;
  onClearSearch: () => void;
}

function SearchableSortHeader({
  field,
  searchKey,
  children,
  sortField,
  sortDirection,
  columnSearch,
  columnSearchValue,
  onSort,
  onColumnSearchChange,
  onOpenSearch,
  onClearSearch,
}: SearchableSortHeaderProps) {
  return (
    <th className="px-4 py-3 text-left text-sm font-medium">
      {columnSearch === searchKey ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={columnSearchValue}
            onChange={(e) => onColumnSearchChange(e.target.value)}
            placeholder={`Search ${searchKey}...`}
            className="w-full px-2 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700"
            autoFocus
          />
          <button
            onClick={onClearSearch}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button
            className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white"
            onClick={() => onSort(field)}
          >
            {children}
            <span className="text-neutral-400">
              {sortField === field ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSearch();
            }}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            title={`Search by ${searchKey}`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      )}
    </th>
  );
}

export default function AdminJobs() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [jobClicks, setJobClicks] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<SortField>("clicks");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [columnSearch, setColumnSearch] = useState<string | null>(null);
  const [columnSearchValue, setColumnSearchValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [featuredFilter, setFeaturedFilter] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const columnFilters = useColumnFilters();
  const theme = ADMIN_THEMES.jobs;

  const categoryOptions = ["portfolio", "network"];
  const featuredOptions = ["yes", "no"];
  // Get unique tags from all jobs
  const tagOptions = [...new Set(jobs.flatMap(j => j.tags || []).filter(Boolean))];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const fetchJobs = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await withMinDelay(
      adminFetch<Job[]>("/api/v1/jobs?limit=500")
    );
    if (fetchError) {
      setError(fetchError);
    } else {
      setJobs(data || []);
    }
    setLoading(false);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    const { data } = await adminFetch<Record<string, number>>("/api/v1/admin/analytics?type=jobs", {
      headers: { "x-api-key": getAdminApiKey() },
    });
    if (data) {
      setJobClicks(data);
    }
    // Analytics failures are non-critical, no error state needed
  }, []);

  useEffect(() => {
    document.title = "Admin | dcbuilder.eth";
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchAnalytics();
  }, [fetchJobs, fetchAnalytics]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingJob(emptyJob);
      setIsNew(true);
      setTagsInput("");
    }
  }, [searchParams]);

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setIsNew(false);
    setTagsInput((job.tags || []).join(", "));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;

    const { error: deleteError } = await adminFetch(`/api/v1/jobs/${id}`, {
      method: "DELETE",
      headers: { "x-api-key": getAdminApiKey() },
    });
    if (deleteError) {
      setError(deleteError);
    } else {
      setJobs(jobs.filter((j) => j.id !== id));
    }
  };

  const handleToggleFeatured = async (job: Job) => {
    const { error: toggleError } = await adminFetch(`/api/v1/jobs/${job.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({ featured: !job.featured }),
    });
    if (toggleError) {
      setError(toggleError);
    } else {
      setJobs(jobs.map((j) => (j.id === job.id ? { ...j, featured: !j.featured } : j)));
    }
  };

  const handleToggleHot = async (job: Job) => {
    const currentTags = job.tags || [];
    const hasHot = currentTags.includes("hot");
    const newTags = hasHot
      ? currentTags.filter((t) => t !== "hot")
      : [...currentTags, "hot"];

    const { error: toggleError } = await adminFetch(`/api/v1/jobs/${job.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({ tags: newTags }),
    });
    if (toggleError) {
      setError(toggleError);
    } else {
      setJobs(jobs.map((j) => (j.id === job.id ? { ...j, tags: newTags } : j)));
    }
  };

  const handleSave = async () => {
    if (!editingJob) return;
    setSaving(true);

    const jobData = {
      ...editingJob,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const url = isNew ? "/api/v1/jobs" : `/api/v1/jobs/${editingJob.id}`;
    const method = isNew ? "POST" : "PUT";

    const { error: saveError } = await adminFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify(jobData),
    });

    if (saveError) {
      setError(saveError);
    } else {
      await fetchJobs();
      setEditingJob(null);
      setIsNew(false);
    }
    setSaving(false);
  };

  const filteredJobs = jobs
    .filter((job) => {
      // Global search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!job.title.toLowerCase().includes(query) && !job.company.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Column-specific search
      if (columnSearch && columnSearchValue) {
        const value = columnSearchValue.toLowerCase();
        if (columnSearch === "title" && !job.title.toLowerCase().includes(value)) return false;
        if (columnSearch === "company" && !job.company.toLowerCase().includes(value)) return false;
      }
      // Category multi-select filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(job.category)) {
        return false;
      }
      // Tags multi-select filter
      if (tagsFilter.length > 0) {
        const jobTags = job.tags || [];
        if (!tagsFilter.some(tag => jobTags.includes(tag))) {
          return false;
        }
      }
      // Featured filter
      if (featuredFilter.length > 0) {
        const isFeatured = job.featured === true;
        const wantFeatured = featuredFilter.includes("yes");
        const wantNotFeatured = featuredFilter.includes("no");
        if (wantFeatured && !wantNotFeatured && !isFeatured) return false;
        if (wantNotFeatured && !wantFeatured && isFeatured) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "title":
          return dir * a.title.localeCompare(b.title);
        case "company":
          return dir * a.company.localeCompare(b.company);
        case "category":
          return dir * a.category.localeCompare(b.category);
        case "clicks":
          return dir * ((jobClicks[a.id] || 0) - (jobClicks[b.id] || 0));
        case "createdAt":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default:
          return 0;
      }
    });

  if (editingJob) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isNew ? "Add New Job" : "Edit Job"}
          </h1>
          <button
            onClick={() => {
              setEditingJob(null);
              setIsNew(false);
            }}
            className="text-neutral-500 hover:text-neutral-700"
          >
            Cancel
          </button>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={editingJob.title || ""}
                onChange={(e) =>
                  setEditingJob({ ...editingJob, title: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Company *
              </label>
              <Combobox
                value={editingJob.company || ""}
                onChange={(value) =>
                  setEditingJob({ ...editingJob, company: value })
                }
                field="company"
                placeholder="Start typing to see suggestions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Job Link *
              </label>
              <input
                type="url"
                value={editingJob.link || ""}
                onChange={(e) =>
                  setEditingJob({ ...editingJob, link: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                value={editingJob.category || "portfolio"}
                onChange={(e) =>
                  setEditingJob({ ...editingJob, category: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value="portfolio">Portfolio</option>
                <option value="network">Network</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Combobox
                value={editingJob.location || ""}
                onChange={(value) =>
                  setEditingJob({ ...editingJob, location: value })
                }
                field="location"
                placeholder="Start typing to see suggestions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Remote</label>
              <select
                value={editingJob.remote || ""}
                onChange={(e) =>
                  setEditingJob({ ...editingJob, remote: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value="">Not specified</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={editingJob.type || ""}
                onChange={(e) =>
                  setEditingJob({ ...editingJob, type: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value="">Not specified</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Salary</label>
              <input
                type="text"
                value={editingJob.salary || ""}
                onChange={(e) =>
                  setEditingJob({ ...editingJob, salary: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                placeholder="e.g., $150k - $200k"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Department
              </label>
              <Combobox
                value={editingJob.department || ""}
                onChange={(value) =>
                  setEditingJob({ ...editingJob, department: value })
                }
                field="department"
                placeholder="Start typing to see suggestions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Tags (comma-separated)
              </label>
              <MultiCombobox
                value={tagsInput}
                onChange={setTagsInput}
                field="tags"
                placeholder="e.g., hot, defi, protocol"
              />
            </div>
            <ImageInput
              label="Company Logo URL"
              value={editingJob.companyLogo || ""}
              onChange={(value) =>
                setEditingJob({ ...editingJob, companyLogo: value })
              }
            />
            <div>
              <label className="block text-sm font-medium mb-1">
                Company Website
              </label>
              <input
                type="url"
                value={editingJob.companyWebsite || ""}
                onChange={(e) =>
                  setEditingJob({
                    ...editingJob,
                    companyWebsite: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Company X (Twitter)
              </label>
              <input
                type="url"
                value={editingJob.companyX || ""}
                onChange={(e) =>
                  setEditingJob({ ...editingJob, companyX: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Company GitHub
              </label>
              <input
                type="url"
                value={editingJob.companyGithub || ""}
                onChange={(e) =>
                  setEditingJob({ ...editingJob, companyGithub: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={editingJob.featured || false}
                onChange={(e) =>
                  setEditingJob({ ...editingJob, featured: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label htmlFor="featured" className="text-sm font-medium">
                Featured
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editingJob.description || ""}
              onChange={(e) =>
                setEditingJob({ ...editingJob, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditingJob(null);
                setIsNew(false);
              }}
              className="px-4 py-2 text-neutral-600 hover:text-neutral-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Job"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Jobs ({jobs.length})</h1>
        <button
          onClick={() => {
            setEditingJob(emptyJob);
            setIsNew(true);
            setTagsInput("");
          }}
          className={`px-4 py-2 ${theme.addButtonBg} text-white rounded-lg font-medium`}
        >
          Add Job
        </button>
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onRetry={() => { setError(null); fetchJobs(); }} />}

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
        />
      </div>

      {/* Jobs Table */}
      {loading ? (
        <TableSkeleton
          headers={[
            "Title",
            { label: "", width: "48px" },
            "Company",
            "Category",
            "Tags",
            { label: "Featured", align: "center" },
            { label: "Actions", align: "right" },
          ]}
          rows={10}
          headerColor="bg-blue-100 dark:bg-blue-900/30"
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-blue-100 dark:bg-blue-900/30">
              <tr>
                <SearchableSortHeader
                  field="title"
                  searchKey="title"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  columnSearch={columnSearch}
                  columnSearchValue={columnSearchValue}
                  onSort={handleSort}
                  onColumnSearchChange={setColumnSearchValue}
                  onOpenSearch={() => {
                    setColumnSearch("title");
                    setColumnSearchValue("");
                  }}
                  onClearSearch={() => {
                    setColumnSearch(null);
                    setColumnSearchValue("");
                  }}
                >
                  Title
                </SearchableSortHeader>
                <th className="px-2 py-3 text-left text-sm font-medium w-12"></th>
                <SearchableSortHeader
                  field="company"
                  searchKey="company"
                  sortField={sortField}
                  sortDirection={sortDirection}
                  columnSearch={columnSearch}
                  columnSearchValue={columnSearchValue}
                  onSort={handleSort}
                  onColumnSearchChange={setColumnSearchValue}
                  onOpenSearch={() => {
                    setColumnSearch("company");
                    setColumnSearchValue("");
                  }}
                  onClearSearch={() => {
                    setColumnSearch(null);
                    setColumnSearchValue("");
                  }}
                >
                  Company
                </SearchableSortHeader>
                <th className="px-4 py-3 text-left text-sm font-medium relative">
                  {columnSearch === "category" ? (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 z-10 min-w-32">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-neutral-500">Filter by category</span>
                        <button
                          onClick={() => setColumnSearch(null)}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      {categoryOptions.map((cat) => (
                        <label key={cat} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 px-1 rounded">
                          <input
                            type="checkbox"
                            checked={categoryFilter.includes(cat)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCategoryFilter([...categoryFilter, cat]);
                              } else {
                                setCategoryFilter(categoryFilter.filter((c) => c !== cat));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{cat}</span>
                        </label>
                      ))}
                      {categoryFilter.length > 0 && (
                        <button
                          onClick={() => setCategoryFilter([])}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <button
                      className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white"
                      onClick={() => handleSort("category")}
                    >
                      <span>Category</span>
                      <span className="text-neutral-400">
                        {sortField === "category" ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}
                      </span>
                    </button>
                    {categoryFilter.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 rounded-full">
                        {categoryFilter.length}
                      </span>
                    )}
                    <button
                      onClick={() => setColumnSearch(columnSearch === "category" ? null : "category")}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      title="Filter by category"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </button>
                  </div>
                </th>
                <SearchableMultiSelectHeader
                  label="Tags"
                  filterKey="tags"
                  options={tagOptions}
                  selectedValues={tagsFilter}
                  isOpen={columnFilters.isActive("tags")}
                  onToggle={() => columnFilters.toggleFilter("tags")}
                  onClose={columnFilters.closeSearch}
                  onSelectionChange={setTagsFilter}
                />
                <MultiSelectHeader
                  label="Featured"
                  filterKey="featured"
                  options={featuredOptions}
                  selectedValues={featuredFilter}
                  isOpen={columnFilters.isActive("featured")}
                  onToggle={() => columnFilters.toggleFilter("featured")}
                  onClose={columnFilters.closeSearch}
                  onSelectionChange={setFeaturedFilter}
                  formatOption={(o) => o.charAt(0).toUpperCase() + o.slice(1)}
                />
                <th
                  className="px-4 py-3 text-center text-sm font-medium cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 select-none"
                  onClick={() => handleSort("clicks")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Clicks (7d)
                    <span className="text-neutral-400">
                      {sortField === "clicks" ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}
                    </span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium">
                  Quick Actions
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="px-4 py-3 text-sm">{job.title}</td>
                  <td className="px-2 py-3">
                    <TableImage src={job.companyLogo} alt={job.company} />
                  </td>
                  <td className="px-4 py-3 text-sm">{job.company}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        job.category === "portfolio"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {job.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {(job.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className={`px-1.5 py-0.5 rounded text-xs ${getSkillColor(tag)}`}>
                          {tag}
                        </span>
                      ))}
                      {(job.tags || []).length > 3 && (
                        <span className="text-xs text-neutral-400">+{(job.tags || []).length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {job.featured ? (
                      <span className="text-yellow-500">★</span>
                    ) : (
                      <span className="text-neutral-300">☆</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`font-medium ${jobClicks[job.id] > 0 ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}>
                      {jobClicks[job.id] || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <StarToggle
                        featured={job.featured || false}
                        onToggle={() => handleToggleFeatured(job)}
                        label="job"
                      />
                      <HotToggle
                        hot={job.tags?.includes("hot") || false}
                        onToggle={() => handleToggleHot(job)}
                        label="job"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <EditButton onClick={() => handleEdit(job)} variant={theme.buttonVariant} />
                      <DeleteButton onClick={() => handleDelete(job.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
