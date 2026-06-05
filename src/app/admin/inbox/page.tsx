"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { adminFetch, getAdminApiKey } from "@/lib/admin-utils";
import { ErrorAlert } from "@/components/admin/ActionButtons";

type Submission = {
  id: string;
  kind: "job" | "candidate" | "message";
  status: "pending" | "approved" | "rejected";
  priority: "low" | "normal" | "high";
  title: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterType: string;
  currentPayload: unknown;
  originalPayload: unknown;
  liveRecordId: string | null;
  createdAt: string;
  comments?: Array<{ id: string; body: string; authorName: string | null; createdAt: string }>;
};

export default function AdminInboxPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Submission | null>(null);
  const [payloadText, setPayloadText] = useState("");
  const [comment, setComment] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = getAdminApiKey();
  const headers = useMemo(() => ({ "x-api-key": apiKey, "Content-Type": "application/json" }), [apiKey]);

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
    const result = await adminFetch<Submission[]>(`/api/agent/inbox${query}`, { headers });
    if (result.error) {
      setError(result.error);
    } else {
      setItems(result.data ?? []);
      if (!selectedId && result.data?.[0]) setSelectedId(result.data[0].id);
    }
    setLoading(false);
  }, [headers, selectedId, statusFilter]);

  const fetchSelected = useCallback(async () => {
    if (!selectedId) {
      setSelected(null);
      setPayloadText("");
      return;
    }
    const result = await adminFetch<Submission>(`/api/agent/inbox/${selectedId}`, { headers });
    if (result.error) {
      setError(result.error);
      return;
    }
    setSelected(result.data);
    setPayloadText(JSON.stringify(result.data?.currentPayload ?? {}, null, 2));
  }, [headers, selectedId]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  useEffect(() => {
    fetchSelected();
  }, [fetchSelected]);

  const submitAction = async (action: "approve" | "reject") => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const payload = payloadText.trim() ? JSON.parse(payloadText) : {};
      const body = action === "approve" ? { payload, note: comment } : { reason: comment || "Rejected in admin inbox" };
      const result = await adminFetch<Submission>(`/api/agent/inbox/${selected.id}/${action}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSelected(result.data);
        await fetchInbox();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON payload");
    } finally {
      setBusy(false);
    }
  };

  const submitComment = async () => {
    if (!selected || !comment.trim()) return;
    setBusy(true);
    const result = await adminFetch(`/api/agent/inbox/${selected.id}/comments`, {
      method: "POST",
      headers,
      body: JSON.stringify({ body: comment }),
    });
    if (result.error) setError(result.error);
    else {
      setComment("");
      await fetchSelected();
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Agent Inbox</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Review agent submissions, edit payloads, and approve or reject creates.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => { setError(null); fetchInbox(); }} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold dark:border-neutral-800 dark:bg-neutral-900">
            {loading ? "Loading..." : `${items.length} submission${items.length === 1 ? "" : "s"}`}
          </div>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`block w-full px-4 py-3 text-left transition-colors ${
                  selectedId === item.id ? "bg-cyan-50 dark:bg-cyan-950/30" : "hover:bg-neutral-50 dark:hover:bg-neutral-900"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{item.title || item.id}</span>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    {item.kind}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  {item.priority} priority · {item.submitterName || item.submitterType}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800">
          {selected ? (
            <div className="space-y-5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{selected.title || selected.id}</h2>
                  <p className="text-sm text-neutral-500">
                    {selected.kind} · {selected.status} · {selected.submitterName || selected.submitterType}
                  </p>
                </div>
                {selected.liveRecordId && (
                  <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-950 dark:text-green-300">
                    live: {selected.liveRecordId}
                  </span>
                )}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Current payload</span>
                <textarea
                  value={payloadText}
                  onChange={(event) => setPayloadText(event.target.value)}
                  className="min-h-80 w-full rounded-lg border border-neutral-200 bg-white p-3 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-950"
                  spellCheck={false}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Comment or decision note</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="min-h-24 w-full rounded-lg border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button onClick={submitComment} disabled={busy || !comment.trim()} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900">
                  Add comment
                </button>
                <button onClick={() => submitAction("approve")} disabled={busy || selected.status !== "pending"} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  Approve
                </button>
                <button onClick={() => submitAction("reject")} disabled={busy || selected.status !== "pending"} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
                  Reject
                </button>
              </div>

              {selected.comments && selected.comments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Comments</h3>
                  {selected.comments.map((entry) => (
                    <div key={entry.id} className="rounded border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                      <div className="text-xs text-neutral-500">{entry.authorName || "Agent"} · {new Date(entry.createdAt).toLocaleString()}</div>
                      <p className="mt-1 whitespace-pre-wrap">{entry.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-sm text-neutral-500">Select a submission to review.</div>
          )}
        </div>
      </div>
    </div>
  );
}
