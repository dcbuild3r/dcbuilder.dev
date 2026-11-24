"use client";

import { FormEvent, useState } from "react";
import { fieldClass } from "@/components/ui/field";

const OPTIONS = [
  { value: "news", label: "News digest" },
  { value: "jobs", label: "Jobs performance updates" },
  { value: "candidates", label: "Candidates performance updates" },
] as const;

export function NewsletterSignup() {
  const [isOpen, setIsOpen] = useState(false);
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
    <section className="rounded-2xl bg-accent-soft p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-ink">Newsletter</h2>
          <p className="mt-2 text-[15px] leading-snug text-body">
            Subscribe to news digests and performance updates for jobs and candidates.
          </p>
        </div>

        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="newsletter-signup-form"
          onClick={() => setIsOpen((value) => !value)}
          className="group inline-flex items-center justify-center min-h-11 rounded-full bg-accent px-5 text-sm font-medium text-white transition-opacity hover:opacity-85"
        >
          {isOpen ? "Hide Subscribe Form" : "Subscribe"}
        </button>
      </div>

      {isOpen && (
        <form id="newsletter-signup-form" className="mt-4 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-sm text-body">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={`mt-1 w-full ${fieldClass}`}
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm text-body">Newsletter types</legend>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {OPTIONS.map((option) => (
                <label key={option.value} className="inline-flex min-h-11 items-center gap-2 text-sm text-body">
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggleOption(option.value)}
                    className="size-4 rounded border-line-strong accent-[var(--accent)]"
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={status === "submitting" || selected.length === 0}
            className="min-h-11 rounded-full bg-inverse px-5 text-sm font-medium text-inverse-ink disabled:opacity-50"
          >
            {status === "submitting" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>
      )}

      {message && (
        <p
          className={`mt-3 text-sm ${
            status === "error"
              ? "text-warm"
              : "text-accent-ink"
          }`}
        >
          {message}
        </p>
      )}
    </section>
  );
}
