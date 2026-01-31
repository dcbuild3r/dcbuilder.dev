"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ImageInput } from "@/components/admin/ImagePreview";
import {
  SearchableHeader,
  MultiSelectHeader,
  useColumnFilters,
} from "@/components/admin/ColumnFilters";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { getAdminApiKey, adminFetch, withMinDelay } from "@/lib/admin-utils";
import { StarToggle, EditButton, DeleteButton, TableImage, ErrorAlert } from "@/components/admin/ActionButtons";
import { ADMIN_THEMES } from "@/lib/admin-themes";
import { INVESTMENT_CATEGORIES } from "@/db/schema";

interface Investment {
  id: string;
  title: string;
  description: string | null;
  logo: string | null;
  tier: string | null;
  featured: boolean | null;
  status: string | null;
  categories: string[] | null;
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
  categories: [],
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
  const [sortBy, setSortBy] = useState<"tier" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const columnFilters = useColumnFilters();
  const theme = ADMIN_THEMES.investments;

  const statusOptions = ["active", "exited", "defunct"];
  const tierOptions = ["1", "2", "3", "4"];

  const fetchInvestments = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await withMinDelay(
      adminFetch<Investment[]>("/api/v1/investments?limit=100")
    );
    if (fetchError) {
      setError(fetchError);
    } else {
      setInvestments(data || []);
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

    const { error: deleteError } = await adminFetch(`/api/v1/investments/${id}`, {
      method: "DELETE",
      headers: { "x-api-key": getAdminApiKey() },
    });
    if (deleteError) {
      setError(deleteError);
    } else {
      setInvestments(investments.filter((i) => i.id !== id));
    }
  };

  const handleToggleFeatured = async (investment: Investment) => {
    const { error: toggleError } = await adminFetch(`/api/v1/investments/${investment.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify({ featured: !investment.featured }),
    });
    if (toggleError) {
      setError(toggleError);
    } else {
      setInvestments(investments.map((i) => (i.id === investment.id ? { ...i, featured: !i.featured } : i)));
    }
  };

  const handleSave = async () => {
    if (!editingInvestment) return;
    setSaving(true);

    const url = isNew
      ? "/api/v1/investments"
      : `/api/v1/investments/${editingInvestment.id}`;
    const method = isNew ? "POST" : "PUT";

    const { error: saveError } = await adminFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify(editingInvestment),
    });

    if (saveError) {
      setError(saveError);
    } else {
      await fetchInvestments();
      setEditingInvestment(null);
      setIsNew(false);
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Categories</label>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 min-h-[42px]">
                {INVESTMENT_CATEGORIES.map((cat) => {
                  const isSelected = editingInvestment.categories?.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        const current = editingInvestment.categories || [];
                        const updated = isSelected
                          ? current.filter((c) => c !== cat)
                          : [...current, cat];
                        setEditingInvestment({
                          ...editingInvestment,
                          categories: updated,
                        });
                      }}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        isSelected
                          ? "bg-amber-500 text-white border-transparent"
                          : "border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

  const filteredInvestments = investments
    .filter((investment) => {
      // Global search
      if (searchQuery && !investment.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Column-specific search
      if (columnFilters.activeColumn === "title" && columnFilters.searchValue) {
        if (!investment.title.toLowerCase().includes(columnFilters.searchValue.toLowerCase())) return false;
      }
      // Tier multi-select filter
      if (tierFilter.length > 0 && !tierFilter.includes(investment.tier || "2")) {
        return false;
      }
      // Status multi-select filter
      if (statusFilter.length > 0 && !statusFilter.includes(investment.status || "active")) {
        return false;
      }
      // Category multi-select filter
      if (categoryFilter.length > 0) {
        const investmentCategories = investment.categories || [];
        if (!categoryFilter.some((cat) => investmentCategories.includes(cat))) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "tier") {
        const tierA = parseInt(a.tier || "2");
        const tierB = parseInt(b.tier || "2");
        return sortOrder === "asc" ? tierA - tierB : tierB - tierA;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Investments ({investments.length})</h1>
        <button
          onClick={() => {
            setEditingInvestment(emptyInvestment);
            setIsNew(true);
          }}
          className={`px-4 py-2 ${theme.addButtonBg} text-white rounded-lg font-medium`}
        >
          Add Investment
        </button>
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onRetry={() => { setError(null); fetchInvestments(); }} />}

      <input
        type="text"
        placeholder="Search investments..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full max-w-md px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
      />

      {loading ? (
        <TableSkeleton
          headers={[
            { label: "", width: "48px" },
            "Title",
            "Tier",
            "Status",
            "Categories",
            { label: "Actions", align: "right" },
          ]}
          rows={10}
          headerColor="bg-amber-100 dark:bg-amber-900/30"
        />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-amber-100 dark:bg-amber-900/30">
              <tr>
                <th className="px-2 py-3 text-left text-sm font-medium w-12"></th>
                <SearchableHeader
                  label="Title"
                  searchKey="title"
                  isActive={columnFilters.isActive("title")}
                  searchValue={columnFilters.searchValue}
                  onSearchOpen={() => columnFilters.openSearch("title")}
                  onSearchClose={columnFilters.closeSearch}
                  onSearchChange={columnFilters.setSearchValue}
                />
                <MultiSelectHeader
                  label="Tier"
                  filterKey="tier"
                  options={tierOptions}
                  selectedValues={tierFilter}
                  isOpen={columnFilters.isActive("tier")}
                  onToggle={() => columnFilters.toggleFilter("tier")}
                  onClose={columnFilters.closeSearch}
                  onSelectionChange={setTierFilter}
                  sortable
                  sortActive={sortBy === "tier"}
                  sortDirection={sortOrder}
                  onSort={() => {
                    if (sortBy === "tier") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortBy("tier");
                      setSortOrder("asc");
                    }
                  }}
                  formatOption={(t) => `Tier ${t}`}
                />
                <MultiSelectHeader
                  label="Status"
                  filterKey="status"
                  options={statusOptions}
                  selectedValues={statusFilter}
                  isOpen={columnFilters.isActive("status")}
                  onToggle={() => columnFilters.toggleFilter("status")}
                  onClose={columnFilters.closeSearch}
                  onSelectionChange={setStatusFilter}
                  formatOption={(s) => s.charAt(0).toUpperCase() + s.slice(1)}
                />
                <MultiSelectHeader
                  label="Categories"
                  filterKey="categories"
                  options={[...INVESTMENT_CATEGORIES]}
                  selectedValues={categoryFilter}
                  isOpen={columnFilters.isActive("categories")}
                  onToggle={() => columnFilters.toggleFilter("categories")}
                  onClose={columnFilters.closeSearch}
                  onSelectionChange={setCategoryFilter}
                />
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredInvestments.map((investment) => (
                <tr
                  key={investment.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-2 py-3">
                    <TableImage src={investment.logo} alt={investment.title} />
                  </td>
                  <td className="px-4 py-3 text-sm">{investment.title}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      investment.tier === "1" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                      investment.tier === "2" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                      investment.tier === "3" ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400" :
                      "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"
                    }`}>
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
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {investment.categories?.slice(0, 3).map((cat) => (
                        <span
                          key={cat}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                          {cat}
                        </span>
                      ))}
                      {(investment.categories?.length || 0) > 3 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                          +{(investment.categories?.length || 0) - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <StarToggle
                        featured={investment.featured || false}
                        onToggle={() => handleToggleFeatured(investment)}
                        label="investment"
                      />
                      <EditButton onClick={() => handleEdit(investment)} variant={theme.buttonVariant} />
                      <DeleteButton onClick={() => handleDelete(investment.id)} />
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
