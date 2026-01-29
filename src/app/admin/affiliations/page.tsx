"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ImageInput } from "@/components/admin/ImagePreview";

interface Affiliation {
  id: string;
  title: string;
  role: string;
  description: string | null;
  imageUrl: string | null;
  logo: string | null;
  createdAt: string;
}

const emptyAffiliation: Partial<Affiliation> = {
  title: "",
  role: "",
  description: "",
  imageUrl: "",
  logo: "",
};

export default function AdminAffiliations() {
  const searchParams = useSearchParams();
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAffiliation, setEditingAffiliation] =
    useState<Partial<Affiliation> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const getApiKey = () => localStorage.getItem("admin_api_key") || "";

  const fetchAffiliations = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/affiliations?limit=100");
      const data = await res.json();
      setAffiliations(data.data || []);
    } catch (error) {
      console.error("Failed to fetch affiliations:", error);
    }
    setLoading(false);
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

    try {
      const res = await fetch(`/api/v1/affiliations/${id}`, {
        method: "DELETE",
        headers: { "x-api-key": getApiKey() },
      });
      if (res.ok) {
        setAffiliations(affiliations.filter((a) => a.id !== id));
      } else {
        alert("Failed to delete affiliation");
      }
    } catch (error) {
      console.error("Failed to delete affiliation:", error);
      alert("Failed to delete affiliation");
    }
  };

  const handleSave = async () => {
    if (!editingAffiliation) return;
    setSaving(true);

    try {
      const url = isNew
        ? "/api/v1/affiliations"
        : `/api/v1/affiliations/${editingAffiliation.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify(editingAffiliation),
      });

      if (res.ok) {
        await fetchAffiliations();
        setEditingAffiliation(null);
        setIsNew(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save affiliation");
      }
    } catch (error) {
      console.error("Failed to save affiliation:", error);
      alert("Failed to save affiliation");
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
              <ImageInput
                label="Image URL"
                value={editingAffiliation.imageUrl || ""}
                onChange={(value) =>
                  setEditingAffiliation({ ...editingAffiliation, imageUrl: value })
                }
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Affiliation
        </button>
      </div>

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
                    {affiliation.logo ? (
                      <img
                        src={affiliation.logo}
                        alt={affiliation.title}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-700" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{affiliation.title}</td>
                  <td className="px-4 py-3 text-sm">{affiliation.role}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <button
                      onClick={() => handleEdit(affiliation)}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(affiliation.id)}
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
