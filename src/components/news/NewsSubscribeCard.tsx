"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { fieldClass } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const NEWSLETTER_OPTIONS = [
	{ value: "news", label: "News digest" },
	{ value: "portfolio", label: "Portfolio news" },
	{ value: "jobs", label: "Jobs updates" },
	{ value: "candidates", label: "Candidate updates" },
] as const;

/** Compact subscribe card for the /news header: email, newsletter-type preferences, submit states. */
export function NewsSubscribeCard() {
	const emailId = useId();
	const [email, setEmail] = useState("");
	const [selected, setSelected] = useState<string[]>(["news"]);
	const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
	const [message, setMessage] = useState("");

	const toggleOption = (value: string) => {
		setSelected((current) =>
			current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
		);
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
					source: "news-page-compact-tools",
				}),
			});
			const payload = await response.json();

			if (!response.ok) {
				setStatus("error");
				setMessage(payload.error || "Unable to subscribe");
				return;
			}

			setStatus("success");
			setMessage("Check your inbox to confirm.");
			setEmail("");
		} catch {
			setStatus("error");
			setMessage("Unable to subscribe right now. Try again later.");
		}
	};

	return (
		<form
			onSubmit={onSubmit}
			className="w-full rounded-2xl bg-accent-soft p-5 lg:w-[420px]"
		>
			<label htmlFor={emailId} className="block text-[15px] font-semibold text-ink">
				Get the digest by email
			</label>
			<div className="mt-3 flex flex-wrap gap-2">
				<input
					id={emailId}
					type="email"
					required
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					placeholder="you@example.com"
					className={cn(fieldClass, "min-w-44 flex-1 rounded-full px-4")}
				/>
				<button
					type="submit"
					disabled={status === "submitting" || selected.length === 0}
					className={buttonClass({ variant: "accent" })}
				>
					{status === "submitting" ? "Joining..." : "Subscribe"}
				</button>
			</div>
			<div role="group" aria-label="Newsletter types" className="mt-3 flex flex-wrap gap-1.5">
				{NEWSLETTER_OPTIONS.map((option) => (
					<button
						key={option.value}
						type="button"
						aria-pressed={selected.includes(option.value)}
						onClick={() => toggleOption(option.value)}
						className={cn(
							"min-h-9 rounded-full px-3 text-[13px] font-medium transition-colors",
							selected.includes(option.value)
								? "bg-inverse text-inverse-ink"
								: "border border-line-strong bg-surface text-body hover:bg-surface-2",
						)}
					>
						{option.label}
					</button>
				))}
			</div>
			{message && (
				<p
					role="status"
					className={cn("mt-2 text-sm", status === "error" ? "text-warm" : "text-accent-ink")}
				>
					{message}
				</p>
			)}
			<Link
				href="/newsletters"
				className="mt-1 inline-flex min-h-11 items-center text-[13.5px] text-accent-ink hover:underline"
			>
				Browse past issues
			</Link>
		</form>
	);
}
