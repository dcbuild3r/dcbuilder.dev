"use client";

import { useEffect, useState, useCallback } from "react";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { EditButton, DeleteButton, ErrorAlert } from "@/components/admin/ActionButtons";
import { getAdminApiKey, adminFetch, withMinDelay } from "@/lib/admin-utils";
import { ADMIN_THEMES } from "@/lib/admin-themes";

interface JobRole {
  id: string;
  slug: string;
  label: string;
  createdAt: string;
}

const emptyRole: Partial<JobRole> = {
  slug: "",
  label: "",
};

const theme = ADMIN_THEMES.roles;

export default function AdminJobRoles() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Partial<JobRole> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRoles = useCallback(async () => {
    try {
      const data = await withMinDelay(adminFetch("/api/v1/job-roles"));
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSave = async () => {
    if (!editingRole) return;
    const apiKey = getAdminApiKey();

    try {
      if (isCreating) {
        const newRole = await adminFetch("/api/v1/job-roles", {
          method: "POST",
          headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(editingRole),
        });
        setRoles([...roles, newRole].sort((a, b) => a.label.localeCompare(b.label)));
      } else {
        const updated = await adminFetch("/api/v1/job-roles", {
          method: "PATCH",
          headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(editingRole),
        });
        setRoles(roles.map((r) => (r.id === updated.id ? updated : r)));
      }
      setEditingRole(null);
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save role");
    }
  };

  const handleDelete = async (role: JobRole) => {
    if (!confirm(`Delete role "${role.label}"?`)) return;
    const apiKey = getAdminApiKey();

    try {
      await adminFetch(`/api/v1/job-roles?id=${role.id}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey },
      });
      setRoles(roles.filter((r) => r.id !== role.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <TableSkeleton columns={3} rows={10} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Job Roles</h1>
        <button
          onClick={() => {
            setEditingRole(emptyRole);
            setIsCreating(true);
          }}
          className={`px-4 py-2 ${theme.primary} text-white rounded-lg hover:opacity-90 transition-opacity`}
        >
          + Add Role
        </button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900"
        />
      </div>

      {/* Edit Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold">
              {isCreating ? "Add Role" : "Edit Role"}
            </h2>
            <div>
              <label className="block text-sm font-medium mb-1">Slug</label>
              <input
                type="text"
                value={editingRole.slug || ""}
                onChange={(e) => setEditingRole({ ...editingRole, slug: e.target.value })}
                placeholder="e.g., engineering, design, product"
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
              />
              <p className="text-xs text-neutral-500 mt-1">Used internally, lowercase with hyphens</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input
                type="text"
                value={editingRole.label || ""}
                onChange={(e) => setEditingRole({ ...editingRole, label: e.target.value })}
                placeholder="e.g., Engineering, Design, Product"
                className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
              />
              <p className="text-xs text-neutral-500 mt-1">Displayed to users</p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={() => {
                  setEditingRole(null);
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

      {/* Roles Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-700">
              <th className="text-left py-3 px-4 font-medium">Slug</th>
              <th className="text-left py-3 px-4 font-medium">Label</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role) => (
              <tr
                key={role.id}
                className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                <td className="py-3 px-4 font-mono text-sm">{role.slug}</td>
                <td className="py-3 px-4">{role.label}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <EditButton
                      onClick={() => {
                        setEditingRole(role);
                        setIsCreating(false);
                      }}
                    />
                    <DeleteButton onClick={() => handleDelete(role)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-neutral-500">
        {filteredRoles.length} role{filteredRoles.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
