"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const isLocalhost = typeof window !== "undefined" &&
			(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

		if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY && !isLocalhost) {
			posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
				api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
				person_profiles: "identified_only",
				capture_pageview: true,
				capture_pageleave: true,
			});
		}
	}, []);

	return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Analytics event types
type JobEventProperties = {
	job_id: string;
	job_title: string;
	company_name: string;
	company_category: "portfolio" | "network";
	location?: string;
	is_featured?: boolean;
	is_hot?: boolean;
};

type CandidateEventProperties = {
	candidate_id: string;
	candidate_name: string;
	candidate_title?: string;
	is_featured?: boolean;
};

// Job events
export function trackJobView(props: JobEventProperties) {
	posthog.capture("job_view", props);
}

export function trackJobApplyClick(props: JobEventProperties) {
	posthog.capture("job_apply_click", props);
}

export function trackJobDetailsClick(props: JobEventProperties) {
	posthog.capture("job_details_click", props);
}

// Candidate events
export function trackCandidateView(props: CandidateEventProperties) {
	posthog.capture("candidate_view", props);
}

export function trackCandidateCVClick(props: CandidateEventProperties) {
	posthog.capture("candidate_cv_click", props);
}

export function trackCandidateSocialClick(
	props: CandidateEventProperties & { platform: string; url: string }
) {
	posthog.capture("candidate_social_click", props);
}

export function trackCandidateContactClick(
	props: CandidateEventProperties & { contact_type: "email" | "telegram" | "calendly" }
) {
	posthog.capture("candidate_contact_click", props);
}

// Company events
export function trackCompanyLinkClick(props: {
	company_name: string;
	link_type: "website" | "x" | "github" | "careers";
	source: "job_card" | "job_modal";
}) {
	posthog.capture("company_link_click", props);
}

// News events
type NewsEventProperties = {
	news_id: string;
	news_title: string;
	news_type: "curated" | "blog" | "announcement";
	category: string;
	source?: string; // For curated links
	company?: string; // For announcements
	is_featured?: boolean;
};

export function trackNewsClick(props: NewsEventProperties) {
	posthog.capture("news_click", props);
}
