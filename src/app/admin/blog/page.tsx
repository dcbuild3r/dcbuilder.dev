"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Markdown from "react-markdown";
import { getSourceColor, getSourceDisplay } from "@/lib/source-colors";
import { TableSkeleton, withMinDelay } from "@/components/admin/TableSkeleton";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  description: string;
  source: string | null;
  sourceUrl: string | null;
  content?: string;
  contentLength?: number;
  wordCount?: number;
}

const emptyPost: Partial<BlogPost> & { content: string } = {
  slug: "",
  title: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
  source: "",
  sourceUrl: "",
  content: "",
};

export default function AdminBlog() {
  const searchParams = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<(Partial<BlogPost> & { content: string }) | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "views">("date");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [columnSearch, setColumnSearch] = useState<string | null>(null);
  const [columnSearchValue, setColumnSearchValue] = useState("");
  const [blogViews, setBlogViews] = useState<Record<string, number>>({});
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);

  const getApiKey = () => localStorage.getItem("admin_api_key") || "";

  // Get unique sources from posts
  const sourceOptions = [...new Set(posts.map(p => p.source).filter((s): s is string => !!s))];

  const fetchPosts = useCallback(async () => {
    try {
      const data = await withMinDelay(
        fetch("/api/v1/blog").then(res => res.json())
      );
      setPosts(data.data || []);
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = "Admin | dcbuilder.eth";
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/v1/admin/analytics?type=blog", {
          headers: { "x-api-key": getApiKey() },
        });
        if (res.ok) {
          const data = await res.json();
          setBlogViews(data.data || {});
        }
      } catch (error) {
        console.error("Failed to fetch blog analytics:", error);
      }
    }
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingPost({ ...emptyPost });
      setIsNew(true);
    }
  }, [searchParams]);

  const handleEdit = async (post: BlogPost) => {
    // Fetch full content
    try {
      const res = await fetch(`/api/v1/blog/${post.slug}`);
      const data = await res.json();
      if (data.data) {
        setEditingPost(data.data);
        setIsNew(false);
      }
    } catch (error) {
      console.error("Failed to fetch post:", error);
      alert("Failed to load post content");
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this blog post? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/v1/blog/${slug}`, {
        method: "DELETE",
        headers: { "x-api-key": getApiKey() },
      });
      if (res.ok) {
        setPosts(posts.filter((p) => p.slug !== slug));
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post");
    }
  };

  const handleSave = async () => {
    if (!editingPost) return;
    setSaving(true);

    try {
      const url = isNew ? "/api/v1/blog" : `/api/v1/blog/${editingPost.slug}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": getApiKey(),
        },
        body: JSON.stringify(editingPost),
      });

      if (res.ok) {
        await fetchPosts();
        setEditingPost(null);
        setIsNew(false);
        setShowPreview(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save post");
      }
    } catch (error) {
      console.error("Failed to save post:", error);
      alert("Failed to save post");
    }
    setSaving(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const filteredPosts = posts
    .filter((post) => {
      // Global search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !post.title.toLowerCase().includes(query) &&
          !post.slug.toLowerCase().includes(query) &&
          !post.description.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      // Column-specific search
      if (columnSearch && columnSearchValue) {
        const value = columnSearchValue.toLowerCase();
        if (columnSearch === "title" && !post.title.toLowerCase().includes(value)) return false;
      }
      // Source multi-select filter
      if (sourceFilter.length > 0 && !sourceFilter.includes(post.source || "")) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "views") {
        const viewsA = blogViews[a.slug] || 0;
        const viewsB = blogViews[b.slug] || 0;
        return sortOrder === "desc" ? viewsB - viewsA : viewsA - viewsB;
      }
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  // Editor view
  if (editingPost) {
    return (
      <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex items-center justify-between flex-shrink-0">
          <h1 className="text-2xl font-bold">
            {isNew ? "New Blog Post" : "Edit Blog Post"}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                showPreview
                  ? "bg-blue-600 text-white border-blue-600"
                  : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              }`}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <button
              onClick={() => {
                setEditingPost(null);
                setIsNew(false);
                setShowPreview(false);
              }}
              className="text-neutral-500 hover:text-neutral-700 px-3 py-2"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className={`flex-1 flex gap-4 min-h-0 ${showPreview ? "" : ""}`}>
          {/* Editor Panel */}
          <div className={`flex flex-col bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden ${showPreview ? "w-1/2" : "w-full"}`}>
            {/* Metadata Fields */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3 flex-shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={editingPost.title || ""}
                    onChange={(e) => {
                      const title = e.target.value;
                      setEditingPost({
                        ...editingPost,
                        title,
                        // Auto-generate slug for new posts
                        ...(isNew && !editingPost.slug ? { slug: generateSlug(title) } : {}),
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                    placeholder="My Awesome Blog Post"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Slug *</label>
                  <input
                    type="text"
                    value={editingPost.slug || ""}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, slug: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-mono"
                    placeholder="my-awesome-blog-post"
                    disabled={!isNew}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={editingPost.date || ""}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, date: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Source</label>
                  <input
                    type="text"
                    value={editingPost.source || ""}
                    onChange={(e) =>
                      setEditingPost({ ...editingPost, source: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                    placeholder="Mirror, Substack, etc."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={editingPost.description || ""}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                  placeholder="A brief description of the post..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Source URL</label>
                <input
                  type="url"
                  value={editingPost.sourceUrl || ""}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, sourceUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm"
                  placeholder="https://mirror.xyz/..."
                />
              </div>
            </div>

            {/* Markdown Editor */}
            <div className="flex-1 flex flex-col min-h-0 p-4">
              <label className="block text-sm font-medium mb-2">Content (Markdown) *</label>
              <textarea
                value={editingPost.content || ""}
                onChange={(e) =>
                  setEditingPost({ ...editingPost, content: e.target.value })
                }
                className="flex-1 w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your blog post content in Markdown..."
              />
            </div>

            {/* Save Button */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">
                  {editingPost.content?.trim().split(/\s+/).length || 0} words
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingPost(null);
                      setIsNew(false);
                      setShowPreview(false);
                    }}
                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editingPost.title || !editingPost.slug || !editingPost.content}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <h2 className="font-semibold text-lg">Preview</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {/* Preview Header */}
                <div className="mb-6">
                  <h1 className="text-3xl font-bold mb-2">
                    {editingPost.title || "Untitled Post"}
                  </h1>
                  <p className="text-neutral-500 text-sm">
                    {editingPost.date || "No date"} · {editingPost.content?.trim().split(/\s+/).length || 0} words
                  </p>
                  {editingPost.description && (
                    <p className="mt-2 text-neutral-600 dark:text-neutral-400 italic">
                      {editingPost.description}
                    </p>
                  )}
                </div>
                {/* Preview Content */}
                <div className="prose-custom max-w-none">
                  <Markdown>{editingPost.content || "*No content yet...*"}</Markdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog Posts ({posts.length})</h1>
        <button
          onClick={() => {
            setEditingPost({ ...emptyPost });
            setIsNew(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          New Post
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pr-10 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton columns={6} rows={8} headerColor="bg-sky-100 dark:bg-sky-900/30" headerHeight="h-[46px]" />
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-sky-100 dark:bg-sky-900/30">
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
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">
                  <button
                    onClick={() => {
                      if (sortBy === "views") {
                        setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                      } else {
                        setSortBy("views");
                        setSortOrder("desc");
                      }
                    }}
                    className={`flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white ${sortBy === "views" ? "text-blue-600 dark:text-blue-400" : ""}`}
                  >
                    <span>Views</span>
                    {sortBy === "views" && (
                      <svg className={`w-4 h-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Words</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell relative">
                  {columnSearch === "source" ? (
                    <div className="absolute top-full left-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 z-10 min-w-32 max-h-64 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-neutral-500">Filter by source</span>
                        <button
                          onClick={() => setColumnSearch(null)}
                          className="text-neutral-400 hover:text-neutral-600"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                      {sourceOptions.map((source) => (
                        <label key={source} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 px-1 rounded">
                          <input
                            type="checkbox"
                            checked={sourceFilter.includes(source)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSourceFilter([...sourceFilter, source]);
                              } else {
                                setSourceFilter(sourceFilter.filter((s) => s !== source));
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{getSourceDisplay(source)}</span>
                        </label>
                      ))}
                      {sourceFilter.length > 0 && (
                        <button
                          onClick={() => setSourceFilter([])}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-1">
                    <span>Source</span>
                    {sourceFilter.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 rounded-full">
                        {sourceFilter.length}
                      </span>
                    )}
                    <button
                      onClick={() => setColumnSearch(columnSearch === "source" ? null : "source")}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      title="Filter by source"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                      </svg>
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredPosts.map((post) => (
                <tr
                  key={post.slug}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-sm">{post.title}</p>
                      <p className="text-xs text-neutral-500 font-mono">{post.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{post.date}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500 hidden md:table-cell">
                    {blogViews[post.slug] || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-500 hidden lg:table-cell">
                    {post.wordCount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm hidden lg:table-cell">
                    {post.source ? (
                      <span className={`px-2 py-1 rounded-full text-xs ${getSourceColor(post.source)}`}>
                        {getSourceDisplay(post.source)}
                      </span>
                    ) : (
                      <span className="text-neutral-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-600 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-800/40 transition-colors"
                      >
                        View
                      </a>
                      <button
                        onClick={() => handleEdit(post)}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-800/40 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.slug)}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                    {searchQuery ? "No posts match your search" : "No blog posts yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
