"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Combobox } from "@/components/admin/Combobox";
import { ImageInput } from "@/components/admin/ImagePreview";

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

  const getApiKey = () => localStorage.getItem("admin_api_key") || "";

  const fetchData = useCallback(async () => {
    try {
      const [curatedRes, announcementsRes] = await Promise.all([
        fetch("/api/v1/news/curated?limit=100"),
        fetch("/api/v1/news/announcements?limit=100"),
      ]);
      const [curatedData, announcementsData] = await Promise.all([
        curatedRes.json(),
        announcementsRes.json(),
      ]);
      setCuratedLinks(curatedData.data || []);
      setAnnouncements(announcementsData.data || []);
    } catch (error) {
      console.error("Failed to fetch news:", error);
    }
    setLoading(false);
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
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : activeTab === "curated" ? (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {curatedLinks.map((link) => (
                <tr
                  key={link.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {link.title}
                  </td>
                  <td className="px-4 py-3 text-sm">{link.source}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      {link.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(link.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => handleEdit(link, "curated")}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(link.id, "curated")}
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
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Platform
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {announcements.map((announcement) => (
                <tr
                  key={announcement.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {announcement.title}
                  </td>
                  <td className="px-4 py-3 text-sm">{announcement.company}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                      {announcement.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(announcement.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => handleEdit(announcement, "announcements")}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(announcement.id, "announcements")
                      }
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
