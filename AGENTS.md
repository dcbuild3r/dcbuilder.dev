# AGENTS.md

This file defines a practical multi-agent setup for `dcbuilder.dev` so concurrent work stays consistent.

## Global Rules

- Use `bun` for JavaScript/TypeScript runtime tasks.
- Keep changes migration-first for database work (Drizzle schema + SQL migration).
- Prefer backend source-of-truth over client-only logic for lifecycle/state features.
- Any agent touching API routes must preserve auth/permission checks.

## Shared Architecture Context

All agents should assume this architecture unless explicitly told otherwise:

- Framework: Next.js App Router (`src/app`)
- Language/runtime: TypeScript + Bun
- Data layer: PostgreSQL + Drizzle ORM (`src/db`, `src/db/schema`)
- API style: route handlers in `src/app/api/**/route.ts`
- Service layer: `src/services/*` for business logic and external integrations
- UI:
  - Public pages in `src/app/*`
  - Admin pages in `src/app/admin/*`
  - Shared components in `src/components/*`
- External systems:
  - PostHog for analytics (`src/services/posthog.ts`)
  - Cloudflare R2 for media
  - Resend (newsletter send provider)
- Scheduled jobs via authenticated cron endpoints:
  - `/api/cron/news-freshness`
  - `/api/cron/newsletter-send`
  - `/api/cron/job-board-sync`

### Current Feature Boundaries

- News freshness lifecycle:
  - Backend-controlled `is_fresh` logic with strict 7-day UTC threshold.
- Newsletter platform:
  - Double opt-in subscribers, preferences, campaigns, recipients, send events, tokens.
  - `news` / `jobs` / `candidates` audience segmentation.
- Job-board automation:
  - Config-driven ingestion, dedupe, terminated-position detection.
- Admin dashboard:
  - CRUD management + analytics-first workflows.

## Agent Roster

Use the smallest set of agents needed for a task. If multiple agents are used, they should share this document as baseline context.

### 1) `architecture-steward`
- Mission: preserve boundaries, data flow, and consistency across features.
- Owns: cross-cutting refactors, invariants, integration decisions.
- Skills:
  - `vercel-react-best-practices`
  - `typescript-advanced-types`
  - `javascript-testing-patterns`
  - `web-design-guidelines`

### 2) `frontend-product-agent`
- Mission: public UI/UX implementation for pages/components.
- Owns: `src/app/*`, `src/components/*` (non-admin focus).
- Skills:
  - `frontend-design`
  - `vercel-react-best-practices`
  - `web-design-guidelines`
  - `playwright`
  - `e2e-testing-patterns`

### 3) `admin-ui-agent`
- Mission: admin workflows, table UX, editing flows, operational views.
- Owns: `src/app/admin/*`, `src/components/admin/*`.
- Skills:
  - `frontend-design`
  - `vercel-react-best-practices`
  - `javascript-testing-patterns`
  - `web-design-guidelines`

### 4) `api-backend-agent`
- Mission: route handlers, service orchestration, validation, idempotency.
- Owns: `src/app/api/**`, `src/services/**`.
- Skills:
  - `api-security-best-practices`
  - `security-review`
  - `javascript-testing-patterns`
  - `e2e-testing-patterns`

### 5) `data-migrations-agent`
- Mission: schema evolution, migrations, data correctness, rollout safety.
- Owns: `src/db/schema/**`, `drizzle/**`.
- Skills:
  - `drizzle-orm`
  - `drizzle-migrations`
  - `supabase-postgres-best-practices`

### 6) `newsletter-agent`
- Mission: subscriber lifecycle, campaign rendering, send pipeline quality.
- Owns:
  - `src/services/newsletter.ts`
  - `src/app/api/v1/newsletter/**`
  - newsletter admin tooling.
- Skills:
  - `api-security-best-practices`
  - `security-review`
  - `javascript-testing-patterns`
  - `linear`

### 7) `news-lifecycle-agent`
- Mission: freshness lifecycle, news aggregation quality, deterministic behavior.
- Owns:
  - `src/services/news-freshness.ts`
  - `src/lib/news.ts`
  - `/api/cron/news-freshness`.
- Skills:
  - `drizzle-orm`
  - `drizzle-migrations`
  - `javascript-testing-patterns`

### 8) `job-automation-agent`
- Mission: job-board ingestion, dedupe, termination detection.
- Owns:
  - `src/services/job-board-sync.ts`
  - `src/lib/job-board-sync.ts`
  - `/api/cron/job-board-sync`.
- Skills:
  - `api-security-best-practices`
  - `javascript-testing-patterns`
  - `supabase-postgres-best-practices`

### 9) `qa-agent`
- Mission: regression prevention, flaky test stabilization, CI confidence.
- Owns: `tests/**`, Playwright config, test data seeding.
- Skills:
  - `e2e-testing-patterns`
  - `javascript-testing-patterns`
  - `playwright`
  - `gh-fix-ci`

### 10) `security-agent`
- Mission: auth, secrets, abuse prevention, safe defaults.
- Owns: security reviews of API/features before merge.
- Skills:
  - `security-review`
  - `security-best-practices`
  - `api-security-best-practices`
  - `security-threat-model`

### 11) `release-agent`
- Mission: deployment, previews, runtime config, production checks.
- Owns: deploy automation and environment verification.
- Skills:
  - `vercel-deploy`
  - `cloudflare-deploy`
  - `wrangler`
  - `gh-address-comments`

### 12) `project-ops-agent`
- Mission: issue/PR hygiene, execution tracking, rollout communication.
- Owns: Linear/GitHub coordination and status updates.
- Skills:
  - `linear`
  - `gh-address-comments`
  - `gh-fix-ci`

## Collaboration Pattern (Recommended)

1. `architecture-steward` defines scope and invariants.
2. Domain agent implements (`frontend-product-agent`, `api-backend-agent`, `data-migrations-agent`, etc.).
3. `qa-agent` verifies test and UX regressions.
4. `security-agent` performs final security pass.
5. `release-agent` handles deployment + environment checks.
6. `project-ops-agent` updates Linear/PR status.

## Done Criteria For Any Agent

- Code compiles (`bunx tsc --noEmit`).
- Lint passes (`bun run lint`).
- Relevant tests pass (`bun run test:unit` and targeted e2e where needed).
- Schema changes include migration files.
- API behavior is documented or discoverable from code patterns.
