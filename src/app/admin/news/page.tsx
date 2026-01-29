"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Combobox } from "@/components/admin/Combobox";
import { ImageInput } from "@/components/admin/ImagePreview";
import { getSkillColor } from "@/lib/skill-colors";
import { TableSkeleton, withMinDelay } from "@/components/admin/TableSkeleton";

interface CuratedLink {
  id: string;
  title: string;
  url: string;
  source: string;
  date: string;
  description: string | null;
  category: string;
  featured: boolean | null;
}

interface Announcement {
  id: string;
  title: string;
  url: string;
  company: string;
  companyLogo: string | null;
  platform: string;
  date: string;
  description: string | null;
  category: string;
  featured: boolean | null;
}

const emptyCuratedLink: Partial<CuratedLink> = {
  title: "",
  url: "",
  source: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
  category: "x_post",
  featured: false,
};

const emptyAnnouncement: Partial<Announcement> = {
  title: "",
  url: "",
  company: "",
  companyLogo: "",
  platform: "x",
  date: new Date().toISOString().split("T")[0],
  description: "",
  category: "product",
  featured: false,
};

type TabType = "curated" | "announcements";

export default function AdminNews() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("curated");
  const [curatedLinks, setCuratedLinks] = useState<CuratedLink[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<
    Partial<CuratedLink> | Partial<Announcement> | null
  >(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [columnSearch, setColumnSearch] = useState<string | null>(null);
  const [columnSearchValue, setColumnSearchValue] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"date" | null>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const platformOptions = ["x", "blog", "discord", "github", "other"];

  // Get unique categories from curated links
  const categoryOptions = [...new Set(curatedLinks.map(l => l.category).filter(Boolean))];

  const getApiKey = () => localStorage.getItem("admin_api_key") || "";

  const fetchData = useCallback(async () => {
    try {
      const [curatedData, announcementsData] = await withMinDelay(
        Promise.all([
          fetch("/api/v1/news/curated?limit=100").then(res => res.json()),
          fetch("/api/v1/news/announcements?limit=100").then(res => res.json()),
        ])
      );
      setCuratedLinks(curatedData.data || []);
      setAnnouncements(announcementsData.data || []);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = "Admin | dcbuilder.eth";
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingItem(emptyCuratedLink);
      setIsNew(true);
      setActiveTab("curated");
    }
  }, [searchParams]);

  const handleEdit = (item: CuratedLink | Announcement, type: TabType) => {
    setEditingItem({
      ...item,
      date:
        typeof item.date === "string"
          ? item.date.split("T")[0]
          : new Date(item.date).toISOString().split("T")[0],
    });
    setIsNew(false);
    setActiveTab(type);
  };

  const handleDelete = async (id: string, type: TabType) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const endpoint =
      type === "curated"
        ? `/api/v1/news/curated/${id}`
        : `/api/v1/news/announcements/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "x-api-key": getApiKey() },
      });
      if (res.ok) {
        if (type === "curated") {
          setCuratedLinks(curatedLinks.filter((l) => l.id !== id));
        } else {
          setAnnouncements(announcements.filter((a) => a.id !== id));
        }
      } else {
        alert("Failed to delete item");
      }
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("Failed to delete item");
    }
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);

    const endpoint =
      activeTab === "curated" ? "/api/v1/news/curated" : "/api/v1/news/announcements";

    try {
      const url = isNew ? endpoint : `${endpoint}/${editingItem.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify(editingItem),
      });

      if (res.ok) {
        await fetchData();
        setEditingItem(null);
        setIsNew(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save item");
      }
    } catch (error) {
      console.error("Failed to save item:", error);
      alert("Failed to save item");
    }
    setSaving(false);
  };

  const platforms = ["x", "blog", "discord", "github", "other"];

  // Filter and sort curated links
  const filteredCuratedLinks = curatedLinks
    .filter((link) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!link.title.toLowerCase().includes(query) && !link.source.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (columnSearch && columnSearchValue) {
        const value = columnSearchValue.toLowerCase();
        if (columnSearch === "title" && !link.title.toLowerCase().includes(value)) return false;
        if (columnSearch === "source" && !link.source.toLowerCase().includes(value)) return false;
      }
      // Category multi-select filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(link.category)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0;
    });

  // Filter and sort announcements
  const filteredAnnouncements = announcements
    .filter((ann) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!ann.title.toLowerCase().includes(query) && !ann.company.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (columnSearch && columnSearchValue) {
        const value = columnSearchValue.toLowerCase();
        if (columnSearch === "title" && !ann.title.toLowerCase().includes(value)) return false;
        if (columnSearch === "company" && !ann.company.toLowerCase().includes(value)) return false;
      }
      if (platformFilter.length > 0 && !platformFilter.includes(ann.platform)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc"
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return 0;
    });

  if (editingItem) {
    const isCurated = activeTab === "curated";

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isNew ? `Add New ${isCurated ? "Curated Link" : "Announcement"}` : `Edit ${isCurated ? "Curated Link" : "Announcement"}`}
          </h1>
          <button
            onClick={() => {
              setEditingItem(null);
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
                value={editingItem.title || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, title: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL *</label>
              <input
                type="url"
                value={editingItem.url || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, url: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            {isCurated ? (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Source *
                </label>
                <Combobox
                  value={(editingItem as Partial<CuratedLink>).source || ""}
                  onChange={(value) =>
                    setEditingItem({ ...editingItem, source: value })
                  }
                  field="source"
                  placeholder="e.g., Vitalik Buterin, Paradigm"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Company *
                  </label>
                  <Combobox
                    value={(editingItem as Partial<Announcement>).company || ""}
                    onChange={(value) =>
                      setEditingItem({ ...editingItem, company: value })
                    }
                    field="announcementCompany"
                    placeholder="Start typing to see suggestions..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Platform *
                  </label>
                  <select
                    value={(editingItem as Partial<Announcement>).platform || "x"}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, platform: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <ImageInput
                  label="Company Logo URL"
                  value={
                    (editingItem as Partial<Announcement>).companyLogo || ""
                  }
                  onChange={(value) =>
                    setEditingItem({
                      ...editingItem,
                      companyLogo: value,
                    })
                  }
                />
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={editingItem.date || ""}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, date: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Category *
              </label>
              <Combobox
                value={editingItem.category || ""}
                onChange={(value) =>
                  setEditingItem({ ...editingItem, category: value })
                }
                field="newsCategory"
                placeholder="e.g., crypto, ai, defi, x_post"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={editingItem.featured || false}
                onChange={(e) =>
                  setEditingItem({ ...editingItem, featured: e.target.checked })
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
              value={editingItem.description || ""}
              onChange={(e) =>
                setEditingItem({ ...editingItem, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditingItem(null);
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
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">News</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingItem(emptyCuratedLink);
              setIsNew(true);
              setActiveTab("curated");
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
          >
            Add Curated Link
          </button>
          <button
            onClick={() => {
              setEditingItem(emptyAnnouncement);
              setIsNew(true);
              setActiveTab("announcements");
            }}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
          >
            Add Announcement
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search news..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab("curated")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "curated"
              ? "border-purple-600 text-purple-600"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Curated Links ({curatedLinks.length})
        </button>
        <button
          onClick={() => setActiveTab("announcements")}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === "announcements"
              ? "border-orange-600 text-orange-600"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Announcements ({announcements.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <TableSkeleton
          columns={5}
          rows={8}
          headerColor={activeTab === "curated" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-orange-100 dark:bg-orange-900/30"}
          headerHeight="h-[44px]"
        />
      ) : activeTab === "curated" ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-purple-100 dark:bg-purple-900/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {columnSearch === "title" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={columnSearchValue}
                        onChange={(e) => setColumnSearchValue(e.target.value)}
                        placeholder="Search title..."
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
                    <div className="flex items-center gap-1">
                      <span>Title</span>
                      <button
                        onClick={() => { setColumnSearch("title"); setColumnSearchValue(""); }}
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        title="Search by title"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {columnSearch === "source" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={columnSearchValue}
                        onChange={(e) => setColumnSearchValue(e.target.value)}
                        placeholder="Search source..."
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
                    <div className="flex items-center gap-1">
                      <span>Source</span>
                      <button
                        onClick={() => { setColumnSearch("source"); setColumnSearchValue(""); }}
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        title="Search by source"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium relative">
                  {columnSearch === "category" ? (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 z-10 min-w-32 max-h-64 overflow-y-auto">
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
                      {categoryOptions.map((category) => (
                        <label key={category} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 px-1 rounded">
                          <input
                            type="checkbox"
                            checked={categoryFilter.includes(category)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCategoryFilter([...categoryFilter, category]);
                              } else {
                                setCategoryFilter(categoryFilter.filter((c) => c !== category));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{category}</span>
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
                    <span>Category</span>
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
                <th className="px-4 py-3 text-left text-sm font-medium">
                  <button
                    onClick={() => {
                      if (sortBy === "date") {
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                      } else {
                        setSortBy("date");
                        setSortOrder("desc");
                      }
                    }}
                    className={`flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white ${sortBy === "date" ? "text-blue-600 dark:text-blue-400" : ""}`}
                  >
                    <span>Date</span>
                    {sortBy === "date" && (
                      <svg className={`w-4 h-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredCuratedLinks.map((link) => (
                <tr
                  key={link.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {link.title}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getSkillColor(link.source)}`}>
                      {link.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getSkillColor(link.category)}`}>
                      {link.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(link.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(link, "curated")}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-800/40 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(link.id, "curated")}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40 transition-colors"
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
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-purple-100 dark:bg-purple-900/30">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {columnSearch === "title" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={columnSearchValue}
                        onChange={(e) => setColumnSearchValue(e.target.value)}
                        placeholder="Search title..."
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
                    <div className="flex items-center gap-1">
                      <span>Title</span>
                      <button
                        onClick={() => { setColumnSearch("title"); setColumnSearchValue(""); }}
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        title="Search by title"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  {columnSearch === "company" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={columnSearchValue}
                        onChange={(e) => setColumnSearchValue(e.target.value)}
                        placeholder="Search company..."
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
                    <div className="flex items-center gap-1">
                      <span>Company</span>
                      <button
                        onClick={() => { setColumnSearch("company"); setColumnSearchValue(""); }}
                        className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        title="Search by company"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                      </button>
                    </div>
                  )}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium relative">
                  {columnSearch === "platform" ? (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 z-10 min-w-32">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-neutral-500">Filter by platform</span>
                        <button
                          onClick={() => setColumnSearch(null)}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      {platformOptions.map((platform) => (
                        <label key={platform} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 px-1 rounded">
                          <input
                            type="checkbox"
                            checked={platformFilter.includes(platform)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPlatformFilter([...platformFilter, platform]);
                              } else {
                                setPlatformFilter(platformFilter.filter((p) => p !== platform));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm capitalize">{platform}</span>
                        </label>
                      ))}
                      {platformFilter.length > 0 && (
                        <button
                          onClick={() => setPlatformFilter([])}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <span>Platform</span>
                    {platformFilter.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 rounded-full">
                        {platformFilter.length}
                      </span>
                    )}
                    <button
                      onClick={() => setColumnSearch(columnSearch === "platform" ? null : "platform")}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      title="Filter by platform"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  <button
                    onClick={() => {
                      if (sortBy === "date") {
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                      } else {
                        setSortBy("date");
                        setSortOrder("desc");
                      }
                    }}
                    className={`flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white ${sortBy === "date" ? "text-blue-600 dark:text-blue-400" : ""}`}
                  >
                    <span>Date</span>
                    {sortBy === "date" && (
                      <svg className={`w-4 h-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredAnnouncements.map((announcement) => (
                <tr
                  key={announcement.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {announcement.title}
                  </td>
                  <td className="px-4 py-3 text-sm">{announcement.company}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getSkillColor(announcement.platform)}`}>
                      {announcement.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(announcement.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(announcement, "announcements")}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-800/40 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(announcement.id, "announcements")
                        }
                        className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40 transition-colors"
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
