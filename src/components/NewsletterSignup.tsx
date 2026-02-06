"use client";

import { FormEvent, useState } from "react";

const OPTIONS = [
  { value: "news", label: "News digest" },
  { value: "jobs", label: "Jobs performance updates" },
  { value: "candidates", label: "Candidates performance updates" },
] as const;

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<string[]>(["news"]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const toggleOption = (value: string) => {
    setSelected((current) => (
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    ));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/v1/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newsletterTypes: selected,
          source: "news-page",
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(payload.error || "Unable to subscribe");
        return;
      }

      setStatus("success");
      setMessage("Please check your inbox and confirm your subscription.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Unable to subscribe right now. Try again later.");
    }
  };

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-6 bg-neutral-50 dark:bg-neutral-900/40">
      <h2 className="text-xl font-semibold">Newsletter</h2>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        Subscribe to news digests and performance updates for jobs and candidates.
      </p>

      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-sm text-neutral-700 dark:text-neutral-300">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm text-neutral-700 dark:text-neutral-300">Newsletter types</legend>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {OPTIONS.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="h-4 w-4 rounded border-neutral-300 dark:border-neutral-700"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={status === "submitting" || selected.length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {status === "submitting" ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 text-sm ${
            status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-green-700 dark:text-green-400"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
