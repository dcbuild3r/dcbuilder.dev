"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ImageInput } from "@/components/admin/ImagePreview";

interface Investment {
  id: string;
  title: string;
  description: string | null;
  logo: string | null;
  tier: string | null;
  featured: boolean | null;
  status: string | null;
  website: string | null;
  x: string | null;
  github: string | null;
  createdAt: string;
}

const emptyInvestment: Partial<Investment> = {
  title: "",
  description: "",
  logo: "",
  tier: "2",
  featured: false,
  status: "active",
  website: "",
  x: "",
  github: "",
};

export default function AdminInvestments() {
  const searchParams = useSearchParams();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInvestment, setEditingInvestment] =
    useState<Partial<Investment> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getApiKey = () => localStorage.getItem("admin_api_key") || "";

  const fetchInvestments = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/investments?limit=100");
      const data = await res.json();
      setInvestments(data.data || []);
    } catch (error) {
      console.error("Failed to fetch investments:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = "Admin | dcbuilder.eth";
  }, []);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingInvestment(emptyInvestment);
      setIsNew(true);
    }
  }, [searchParams]);

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsNew(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this investment?")) return;

    try {
      const res = await fetch(`/api/v1/investments/${id}`, {
        method: "DELETE",
        headers: { "x-api-key": getApiKey() },
      });
      if (res.ok) {
        setInvestments(investments.filter((i) => i.id !== id));
      } else {
        alert("Failed to delete investment");
      }
    } catch (error) {
      console.error("Failed to delete investment:", error);
      alert("Failed to delete investment");
    }
  };

  const handleToggleFeatured = async (investment: Investment) => {
    try {
      const res = await fetch(`/api/v1/investments/${investment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify({ featured: !investment.featured }),
      });
      if (res.ok) {
        setInvestments(investments.map((i) => (i.id === investment.id ? { ...i, featured: !i.featured } : i)));
      }
    } catch (error) {
      console.error("Failed to toggle featured:", error);
    }
  };

  const handleSave = async () => {
    if (!editingInvestment) return;
    setSaving(true);

    try {
      const url = isNew
        ? "/api/v1/investments"
        : `/api/v1/investments/${editingInvestment.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify(editingInvestment),
      });

      if (res.ok) {
        await fetchInvestments();
        setEditingInvestment(null);
        setIsNew(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save investment");
      }
    } catch (error) {
      console.error("Failed to save investment:", error);
      alert("Failed to save investment");
    }
    setSaving(false);
  };

  if (editingInvestment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isNew ? "Add New Investment" : "Edit Investment"}
          </h1>
          <button
            onClick={() => {
              setEditingInvestment(null);
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
                value={editingInvestment.title || ""}
                onChange={(e) =>
                  setEditingInvestment({
                    ...editingInvestment,
                    title: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tier</label>
              <select
                value={editingInvestment.tier || "2"}
                onChange={(e) =>
                  setEditingInvestment({
                    ...editingInvestment,
                    tier: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value="1">Tier 1 (Top)</option>
                <option value="2">Tier 2</option>
                <option value="3">Tier 3</option>
                <option value="4">Tier 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={editingInvestment.status || "active"}
                onChange={(e) =>
                  setEditingInvestment({
                    ...editingInvestment,
                    status: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              >
                <option value="active">Active</option>
                <option value="exited">Exited</option>
                <option value="defunct">Defunct</option>
              </select>
            </div>

            <div>
              <ImageInput
                label="Logo URL"
                value={editingInvestment.logo || ""}
                onChange={(value) =>
                  setEditingInvestment({ ...editingInvestment, logo: value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="text"
                value={editingInvestment.website || ""}
                onChange={(e) =>
                  setEditingInvestment({
                    ...editingInvestment,
                    website: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">X (Twitter)</label>
              <input
                type="text"
                value={editingInvestment.x || ""}
                onChange={(e) =>
                  setEditingInvestment({
                    ...editingInvestment,
                    x: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                placeholder="https://x.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">GitHub</label>
              <input
                type="text"
                value={editingInvestment.github || ""}
                onChange={(e) =>
                  setEditingInvestment({
                    ...editingInvestment,
                    github: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                placeholder="https://github.com/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editingInvestment.description || ""}
              onChange={(e) =>
                setEditingInvestment({
                  ...editingInvestment,
                  description: e.target.value,
                })
              }
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingInvestment.featured || false}
                onChange={(e) =>
                  setEditingInvestment({
                    ...editingInvestment,
                    featured: e.target.checked,
                  })
                }
                className="rounded"
              />
              <span className="text-sm">Featured</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditingInvestment(null);
                setIsNew(false);
              }}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredInvestments = investments.filter(
    (investment) =>
      investment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investments ({investments.length})</h1>
        <button
          onClick={() => {
            setEditingInvestment(emptyInvestment);
            setIsNew(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Investment
        </button>
      </div>

      <input
        type="text"
        placeholder="Search investments..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full max-w-md px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
      />

      {loading ? (
        <div className="text-center py-8 text-neutral-500">Loading...</div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-2 py-3 text-left text-sm font-medium w-12">

                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Tier
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium">
                  Star
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredInvestments.map((investment) => (
                <tr
                  key={investment.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-2 py-3">
                    {investment.logo ? (
                      <img
                        src={investment.logo}
                        alt={investment.title}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-700" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{investment.title}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800">
                      Tier {investment.tier || "2"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        investment.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : investment.status === "defunct"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {investment.status || "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <button
                      onClick={() => handleToggleFeatured(investment)}
                      title={investment.featured ? "Remove star" : "Star this investment"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        investment.featured
                          ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                      }`}
                    >
                      <svg className="w-4 h-4" fill={investment.featured ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => handleEdit(investment)}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(investment.id)}
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
