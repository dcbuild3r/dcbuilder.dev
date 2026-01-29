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
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [jobsRes, candidatesRes, curatedRes, announcementsRes, investmentsRes, affiliationsRes] =
          await Promise.all([
            fetch("/api/v1/jobs?limit=500"),
            fetch("/api/v1/candidates?limit=500"),
            fetch("/api/v1/news/curated?limit=500"),
            fetch("/api/v1/news/announcements?limit=500"),
            fetch("/api/v1/investments?limit=500"),
            fetch("/api/v1/affiliations?limit=500"),
          ]);

        const [jobsData, candidatesData, curatedData, announcementsData, investmentsData, affiliationsData] =
          await Promise.all([
            jobsRes.json(),
            candidatesRes.json(),
            curatedRes.json(),
            announcementsRes.json(),
            investmentsRes.json(),
            affiliationsRes.json(),
          ]);

        setStats({
          jobs: jobsData.data?.length || 0,
          candidates: candidatesData.data?.length || 0,
          curatedLinks: curatedData.data?.length || 0,
          announcements: announcementsData.data?.length || 0,
          investments: investmentsData.data?.length || 0,
          affiliations: affiliationsData.data?.length || 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
      setLoading(false);
    }

    fetchStats();
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
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2">
          Manage your site content
        </p>
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
            className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">+</span>
            <span className="font-medium">Add New Job</span>
          </Link>
          <Link
            href="/admin/candidates?action=new"
            className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:border-green-500 dark:hover:border-green-500 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">+</span>
            <span className="font-medium">Add New Candidate</span>
          </Link>
          <Link
            href="/admin/news?action=new"
            className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:border-purple-500 dark:hover:border-purple-500 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">+</span>
            <span className="font-medium">Add Curated Link</span>
          </Link>
          <Link
            href="/admin/investments?action=new"
            className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-500 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">+</span>
            <span className="font-medium">Add Investment</span>
          </Link>
          <Link
            href="/admin/affiliations?action=new"
            className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 hover:border-pink-500 dark:hover:border-pink-500 transition-colors flex items-center gap-3"
          >
            <span className="text-2xl">+</span>
            <span className="font-medium">Add Affiliation</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
