"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const storedKey = localStorage.getItem("admin_api_key");
    if (storedKey) {
      setApiKey(storedKey);
      validateKey(storedKey);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateKey = async (key: string) => {
    try {
      const res = await fetch("/api/v1/jobs?limit=1", {
        headers: { "x-api-key": key },
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setApiKey(key);
        localStorage.setItem("admin_api_key", key);
      } else {
        localStorage.removeItem("admin_api_key");
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    validateKey(inputKey);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_api_key");
    setApiKey(null);
    setIsAuthenticated(false);
  };

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/jobs", label: "Jobs" },
    { href: "/admin/candidates", label: "Candidates" },
    { href: "/admin/news", label: "News" },
    { href: "/admin/investments", label: "Investments" },
    { href: "/admin/affiliations", label: "Affiliations" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="apiKey"
                  className="block text-sm font-medium mb-2"
                >
                  API Key
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your API key"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="font-bold text-xl">
                Admin
              </Link>
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                View Site
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
    </div>
  );
}
