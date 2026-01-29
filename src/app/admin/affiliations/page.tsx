"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ImageInput } from "@/components/admin/ImagePreview";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { getAdminApiKey, adminFetch, withMinDelay } from "@/lib/admin-utils";
import { EditButton, DeleteButton, TableImage, ErrorAlert } from "@/components/admin/ActionButtons";
import { ADMIN_THEMES } from "@/lib/admin-themes";

interface Affiliation {
  id: string;
  title: string;
  role: string;
  description: string | null;
  imageUrl: string | null;
  logo: string | null;
  website: string | null;
  createdAt: string;
}

const emptyAffiliation: Partial<Affiliation> = {
  title: "",
  role: "",
  description: "",
  imageUrl: "",
  logo: "",
  website: "",
};

export default function AdminAffiliations() {
  const searchParams = useSearchParams();
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAffiliation, setEditingAffiliation] =
    useState<Partial<Affiliation> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = ADMIN_THEMES.affiliations;

  const fetchAffiliations = useCallback(async () => {
    setError(null);
    const { data, error: fetchError } = await withMinDelay(
      adminFetch<Affiliation[]>("/api/v1/affiliations?limit=100")
    );
    if (fetchError) {
      setError(fetchError);
    } else {
      setAffiliations(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = "Admin | dcbuilder.eth";
  }, []);

  useEffect(() => {
    fetchAffiliations();
  }, [fetchAffiliations]);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingAffiliation(emptyAffiliation);
      setIsNew(true);
    }
  }, [searchParams]);

  const handleEdit = (affiliation: Affiliation) => {
    setEditingAffiliation(affiliation);
    setIsNew(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this affiliation?")) return;

    const { error: deleteError } = await adminFetch(`/api/v1/affiliations/${id}`, {
      method: "DELETE",
      headers: { "x-api-key": getAdminApiKey() },
    });
    if (deleteError) {
      setError(deleteError);
    } else {
      setAffiliations(affiliations.filter((a) => a.id !== id));
    }
  };

  const handleSave = async () => {
    if (!editingAffiliation) return;
    setSaving(true);

    const url = isNew
      ? "/api/v1/affiliations"
      : `/api/v1/affiliations/${editingAffiliation.id}`;
    const method = isNew ? "POST" : "PUT";

    const { error: saveError } = await adminFetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": getAdminApiKey(),
      },
      body: JSON.stringify(editingAffiliation),
    });

    if (saveError) {
      setError(saveError);
    } else {
      await fetchAffiliations();
      setEditingAffiliation(null);
      setIsNew(false);
    }
    setSaving(false);
  };

  if (editingAffiliation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            {isNew ? "Add New Affiliation" : "Edit Affiliation"}
          </h1>
          <button
            onClick={() => {
              setEditingAffiliation(null);
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
                value={editingAffiliation.title || ""}
                onChange={(e) =>
                  setEditingAffiliation({
                    ...editingAffiliation,
                    title: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role *</label>
              <input
                type="text"
                value={editingAffiliation.role || ""}
                onChange={(e) =>
                  setEditingAffiliation({
                    ...editingAffiliation,
                    role: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                placeholder="e.g., Advisor, Investor, Contributor"
              />
            </div>

            <div>
              <ImageInput
                label="Logo URL"
                value={editingAffiliation.logo || ""}
                onChange={(value) =>
                  setEditingAffiliation({ ...editingAffiliation, logo: value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                value={editingAffiliation.website || ""}
                onChange={(e) =>
                  setEditingAffiliation({ ...editingAffiliation, website: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={editingAffiliation.description || ""}
              onChange={(e) =>
                setEditingAffiliation({
                  ...editingAffiliation,
                  description: e.target.value,
                })
              }
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            />
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
                setEditingAffiliation(null);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Affiliations ({affiliations.length})</h1>
        <button
          onClick={() => {
            setEditingAffiliation(emptyAffiliation);
            setIsNew(true);
          }}
          className={`px-4 py-2 ${theme.addButtonBg} text-white rounded-lg font-medium`}
        >
          Add Affiliation
        </button>
      </div>

      {/* Error Alert */}
      {error && <ErrorAlert message={error} onRetry={() => { setError(null); fetchAffiliations(); }} />}

      {loading ? (
        <TableSkeleton columns={4} rows={8} headerColor="bg-pink-100 dark:bg-pink-900/30" headerHeight="h-[44px]" />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-pink-100 dark:bg-pink-900/30">
              <tr>
                <th className="px-2 py-3 text-left text-sm font-medium w-12">

                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  Role
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {affiliations.map((affiliation) => (
                <tr
                  key={affiliation.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-2 py-3">
                    <TableImage src={affiliation.logo} alt={affiliation.title} />
                  </td>
                  <td className="px-4 py-3 text-sm">{affiliation.title}</td>
                  <td className="px-4 py-3 text-sm">{affiliation.role}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <EditButton onClick={() => handleEdit(affiliation)} variant={theme.buttonVariant} />
                      <DeleteButton onClick={() => handleDelete(affiliation.id)} />
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
