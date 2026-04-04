# Newsletter Public Slug Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add title-and-date-derived public slugs for newsletter archive URLs while preserving internal campaign IDs and redirecting legacy CUID archive links to canonical slug URLs.

**Architecture:** Extend `newsletter_campaigns` with a `public_slug`, backfill existing rows in a migration, generate and maintain slugs in the newsletter service layer, and update public archive routes to resolve by slug first with a legacy-ID redirect fallback. Keep newsletter sending and admin workflows on the existing internal `id`.

**Tech Stack:** Next.js App Router, TypeScript, Bun, PostgreSQL, Drizzle ORM

---

### Task 1: Add the public slug schema and migration

**Files:**
- Modify: `src/db/schema/newsletter.ts`
- Create: `drizzle/0010_newsletter_public_slug.sql`
- Modify: `drizzle/meta/_journal.json`

**Step 1: Write the failing test**

Use the slug generation and archive lookup tests in later tasks as the red phase that proves the schema is missing `public_slug`.

**Step 2: Run test to verify it fails**

Run: `bun run test:unit`
Expected: archive slug tests fail because the schema and queries do not support `public_slug`.

**Step 3: Write minimal implementation**

Add a nullable `publicSlug` column to the Drizzle schema, then create a migration that:

- adds `public_slug`
- backfills existing campaigns from subject + UTC date anchor
- resolves collisions with numeric suffixes
- adds a unique index
- makes `public_slug` non-null after backfill

**Step 4: Run test to verify it passes**

Run: `bunx tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/schema/newsletter.ts drizzle/0010_newsletter_public_slug.sql drizzle/meta/_journal.json
git commit -m "feat: add newsletter public slug schema"
```

### Task 2: Add slug helper tests and generation logic

**Files:**
- Create: `src/lib/newsletter-slug.ts`
- Create: `tests/newsletter-slug.test.ts`

**Step 1: Write the failing test**

Add tests covering:

- normalization from subject + date
- punctuation cleanup
- UTC date formatting
- collision suffix generation
- publish-date anchor priority: `sentAt`, then `scheduledAt`, then `createdAt`

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-slug.test.ts`
Expected: FAIL because the slug helper does not exist yet.

**Step 3: Write minimal implementation**

Add a helper module that exports functions to:

- normalize a subject into a slug-safe base
- derive the date anchor
- build a canonical slug
- resolve uniqueness against existing slugs

Keep the helper pure where possible so it is cheap to test.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-slug.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/newsletter-slug.ts tests/newsletter-slug.test.ts
git commit -m "feat: add newsletter public slug helpers"
```

### Task 3: Generate and maintain slugs in the newsletter service layer

**Files:**
- Modify: `src/services/newsletter.ts`
- Test: `tests/newsletter-campaigns-route.test.ts`
- Test: `tests/newsletter-archive-corrections.test.ts`

**Step 1: Write the failing test**

Add service-level coverage proving:

- newly created campaigns get a `publicSlug`
- mutable draft/scheduled campaigns recalculate the slug when subject or schedule changes
- sent campaigns keep the same slug after archive-only corrections or other blocked edits

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-campaigns-route.test.ts tests/newsletter-archive-corrections.test.ts`
Expected: FAIL because campaign creation and updates do not maintain `publicSlug`.

**Step 3: Write minimal implementation**

Update `src/services/newsletter.ts` so:

- `createNewsletterCampaign()` assigns a unique slug before insert
- mutable campaign updates recalculate the slug when relevant fields change
- sent campaigns preserve the stored slug

Do not replace internal `id` usage anywhere in admin or send flows.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-campaigns-route.test.ts tests/newsletter-archive-corrections.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/newsletter.ts tests/newsletter-campaigns-route.test.ts tests/newsletter-archive-corrections.test.ts
git commit -m "feat: maintain newsletter public slugs"
```

### Task 4: Update public archive queries to expose and resolve slugs

**Files:**
- Modify: `src/services/newsletter.ts`
- Modify: `src/lib/newsletter-archive.ts`
- Test: `tests/newsletter-archive.test.ts`

**Step 1: Write the failing test**

Add archive tests proving:

- archive list results include `publicSlug`
- detail lookup succeeds by slug
- detail lookup still succeeds by legacy `id`
- loader returns enough information for a redirect when a legacy `id` is used

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-archive.test.ts`
Expected: FAIL because archive lookups are currently `id`-only.

**Step 3: Write minimal implementation**

Update archive service queries to:

- select `publicSlug`
- resolve detail by slug first
- fall back to `id`
- return redirect metadata when the request matched a legacy `id`

Keep missing-schema handling unchanged.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-archive.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/newsletter.ts src/lib/newsletter-archive.ts tests/newsletter-archive.test.ts
git commit -m "feat: resolve newsletter archive by public slug"
```

### Task 5: Canonicalize the public route and links

**Files:**
- Modify: `src/app/newsletters/[id]/page.tsx`
- Modify: `src/components/NewsTools.tsx`
- Modify: `src/components/NewsletterArchivePreview.tsx`
- Modify: `src/components/NewsToolsClient.tsx`
- Test: `tests/newsletter-public-route.test.ts`

**Step 1: Write the failing test**

Add route/component coverage proving:

- archive links render `/newsletters/<public-slug>`
- a request to `/newsletters/<legacy-id>` permanently redirects to `/newsletters/<public-slug>`
- slug requests render normally without redirect loops

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-public-route.test.ts`
Expected: FAIL because public links and route handling still use `id`.

**Step 3: Write minimal implementation**

Update the public route and archive link components to use `publicSlug` as the canonical URL segment. In the page route:

- if lookup matched a legacy `id`, redirect permanently to the slug URL
- if lookup matched a slug, render as normal

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-public-route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/newsletters/[id]/page.tsx src/components/NewsTools.tsx src/components/NewsletterArchivePreview.tsx src/components/NewsToolsClient.tsx tests/newsletter-public-route.test.ts
git commit -m "feat: canonicalize newsletter archive URLs"
```

### Task 6: Run full verification and backfill confidence checks

**Files:**
- Modify as needed from earlier tasks

**Step 1: Run targeted tests**

Run:

```bash
bun test tests/newsletter-slug.test.ts
bun test tests/newsletter-archive.test.ts
bun test tests/newsletter-public-route.test.ts
```

Expected: PASS

**Step 2: Run repo verification**

Run:

```bash
bunx tsc --noEmit
bun run lint
bun run test:unit
```

Expected: PASS

**Step 3: Build the app**

Run:

```bash
bun run build
```

Expected: PASS

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add canonical newsletter archive slugs"
```
