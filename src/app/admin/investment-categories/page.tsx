"use client";

import { useEffect, useState, useCallback } from "react";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { EditButton, DeleteButton, ErrorAlert } from "@/components/admin/ActionButtons";
import { getAdminApiKey, adminFetch, withMinDelay } from "@/lib/admin-utils";
import { ADMIN_THEMES } from "@/lib/admin-themes";

interface InvestmentCategory {
  id: string;
  slug: string;
  label: string;
  color: string | null;
  createdAt: string;
}

const emptyCategory: Partial<InvestmentCategory> = {
  slug: "",
  label: "",
  color: "",
};

const theme = ADMIN_THEMES.investments;

const COLOR_OPTIONS = [
  "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal",
  "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose", "slate", "gray"
];

const CATEGORY_COLOR_CLASSES: Record<string, string> = {
  red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  yellow: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  lime: "bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-400",
  green: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
  cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400",
  sky: "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
  violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
  purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  fuchsia: "bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400",
  pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
  rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400",
  slate: "bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400",
  gray: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400",
  neutral: "bg-neutral-100 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-400",
};

const DEFAULT_CATEGORY_COLOR_CLASS = "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";

export default function AdminInvestmentCategories() {
  const [categories, setCategories] = useState<InvestmentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<InvestmentCategory> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.title = "Admin | dcbuilder.eth";
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await withMinDelay(adminFetch<InvestmentCategory[]>("/api/v1/investment-categories"));
      if (error) {
        setError(error);
      } else if (data) {
        setCategories(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSave = async () => {
    if (!editingCategory) return;
    const apiKey = getAdminApiKey();

    try {
      if (isCreating) {
        const { data: newCategory, error } = await adminFetch<InvestmentCategory>("/api/v1/investment-categories", {
          method: "POST",
          headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(editingCategory),
        });
        if (error) {
          setError(error);
          return;
        }
        if (newCategory) {
          setCategories([...categories, newCategory].sort((a, b) => a.label.localeCompare(b.label)));
        }
      } else {
        const { data: updated, error } = await adminFetch<InvestmentCategory>("/api/v1/investment-categories", {
          method: "PATCH",
          headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(editingCategory),
        });
        if (error) {
          setError(error);
          return;
        }
        if (updated) {
          setCategories(categories.map((c) => (c.id === updated.id ? updated : c)));
        }
      }
      setEditingCategory(null);
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    }
  };

  const handleDelete = async (category: InvestmentCategory) => {
    if (!confirm(`Delete category "${category.label}"?`)) return;
    const apiKey = getAdminApiKey();

    try {
      await adminFetch(`/api/v1/investment-categories?id=${category.id}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey },
      });
      setCategories(categories.filter((c) => c.id !== category.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <TableSkeleton headers={["Slug", "Label", "Color", "Preview", "Actions"]} rows={10} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investment Categories</h1>
        <button
          onClick={() => {
            setEditingCategory(emptyCategory);
            setIsCreating(true);
          }}
          className={`px-4 py-2 ${theme.primary} text-white rounded-lg hover:opacity-90 transition-opacity`}
        >
          + Add Category
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => { setError(null); fetchCategories(); }} />}

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
        />
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">
              {isCreating ? "Add Category" : "Edit Category"}
            </h2>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={editingCategory.slug || ""}
                onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                placeholder="e.g., defi, ai, mev"
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
              />
              <p className="text-xs text-neutral-500 mt-1">Used internally, lowercase with hyphens</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                type="text"
                value={editingCategory.label || ""}
                onChange={(e) => setEditingCategory({ ...editingCategory, label: e.target.value })}
                placeholder="e.g., DeFi, AI, MEV"
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
              />
              <p className="text-xs text-neutral-500 mt-1">Displayed to users</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <select
                value={editingCategory.color || ""}
                onChange={(e) => setEditingCategory({ ...editingCategory, color: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
              >
                <option value="">No color (uses default)</option>
                {COLOR_OPTIONS.map((color) => (
                  <option key={color} value={color}>{color}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-2 ${theme.primary} text-white rounded-lg hover:opacity-90`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <th className="text-left py-3 px-4 font-medium">Slug</th>
              <th className="text-left py-3 px-4 font-medium">Label</th>
              <th className="text-left py-3 px-4 font-medium">Color</th>
              <th className="text-left py-3 px-4 font-medium">Preview</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.map((category) => (
              <tr
                key={category.id}
                className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <td className="py-3 px-4 font-mono text-sm">{category.slug}</td>
                <td className="py-3 px-4">{category.label}</td>
                <td className="py-3 px-4">{category.color || "-"}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      category.color ? CATEGORY_COLOR_CLASSES[category.color] ?? DEFAULT_CATEGORY_COLOR_CLASS : DEFAULT_CATEGORY_COLOR_CLASS
                    }`}
                  >
                    {category.label}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <EditButton
                      onClick={() => {
                        setEditingCategory(category);
                        setIsCreating(false);
                      }}
                      variant={theme.buttonVariant}
                    />
                    <DeleteButton onClick={() => handleDelete(category)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-neutral-500">
        {filteredCategories.length} categor{filteredCategories.length !== 1 ? "ies" : "y"}
      </p>
    </div>
  );
}
