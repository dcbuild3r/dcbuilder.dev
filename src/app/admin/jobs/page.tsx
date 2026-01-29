"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Combobox, MultiCombobox } from "@/components/admin/Combobox";
import { ImageInput } from "@/components/admin/ImagePreview";

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
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <span className="text-neutral-400">
          {sortField === field ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}
        </span>
      </div>
    </th>
  );

  const getApiKey = () => localStorage.getItem("admin_api_key") || "";

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/jobs?limit=500");
      const data = await res.json();
      setJobs(data.data || []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
    setLoading(false);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/analytics?type=jobs", {
        headers: { "x-api-key": getApiKey() },
      });
      if (res.ok) {
        const data = await res.json();
        setJobClicks(data.data || {});
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
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

    try {
      const res = await fetch(`/api/v1/jobs/${id}`, {
        method: "DELETE",
        headers: { "x-api-key": getApiKey() },
      });
      if (res.ok) {
        setJobs(jobs.filter((j) => j.id !== id));
      } else {
        alert("Failed to delete job");
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
      alert("Failed to delete job");
    }
  };

  const handleToggleFeatured = async (job: Job) => {
    try {
      const res = await fetch(`/api/v1/jobs/${job.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify({ featured: !job.featured }),
      });
      if (res.ok) {
        setJobs(jobs.map((j) => (j.id === job.id ? { ...j, featured: !j.featured } : j)));
      }
    } catch (error) {
      console.error("Failed to toggle featured:", error);
    }
  };

  const handleToggleHot = async (job: Job) => {
    const currentTags = job.tags || [];
    const hasHot = currentTags.includes("hot");
    const newTags = hasHot
      ? currentTags.filter((t) => t !== "hot")
      : [...currentTags, "hot"];

    try {
      const res = await fetch(`/api/v1/jobs/${job.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify({ tags: newTags }),
      });
      if (res.ok) {
        setJobs(jobs.map((j) => (j.id === job.id ? { ...j, tags: newTags } : j)));
      }
    } catch (error) {
      console.error("Failed to toggle hot:", error);
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

    try {
      const url = isNew ? "/api/v1/jobs" : `/api/v1/jobs/${editingJob.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify(jobData),
      });

      if (res.ok) {
        await fetchJobs();
        setEditingJob(null);
        setIsNew(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save job");
      }
    } catch (error) {
      console.error("Failed to save job:", error);
      alert("Failed to save job");
    }
    setSaving(false);
  };

  const filteredJobs = jobs
    .filter(
      (job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          Add Job
        </button>
      </div>

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
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <SortHeader field="title">Title</SortHeader>
                <th className="px-2 py-3 text-left text-sm font-medium w-12"></th>
                <SortHeader field="company">Company</SortHeader>
                <SortHeader field="category">Category</SortHeader>
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
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-700" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{job.company}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        job.category === "portfolio"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {job.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`font-medium ${jobClicks[job.id] > 0 ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}>
                      {jobClicks[job.id] || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleFeatured(job)}
                        title={job.featured ? "Remove star" : "Star this job"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          job.featured
                            ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                            : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                        }`}
                      >
                        <svg className="w-4 h-4" fill={job.featured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleHot(job)}
                        title={job.tags?.includes("hot") ? "Remove HOT" : "Mark as HOT"}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                          job.tags?.includes("hot")
                            ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                        }`}
                      >
                        🔥
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => handleEdit(job)}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
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
