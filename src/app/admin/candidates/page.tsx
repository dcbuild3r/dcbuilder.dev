"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Combobox, MultiCombobox } from "@/components/admin/Combobox";
import { ImageInput } from "@/components/admin/ImagePreview";
import { SearchableMultiSelectHeader, useColumnFilters } from "@/components/admin/ColumnFilters";
import { getSkillColor } from "@/lib/skill-colors";
import { TableSkeleton, withMinDelay } from "@/components/admin/TableSkeleton";

interface Candidate {
  id: string;
  name: string;
  title: string | null;
  location: string | null;
  summary: string | null;
  skills: string[] | null;
  experience: string | null;
  education: string | null;
  image: string | null;
  cv: string | null;
  featured: boolean | null;
  available: boolean | null;
  email: string | null;
  telegram: string | null;
  calendly: string | null;
  x: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
  createdAt: string;
}

const emptyCandidate: Partial<Candidate> = {
  name: "",
  title: "",
  location: "",
  summary: "",
  skills: [],
  experience: "",
  education: "",
  image: "",
  cv: "",
  featured: false,
  available: true,
  email: "",
  telegram: "",
  calendly: "",
  x: "",
  github: "",
  linkedin: "",
  website: "",
};

type SortField = "name" | "title" | "views" | "createdAt" | null;
type SortDirection = "asc" | "desc";

