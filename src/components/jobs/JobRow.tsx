"use client";

import Image from "next/image";
import type { Job } from "@/data/jobs";
import { Pill } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/Button";
import { normalizeJobTags } from "@/lib/job-tags";
import { isNew } from "@/lib/shuffle";

export const PLACEHOLDER_LOGO =
  "https://pub-a22f31a467534add843b6cf22cf4f443.r2.dev/candidates/anonymous-placeholder.svg";

export function JobRow({
  job,
  isHot,
  getTagLabel,
  onOpen,
  onDetails,
  onApply,
}: {
  job: Job;
  isHot: boolean;
  getTagLabel: (tag: string) => string;
  onOpen: () => void;
  onDetails: () => void;
  onApply: () => void;
}) {
  const displayTags = normalizeJobTags(job.tags).filter((tag) => tag !== "hot");
  const meta = [
    job.location,
    job.remote && "Remote",
    job.type && job.type.replace("-", " "),
    job.salary,
  ].filter(Boolean);

  return (
    <article className="flex flex-wrap items-start gap-x-5 gap-y-3 px-5 py-5 sm:px-6">
      <Image
        src={job.company.logo || PLACEHOLDER_LOGO}
        alt=""
        width={56}
        height={56}
        className="size-14 shrink-0 rounded-xl bg-white object-contain"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = PLACEHOLDER_LOGO;
        }}
      />
      <div className="min-w-0 flex-[1_1_20rem]">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h2 className="text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ink">
            <button
              type="button"
              onClick={onOpen}
              className="text-left hover:text-accent"
            >
              {job.title}
            </button>
          </h2>
          {isHot && <Pill className="bg-gradient-to-r from-orange-500 to-amber-500 font-semibold text-white shadow-[0_0_10px_rgb(251_146_60/0.5)]">Hot</Pill>}
          {job.featured && (
            <span role="img" aria-label="Featured" title="Featured" className="flex">
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24">
                <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z" />
              </svg>
            </span>
          )}
          {isNew(job.createdAt) && <Pill variant="outline">New</Pill>}
        </div>
        <p className="mt-1 text-[14.5px] text-body">
          {job.company.name}{" "}
          <span className="text-muted">
            · {job.company.category === "portfolio" ? "Portfolio" : "Network"}
          </span>
        </p>
        {meta.length > 0 && (
          <p className="mt-2 font-mono text-xs leading-relaxed text-muted">{meta.join(" · ")}</p>
        )}
        {displayTags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {displayTags.map((tag, index) => (
              <Pill key={tag} className={index >= 3 ? "hidden sm:inline-flex" : ""}>
                {getTagLabel(tag)}
              </Pill>
            ))}
            {displayTags.length > 3 && (
              <span className="px-1 py-0.5 text-xs text-muted sm:hidden">
                +{displayTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDetails}
          className={buttonClass({ variant: "secondary", className: "rounded-full" })}
          aria-label={`View details for ${job.title} at ${job.company.name}`}
        >
          Details
        </button>
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onApply}
          className={buttonClass({ variant: "primary", className: "rounded-full" })}
        >
          Apply ↗
        </a>
      </div>
    </article>
  );
}
