"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fredoka } from "next/font/google";
import { ThemeToggle } from "@/components/ThemeToggle";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600"],
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [inputKey, setInputKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  const validateKey = async (key: string) => {
    try {
      const res = await fetch("/api/v1/admin/auth", {
        headers: { "x-api-key": key },
      });
      if (res.ok) {
        setIsAuthenticated(true);
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

  useEffect(() => {
    document.title = "Admin | dcbuilder.eth";
  }, []);

  useEffect(() => {
    const storedKey = localStorage.getItem("admin_api_key");
    let isActive = true;
    const finishLoading = () => {
      if (isActive) setIsLoading(false);
    };
    if (storedKey) {
      const validateStoredKey = async () => {
        try {
          const res = await fetch("/api/v1/admin/auth", {
            headers: { "x-api-key": storedKey },
          });
          if (!isActive) return;
          if (res.ok) {
            setIsAuthenticated(true);
            localStorage.setItem("admin_api_key", storedKey);
          } else {
            localStorage.removeItem("admin_api_key");
            setIsAuthenticated(false);
          }
        } catch {
          if (isActive) {
            setIsAuthenticated(false);
          }
        }
        finishLoading();
      };
      validateStoredKey();
      return () => {
        isActive = false;
      };
    } else {
      finishLoading();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    validateKey(inputKey);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_api_key");
    setIsAuthenticated(false);
  };

  // Order: Dashboard, Affiliations (About page), Blog, News, Portfolio, Jobs, Candidates
  const navItems = [
    { href: "/admin", label: "Dashboard", color: "neutral", bg: "bg-neutral-100 dark:bg-neutral-800", bgHover: "hover:bg-neutral-200 dark:hover:bg-neutral-700", bgActive: "bg-neutral-700 dark:bg-neutral-600", text: "text-neutral-600 dark:text-neutral-400" },
    { href: "/admin/affiliations", label: "Affiliations", color: "pink", bg: "bg-pink-100 dark:bg-pink-900/30", bgHover: "hover:bg-pink-200 dark:hover:bg-pink-800/40", bgActive: "bg-pink-500 dark:bg-pink-600", text: "text-pink-600 dark:text-pink-400" },
    { href: "/admin/blog", label: "Blog", color: "indigo", bg: "bg-indigo-100 dark:bg-indigo-900/30", bgHover: "hover:bg-indigo-200 dark:hover:bg-indigo-800/40", bgActive: "bg-indigo-500 dark:bg-indigo-600", text: "text-indigo-600 dark:text-indigo-400" },
    { href: "/admin/news", label: "News", color: "purple", bg: "bg-purple-100 dark:bg-purple-900/30", bgHover: "hover:bg-purple-200 dark:hover:bg-purple-800/40", bgActive: "bg-purple-500 dark:bg-purple-600", text: "text-purple-600 dark:text-purple-400" },
    { href: "/admin/investments", label: "Portfolio", color: "amber", bg: "bg-amber-100 dark:bg-amber-900/30", bgHover: "hover:bg-amber-200 dark:hover:bg-amber-800/40", bgActive: "bg-amber-500 dark:bg-amber-600", text: "text-amber-600 dark:text-amber-400" },
    { href: "/admin/jobs", label: "Jobs", color: "blue", bg: "bg-blue-100 dark:bg-blue-900/30", bgHover: "hover:bg-blue-200 dark:hover:bg-blue-800/40", bgActive: "bg-blue-500 dark:bg-blue-600", text: "text-blue-600 dark:text-blue-400" },
    { href: "/admin/candidates", label: "Candidates", color: "green", bg: "bg-green-100 dark:bg-green-900/30", bgHover: "hover:bg-green-200 dark:hover:bg-green-800/40", bgActive: "bg-green-500 dark:bg-green-600", text: "text-green-600 dark:text-green-400" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-neutral-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950 px-4">
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
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className={`text-3xl ${fredoka.className}`}>
                <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Admin
                </span>
              </Link>
              <div className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      pathname === item.href
                        ? `${item.bgActive} text-white`
                        : `${item.bg} ${item.text} ${item.bgHover}`
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/"
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-cyan-100 text-cyan-600 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:hover:bg-cyan-800/40 transition-colors"
              >
                View Site
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40 transition-colors"
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
