"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  jobs: number;
  candidates: number;
  curatedLinks: number;
  announcements: number;
  investments: number;
  affiliations: number;
  blogPosts: number;
}

interface SiteStats {
  pageviews7d: number;
  pageviews30d: number;
  uniqueVisitors7d: number;
  uniqueVisitors30d: number;
}

interface AnalyticsData {
  jobClicks: Record<string, number>;
  candidateViews: Record<string, number>;
  siteStats?: SiteStats;
}

interface Candidate {
  id: string;
  name: string;
  title: string | null;
  image: string | null;
}

interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
}

// Skeleton for analytics list items
function AnalyticsListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-neutral-200 dark:bg-neutral-700 rounded" />
              <div className="h-3 w-20 bg-neutral-100 dark:bg-neutral-700/50 rounded" />
            </div>
          </div>
          <div className="h-4 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const getApiKey = () => localStorage.getItem("admin_api_key") || "";

  useEffect(() => {
    document.title = "Admin | dcbuilder.eth";
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [jobsRes, candidatesRes, curatedRes, announcementsRes, investmentsRes, affiliationsRes, blogRes] =
          await Promise.all([
            fetch("/api/v1/jobs?limit=500"),
            fetch("/api/v1/candidates?limit=500"),
            fetch("/api/v1/news/curated?limit=500"),
            fetch("/api/v1/news/announcements?limit=500"),
            fetch("/api/v1/investments?limit=500"),
            fetch("/api/v1/affiliations?limit=500"),
            fetch("/api/v1/blog"),
          ]);

        const [jobsData, candidatesData, curatedData, announcementsData, investmentsData, affiliationsData, blogData] =
          await Promise.all([
            jobsRes.json(),
            candidatesRes.json(),
            curatedRes.json(),
            announcementsRes.json(),
            investmentsRes.json(),
            affiliationsRes.json(),
            blogRes.json(),
          ]);

        setStats({
          jobs: jobsData.data?.length || 0,
          candidates: candidatesData.data?.length || 0,
          curatedLinks: curatedData.data?.length || 0,
          announcements: announcementsData.data?.length || 0,
          investments: investmentsData.data?.length || 0,
          affiliations: affiliationsData.data?.length || 0,
          blogPosts: blogData.data?.length || 0,
        });

        setCandidates(candidatesData.data || []);
        setJobs(jobsData.data || []);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
      setLoading(false);
    }

    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/v1/admin/analytics", {
          headers: { "x-api-key": getApiKey() },
        });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
      setAnalyticsLoading(false);
    }

    fetchStats();
    fetchAnalytics();
  }, []);

  const statCards = [
    {
      label: "Jobs",
      value: stats?.jobs ?? "-",
      href: "/admin/jobs",
      color: "bg-blue-500",
    },
    {
      label: "Candidates",
      value: stats?.candidates ?? "-",
      href: "/admin/candidates",
      color: "bg-green-500",
    },
    {
      label: "Curated Links",
      value: stats?.curatedLinks ?? "-",
      href: "/admin/news",
      color: "bg-purple-500",
    },
    {
      label: "Announcements",
      value: stats?.announcements ?? "-",
      href: "/admin/news",
      color: "bg-orange-500",
    },
    {
      label: "Investments",
      value: stats?.investments ?? "-",
      href: "/admin/investments",
      color: "bg-amber-500",
    },
    {
      label: "Affiliations",
      value: stats?.affiliations ?? "-",
      href: "/admin/affiliations",
      color: "bg-pink-500",
    },
    {
      label: "Blog Posts",
      value: stats?.blogPosts ?? "-",
      href: "/admin/blog",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Manage your site content
        </p>
      </div>

      {/* Site Traffic Stats - Static containers, only numbers update */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">Pageviews (7d)</p>
          <p className="text-3xl font-bold">
            {analytics?.siteStats ? analytics.siteStats.pageviews7d.toLocaleString() : "0"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">Unique Visitors (7d)</p>
          <p className="text-3xl font-bold">
            {analytics?.siteStats ? analytics.siteStats.uniqueVisitors7d.toLocaleString() : "0"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">Pageviews (30d)</p>
          <p className="text-3xl font-bold">
            {analytics?.siteStats ? analytics.siteStats.pageviews30d.toLocaleString() : "0"}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white">
          <p className="text-sm opacity-80">Unique Visitors (30d)</p>
          <p className="text-3xl font-bold">
            {analytics?.siteStats ? analytics.siteStats.uniqueVisitors30d.toLocaleString() : "0"}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg`} />
              <div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {card.label}
                </p>
                <p className="text-2xl font-bold">
                  {loading ? "..." : card.value}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/jobs?action=new"
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl text-blue-500">+</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">Add New Job</span>
          </Link>
          <Link
            href="/admin/candidates?action=new"
            className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl text-green-500">+</span>
            <span className="font-medium text-green-600 dark:text-green-400">Add New Candidate</span>
          </Link>
          <Link
            href="/admin/news?action=new"
            className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl text-purple-500">+</span>
            <span className="font-medium text-purple-600 dark:text-purple-400">Add Curated Link</span>
          </Link>
          <Link
            href="/admin/investments?action=new"
            className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl text-amber-500">+</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">Add Investment</span>
          </Link>
          <Link
            href="/admin/affiliations?action=new"
            className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-4 border border-pink-200 dark:border-pink-800/50 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl text-pink-500">+</span>
            <span className="font-medium text-pink-600 dark:text-pink-400">Add Affiliation</span>
          </Link>
          <Link
            href="/admin/blog?action=new"
            className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl text-indigo-500">+</span>
            <span className="font-medium text-indigo-600 dark:text-indigo-400">New Blog Post</span>
          </Link>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Candidates */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-green-500">👁</span> Top Viewed Candidates (7d)
          </h2>
          {analyticsLoading ? (
            <AnalyticsListSkeleton rows={5} />
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics?.candidateViews || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([candidateId, views]) => {
                  const candidate = candidates.find((c) => c.id === candidateId);
                  return (
                    <div
                      key={candidateId}
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800"
                    >
                      <div className="flex items-center gap-3">
                        {candidate?.image ? (
                          <img
                            src={candidate.image}
                            alt={candidate.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {candidate?.name || candidateId}
                          </p>
                          {candidate?.title && (
                            <p className="text-xs text-neutral-500">{candidate.title}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {views} views
                      </span>
                    </div>
                  );
                })}
              {Object.keys(analytics?.candidateViews || {}).length === 0 && (
                <p className="text-neutral-500 text-sm">No views data available</p>
              )}
            </div>
          )}
        </div>

        {/* Top Clicked Jobs */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-blue-500">🔥</span> Top Applied Jobs (7d)
          </h2>
          {analyticsLoading ? (
            <AnalyticsListSkeleton rows={5} />
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics?.jobClicks || {})
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([jobId, clicks]) => {
                  const job = jobs.find((j) => j.id === jobId);
                  return (
                    <div
                      key={jobId}
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800"
                    >
                      <div className="flex items-center gap-3">
                        {job?.companyLogo ? (
                          <img
                            src={job.companyLogo}
                            alt={job.company}
                            className="w-8 h-8 rounded object-contain bg-white p-0.5"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-neutral-200 dark:bg-neutral-700" />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {job?.title || jobId}
                          </p>
                          {job?.company && (
                            <p className="text-xs text-neutral-500">{job.company}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {clicks} clicks
                      </span>
                    </div>
                  );
                })}
              {Object.keys(analytics?.jobClicks || {}).length === 0 && (
                <p className="text-neutral-500 text-sm">No clicks data available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
