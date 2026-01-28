# PostHog Analytics & Data-Driven HOT Tag Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate PostHog analytics to track job/candidate engagement and use analytics data to automatically power the HOT tag based on apply click velocity.

**Architecture:**
- PostHog SDK captures client-side events (job views, apply clicks, candidate interactions)
- Events stored in PostHog with properties for filtering/aggregation
- Server-side API route fetches analytics from PostHog to determine which jobs should be "hot"
- HOT tag can be manual (current) OR data-driven (new) based on apply click velocity

**Tech Stack:** PostHog JS SDK, Next.js App Router, PostHog API

---

## Phase 1: Complete PostHog Integration

### Task 1: Add PostHog Provider to Layout

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Update layout to wrap with PostHogProvider**

The import was already added. Now wrap children:

```tsx
// In the return statement, wrap ThemeProvider with PostHogProvider:
<PostHogProvider>
  <ThemeProvider>{children}</ThemeProvider>
</PostHogProvider>
```

**Step 2: Create environment variables**

Create `.env.local` (gitignored) with:
```
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_project_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

**Step 3: Test locally**

Run: `bun run dev`
Open browser devtools Network tab, look for requests to `posthog.com`

**Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add PostHog provider to app layout"
```

---

### Task 2: Add Job Event Tracking to JobsGrid

**Files:**
- Modify: `src/components/JobsGrid.tsx`

**Step 1: Import tracking functions**

At the top of the file, add:
```tsx
import {
  trackJobView,
  trackJobApplyClick,
  trackJobDetailsClick,
  trackCompanyLinkClick,
} from "@/lib/posthog";
```

**Step 2: Create helper to build job event properties**

Add inside the component (after state declarations):
```tsx
const getJobEventProps = (job: Job) => ({
  job_id: job.id,
  job_title: job.title,
  company_name: job.company.name,
  company_category: job.company.category,
  location: job.location,
  is_featured: job.featured ?? false,
  is_hot: job.tags?.includes("hot") ?? false,
});
```

**Step 3: Track job modal open**

In the `openJob` function, add tracking:
```tsx
const openJob = useCallback((job: Job) => {
  setExpandedJob(job);
  updateUrlParams({ job: job.id });
  trackJobView(getJobEventProps(job));
}, [updateUrlParams]);
```

**Step 4: Track Apply button clicks**

Find the Apply button `<a>` element in the job card and add onClick:
```tsx
onClick={(e) => {
  e.stopPropagation();
  trackJobApplyClick(getJobEventProps(job));
}}
```

Also in the modal's Apply button.

**Step 5: Track View Details clicks**

On the View details button:
```tsx
onClick={(e) => {
  e.stopPropagation();
  trackJobDetailsClick(getJobEventProps(job));
  openJob(job);
}}
```

**Step 6: Test tracking**

Run: `bun run dev`
Open PostHog dashboard or browser devtools to verify events fire

**Step 7: Commit**

```bash
git add src/components/JobsGrid.tsx
git commit -m "feat: add PostHog event tracking to JobsGrid"
```

---

### Task 3: Add Candidate Event Tracking to CandidatesGrid

**Files:**
- Modify: `src/components/CandidatesGrid.tsx`

**Step 1: Import tracking functions**

```tsx
import {
  trackCandidateView,
  trackCandidateCVClick,
  trackCandidateSocialClick,
  trackCandidateContactClick,
} from "@/lib/posthog";
```

**Step 2: Create helper for candidate event properties**

```tsx
const getCandidateEventProps = (candidate: Candidate) => ({
  candidate_id: candidate.id,
  candidate_name: candidate.name,
  candidate_title: candidate.title,
  is_featured: candidate.featured ?? false,
});
```

**Step 3: Track candidate modal open**

In `openCandidate`:
```tsx
trackCandidateView(getCandidateEventProps(candidate));
```

**Step 4: Track CV clicks**

On CV link in ExpandedCandidateView:
```tsx
onClick={() => trackCandidateCVClick(getCandidateEventProps(candidate))}
```

**Step 5: Track social link clicks**

On each social link (X, GitHub, etc.):
```tsx
onClick={() => trackCandidateSocialClick({
  ...getCandidateEventProps(candidate),
  platform: "x", // or "github", "telegram", etc.
  url: candidate.socials.x,
})}
```

**Step 6: Track contact clicks (email, telegram, calendly)**

```tsx
onClick={() => trackCandidateContactClick({
  ...getCandidateEventProps(candidate),
  contact_type: "email",
})}
```

**Step 7: Commit**

```bash
git add src/components/CandidatesGrid.tsx
git commit -m "feat: add PostHog event tracking to CandidatesGrid"
```

---

## Phase 2: Data-Driven HOT Tag

### Task 4: Create PostHog API Utility

**Files:**
- Create: `src/lib/posthog-api.ts`

**Step 1: Create server-side PostHog API client**