export default function AdminCandidates() {
  const searchParams = useSearchParams();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCandidate, setEditingCandidate] =
    useState<Partial<Candidate> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [candidateViews, setCandidateViews] = useState<Record<string, number>>({});
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [columnSearch, setColumnSearch] = useState<string | null>(null);
  const [columnSearchValue, setColumnSearchValue] = useState("");
  const [experienceFilter, setExperienceFilter] = useState<string[]>([]);
  const [availableFilter, setAvailableFilter] = useState<string[]>([]);
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);

  const columnFilters = useColumnFilters();

  const experienceOptions = ["0-1", "1-3", "3-5", "5-10", "10+"];
  // Get unique skills from all candidates (excluding 'top' since that's a special marker)
  const skillOptions = [...new Set(candidates.flatMap(c => c.skills || []).filter(s => s && s !== "top"))];

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortHeader = ({ field, children, center }: { field: SortField; children: React.ReactNode; center?: boolean }) => (
    <th
      className={`px-4 py-3 text-sm font-medium cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 select-none ${center ? "text-center" : "text-left"}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1 ${center ? "justify-center" : ""}`}>
        {children}
        <span className="text-neutral-400">
          {sortField === field ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}
        </span>
      </div>
    </th>
  );

  const SearchableSortHeader = ({ field, searchKey, children, center }: { field: SortField; searchKey: string; children: React.ReactNode; center?: boolean }) => (
    <th className={`px-4 py-3 text-sm font-medium ${center ? "text-center" : "text-left"}`}>
      {columnSearch === searchKey ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={columnSearchValue}
            onChange={(e) => setColumnSearchValue(e.target.value)}
            placeholder={`Search ${searchKey}...`}
            className="w-full px-2 py-1 text-sm rounded border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700"
            autoFocus
          />
          <button
            onClick={() => { setColumnSearch(null); setColumnSearchValue(""); }}
            className="text-neutral-400 hover:text-neutral-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <div className={`flex items-center gap-1 ${center ? "justify-center" : ""}`}>
          <button
            className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white"
            onClick={() => handleSort(field)}
          >
            {children}
            <span className="text-neutral-400">
              {sortField === field ? (sortDirection === "desc" ? "↓" : "↑") : "↕"}
            </span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setColumnSearch(searchKey); setColumnSearchValue(""); }}
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

  const getApiKey = () => localStorage.getItem("admin_api_key") || "";

  const filteredCandidates = candidates
    .filter((candidate) => {
      // Global search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !candidate.name.toLowerCase().includes(query) &&
          !(candidate.title?.toLowerCase() || "").includes(query) &&
          !(candidate.skills?.join(" ").toLowerCase() || "").includes(query)
        ) {
          return false;
        }
      }
      // Column-specific search
      if (columnSearch && columnSearchValue) {
        const value = columnSearchValue.toLowerCase();
        if (columnSearch === "name" && !candidate.name.toLowerCase().includes(value)) return false;
        if (columnSearch === "title" && !(candidate.title || "").toLowerCase().includes(value)) return false;
      }
      // Experience multi-select filter
      if (experienceFilter.length > 0 && !experienceFilter.includes(candidate.experience || "")) {
        return false;
      }
      // Skills multi-select filter
      if (skillsFilter.length > 0) {
        const candidateSkills = candidate.skills || [];
        if (!skillsFilter.some(skill => candidateSkills.includes(skill))) {
          return false;
        }
      }
      // Available filter
      if (availableFilter.length > 0) {
        const isAvailable = candidate.available !== false;
        const wantAvailable = availableFilter.includes("yes");
        const wantUnavailable = availableFilter.includes("no");
        if (wantAvailable && !wantUnavailable && !isAvailable) return false;
        if (wantUnavailable && !wantAvailable && isAvailable) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const dir = sortDirection === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return dir * a.name.localeCompare(b.name);
        case "title":
          return dir * (a.title || "").localeCompare(b.title || "");
        case "views":
          return dir * ((candidateViews[a.id] || 0) - (candidateViews[b.id] || 0));
        case "createdAt":
          return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        default:
          return 0;
      }
    });

  const fetchCandidates = useCallback(async () => {
    try {
      const data = await withMinDelay(
        fetch("/api/v1/candidates?limit=100").then(res => res.json())
      );
      setCandidates(data.data || []);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    }
    setLoading(false);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/analytics?type=candidates", {
        headers: { "x-api-key": getApiKey() },
      });
      if (res.ok) {
        const data = await res.json();
        setCandidateViews(data.data || {});
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    }
  }, []);

  useEffect(() => {
    document.title = "Admin | dcbuilder.eth";
  }, []);

  useEffect(() => {
    fetchCandidates();
    fetchAnalytics();
  }, [fetchCandidates, fetchAnalytics]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingCandidate(emptyCandidate);
      setIsNew(true);
      setSkillsInput("");
    }
  }, [searchParams]);

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setIsNew(false);
    setSkillsInput((candidate.skills || []).join(", "));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this candidate?")) return;

    try {
      const res = await fetch(`/api/v1/candidates/${id}`, {
        method: "DELETE",
        headers: { "x-api-key": getApiKey() },
      });
      if (res.ok) {
        setCandidates(candidates.filter((c) => c.id !== id));
      } else {
        alert("Failed to delete candidate");
      }
    } catch (error) {
      console.error("Failed to delete candidate:", error);
      alert("Failed to delete candidate");
    }
  };

  const handleToggleFeatured = async (candidate: Candidate) => {
    try {
      const res = await fetch(`/api/v1/candidates/${candidate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify({ featured: !candidate.featured }),
      });
      if (res.ok) {
        setCandidates(candidates.map((c) => (c.id === candidate.id ? { ...c, featured: !c.featured } : c)));
      }
    } catch (error) {
      console.error("Failed to toggle featured:", error);
    }
  };

  const handleToggleTop = async (candidate: Candidate) => {
    const hasTop = candidate.skills?.includes("top") ?? false;
    const newSkills = hasTop
      ? (candidate.skills || []).filter((s) => s !== "top")
      : [...(candidate.skills || []), "top"];

    try {
      const res = await fetch(`/api/v1/candidates/${candidate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify({ skills: newSkills }),
      });
      if (res.ok) {
        setCandidates(candidates.map((c) => (c.id === candidate.id ? { ...c, skills: newSkills } : c)));
      }
    } catch (error) {
      console.error("Failed to toggle top:", error);
    }
  };

  const handleSave = async () => {
    if (!editingCandidate) return;
    setSaving(true);

    const candidateData = {
      ...editingCandidate,
      skills: skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      const url = isNew
        ? "/api/v1/candidates"
        : `/api/v1/candidates/${editingCandidate.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify(candidateData),
      });

      if (res.ok) {
        await fetchCandidates();
        setEditingCandidate(null);
        setIsNew(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save candidate");
      }
    } catch (error) {
      console.error("Failed to save candidate:", error);
      alert("Failed to save candidate");
    }
    setSaving(false);
  };

  if (editingCandidate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isNew ? "Add New Candidate" : "Edit Candidate"}
          </h1>
          <button
            onClick={() => {
              setEditingCandidate(null);
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
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                value={editingCandidate.name || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={editingCandidate.title || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    title: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <Combobox
                value={editingCandidate.location || ""}
                onChange={(value) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    location: value,
                  })
                }
                field="location"
                placeholder="Start typing to see suggestions..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Experience Level
              </label>
              <select
                value={editingCandidate.experience || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    experience: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value="">Not specified</option>
                <option value="0-1">0-1 years</option>
                <option value="1-3">1-3 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Skills (comma-separated)
              </label>
              <MultiCombobox
                value={skillsInput}
                onChange={setSkillsInput}
                field="skills"
                placeholder="e.g., solidity, typescript, defi"
              />
            </div>
            <ImageInput
              label="Profile Image URL"
              value={editingCandidate.image || ""}
              onChange={(value) =>
                setEditingCandidate({
                  ...editingCandidate,
                  image: value,
                })
              }
            />
            <div>
              <label className="block text-sm font-medium mb-1">CV URL</label>
              <input
                type="text"
                value={editingCandidate.cv || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    cv: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={editingCandidate.email || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    email: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telegram</label>
              <input
                type="text"
                value={editingCandidate.telegram || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    telegram: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">X (Twitter)</label>
              <input
                type="text"
                value={editingCandidate.x || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    x: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">GitHub</label>
              <input
                type="text"
                value={editingCandidate.github || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    github: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">LinkedIn</label>
              <input
                type="text"
                value={editingCandidate.linkedin || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    linkedin: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="text"
                value={editingCandidate.website || ""}
                onChange={(e) =>
                  setEditingCandidate({
                    ...editingCandidate,
                    website: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={editingCandidate.featured || false}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      featured: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="featured" className="text-sm font-medium">
                  Featured
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={editingCandidate.available !== false}
                  onChange={(e) =>
                    setEditingCandidate({
                      ...editingCandidate,
                      available: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="available" className="text-sm font-medium">
                  Available
                </label>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Summary/Bio</label>
            <textarea
              value={editingCandidate.summary || ""}
              onChange={(e) =>
                setEditingCandidate({
                  ...editingCandidate,
                  summary: e.target.value,
                })
              }
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditingCandidate(null);
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
              {saving ? "Saving..." : "Save Candidate"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Candidates ({filteredCandidates.length})</h1>
        <button
          onClick={() => {
            setEditingCandidate(emptyCandidate);
            setIsNew(true);
            setSkillsInput("");
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
        >
          Add Candidate
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search candidates by name, title, or skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Candidates Table */}
      {loading ? (
        <TableSkeleton columns={7} rows={10} headerColor="bg-green-100 dark:bg-green-900/30" headerHeight="h-[64px]" />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-green-100 dark:bg-green-900/30">
              <tr>
                <th className="px-2 py-3 text-left text-sm font-medium w-12"></th>
                <SearchableSortHeader field="name" searchKey="name">Name</SearchableSortHeader>
                <SearchableSortHeader field="title" searchKey="title">Title</SearchableSortHeader>
                <SearchableMultiSelectHeader
                  label="Skills"
                  filterKey="skills"
                  options={skillOptions}
                  selectedValues={skillsFilter}
                  isOpen={columnFilters.isActive("skills")}
                  onToggle={() => columnFilters.toggleFilter("skills")}
                  onClose={columnFilters.closeSearch}
                  onSelectionChange={setSkillsFilter}
                />
                <th className="px-4 py-3 text-left text-sm font-medium relative">
                  {columnSearch === "experience" ? (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 z-10 min-w-32">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-neutral-500">Filter by experience</span>
                        <button
                          onClick={() => setColumnSearch(null)}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      {experienceOptions.map((exp) => (
                        <label key={exp} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 px-1 rounded">
                          <input
                            type="checkbox"
                            checked={experienceFilter.includes(exp)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExperienceFilter([...experienceFilter, exp]);
                              } else {
                                setExperienceFilter(experienceFilter.filter((ex) => ex !== exp));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{exp} years</span>
                        </label>
                      ))}
                      {experienceFilter.length > 0 && (
                        <button
                          onClick={() => setExperienceFilter([])}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <span>Experience</span>
                    {experienceFilter.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 rounded-full">
                        {experienceFilter.length}
                      </span>
                    )}
                    <button
                      onClick={() => setColumnSearch(columnSearch === "experience" ? null : "experience")}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      title="Filter by experience"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </button>
                  </div>
                </th>
                <SortHeader field="views" center>Views (7d)</SortHeader>
                <th className="px-4 py-3 text-center text-sm font-medium">
                  Star
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium">
                  Top
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium relative">
                  {columnSearch === "available" ? (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 z-10 min-w-32">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-neutral-500">Filter by available</span>
                        <button
                          onClick={() => setColumnSearch(null)}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      {["yes", "no"].map((avail) => (
                        <label key={avail} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 px-1 rounded">
                          <input
                            type="checkbox"
                            checked={availableFilter.includes(avail)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAvailableFilter([...availableFilter, avail]);
                              } else {
                                setAvailableFilter(availableFilter.filter((a) => a !== avail));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{avail}</span>
                        </label>
                      ))}
                      {availableFilter.length > 0 && (
                        <button
                          onClick={() => setAvailableFilter([])}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <span>Available</span>
                    {availableFilter.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 rounded-full">
                        {availableFilter.length}
                      </span>
                    )}
                    <button
                      onClick={() => setColumnSearch(columnSearch === "available" ? null : "available")}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      title="Filter by available"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </button>
                  </div>
                </th>
                <SortHeader field="createdAt">Created</SortHeader>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredCandidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-2 py-3">
                    {candidate.image ? (
                      <img
                        src={candidate.image}
                        alt={candidate.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{candidate.name}</td>
                  <td className="px-4 py-3 text-sm">{candidate.title || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {(candidate.skills || []).filter(s => s !== "top").slice(0, 3).map((skill) => (
                        <span key={skill} className={`px-1.5 py-0.5 rounded text-xs ${getSkillColor(skill)}`}>
                          {skill}
                        </span>
                      ))}
                      {(candidate.skills || []).filter(s => s !== "top").length > 3 && (
                        <span className="text-xs text-neutral-400">+{(candidate.skills || []).filter(s => s !== "top").length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {candidate.experience ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${getSkillColor(candidate.experience)}`}>
                        {candidate.experience} yrs
                      </span>
                    ) : (
                      <span className="text-neutral-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`font-medium ${candidateViews[candidate.id] > 0 ? "text-green-600 dark:text-green-400" : "text-neutral-400"}`}>
                      {candidateViews[candidate.id] || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <button
                      onClick={() => handleToggleFeatured(candidate)}
                      title={candidate.featured ? "Remove star" : "Star this candidate"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        candidate.featured
                          ? "bg-amber-50 text-amber-500 hover:bg-amber-100 dark:bg-amber-500/20 dark:text-amber-400"
                          : "bg-white text-neutral-400 border border-neutral-200 hover:border-yellow-300 hover:text-yellow-500 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-yellow-500"
                      }`}
                    >
                      <svg className="w-4 h-4" fill={candidate.featured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <button
                      onClick={() => handleToggleTop(candidate)}
                      title={candidate.skills?.includes("top") ? "Remove TOP" : "Mark as TOP"}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        candidate.skills?.includes("top")
                          ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white animate-pulse-top"
                          : "bg-white text-neutral-400 border border-neutral-200 hover:border-violet-300 hover:text-violet-500 dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-violet-500"
                      }`}
                    >
                      ⭐️ TOP
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        candidate.available !== false
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {candidate.available !== false ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">
                    {new Date(candidate.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(candidate)}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/40 transition-colors whitespace-nowrap"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40 transition-colors whitespace-nowrap"
                      >
                        Delete
                      </button>
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