```typescript
// Server-side only - uses POSTHOG_PERSONAL_API_KEY (not NEXT_PUBLIC)

const POSTHOG_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
const POSTHOG_HOST = "https://us.posthog.com";

type ApplyClickCount = {
  job_id: string;
  count: number;
};

export async function getJobApplyClicksLast7Days(): Promise<ApplyClickCount[]> {
  if (!POSTHOG_API_KEY || !POSTHOG_PROJECT_ID) {
    console.warn("PostHog API credentials not configured");
    return [];
  }

  const response = await fetch(
    `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/trend/`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        events: [{ id: "job_apply_click", type: "events" }],
        date_from: "-7d",
        breakdown: "job_id",
        breakdown_type: "event",
      }),
    }
  );

  if (!response.ok) {
    console.error("PostHog API error:", await response.text());
    return [];
  }

  const data = await response.json();
  // Parse and return job_id -> count mapping
  return data.result?.map((r: { breakdown_value: string; count: number }) => ({
    job_id: r.breakdown_value,
    count: r.count,
  })) ?? [];
}

export function determineHotJobs(
  clicks: ApplyClickCount[],
  threshold: number = 10
): string[] {
  // Jobs with >= threshold clicks in last 7 days are "hot"
  return clicks
    .filter((c) => c.count >= threshold)
    .map((c) => c.job_id);
}
```

**Step 2: Add env vars to .env.local**

```
POSTHOG_PERSONAL_API_KEY=phx_xxx
POSTHOG_PROJECT_ID=12345
```

**Step 3: Commit**

```bash
git add src/lib/posthog-api.ts
git commit -m "feat: add PostHog server-side API for analytics queries"
```

---

### Task 5: Create API Route for Hot Jobs

**Files:**
- Create: `src/app/api/hot-jobs/route.ts`

**Step 1: Create the API route**

```typescript
import { NextResponse } from "next/server";
import { getJobApplyClicksLast7Days, determineHotJobs } from "@/lib/posthog-api";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const clicks = await getJobApplyClicksLast7Days();
    const hotJobIds = determineHotJobs(clicks, 10); // 10+ clicks = hot

    return NextResponse.json({
      hotJobIds,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch hot jobs:", error);
    return NextResponse.json({ hotJobIds: [], error: "Failed to fetch" }, { status: 500 });
  }
}
```

**Step 2: Test the endpoint**

Run: `curl http://localhost:3000/api/hot-jobs`

**Step 3: Commit**

```bash
git add src/app/api/hot-jobs/route.ts
git commit -m "feat: add API route for data-driven hot jobs"
```

---

### Task 6: Update Jobs Data to Support Dynamic HOT Tag

**Files:**
- Modify: `src/data/jobs.ts`

**Step 1: Add isDataDrivenHot field to Job type**

```typescript
export interface Job {
  // ... existing fields
  isDataDrivenHot?: boolean; // Set dynamically from analytics
}
```

**Step 2: Commit**

```bash
git add src/data/jobs.ts
git commit -m "feat: add isDataDrivenHot field to Job type"
```

---

### Task 7: Fetch Hot Jobs in JobsGrid

**Files:**
- Modify: `src/components/JobsGrid.tsx`

**Step 1: Add state and fetch for hot jobs**

```tsx
const [dataHotJobIds, setDataHotJobIds] = useState<Set<string>>(new Set());

useEffect(() => {
  fetch("/api/hot-jobs")
    .then((res) => res.json())
    .then((data) => {
      if (data.hotJobIds) {
        setDataHotJobIds(new Set(data.hotJobIds));
      }
    })
    .catch(console.error);
}, []);
```

**Step 2: Update isHotJob helper to include data-driven hot**

```tsx
const isHotJob = (job: Job) =>
  job.tags?.includes("hot") || dataHotJobIds.has(job.id);
```

**Step 3: Test**

Run: `bun run dev`
Verify jobs with high apply clicks show as hot

**Step 4: Commit**

```bash
git add src/components/JobsGrid.tsx
git commit -m "feat: integrate data-driven HOT tag with manual override"
```

---

## Phase 3: Analytics Dashboard (Optional Future)

### Task 8: Create Simple Analytics Page (optional)

**Files:**
- Create: `src/app/analytics/page.tsx`

This would display:
- Top jobs by apply clicks
- Top candidates by profile views
- Conversion funnel (view -> details -> apply)

Can be protected with basic auth or only visible in dev mode.

---

## Environment Variables Summary

```bash
# .env.local (gitignored)

# Client-side (exposed to browser)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Server-side only (for API queries)
POSTHOG_PERSONAL_API_KEY=phx_xxx
POSTHOG_PROJECT_ID=12345
```

---

## Testing Checklist

- [ ] PostHog events appear in PostHog dashboard
- [ ] job_view fires when modal opens
- [ ] job_apply_click fires when Apply clicked
- [ ] candidate_view fires when candidate modal opens
- [ ] /api/hot-jobs returns list of hot job IDs
- [ ] Jobs with high clicks show HOT badge dynamically
- [ ] Manual "hot" tag still works as override
