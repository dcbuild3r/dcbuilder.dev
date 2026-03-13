# Newsletter Archive Corrections Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let admins correct archived newsletter content after send while keeping the actual emailed copy immutable.

**Architecture:** Add archive-only override fields to `newsletter_campaigns`, branch sent-campaign updates through an explicit `archiveOnly` path, and make public archive reads prefer corrected values. Reuse the existing newsletter content rendering pipeline so corrected archive HTML/text stays canonical.

**Tech Stack:** Next.js App Router, TypeScript, Bun, PostgreSQL, Drizzle ORM, Bun test

---

### Task 1: Add the archive correction schema

**Files:**
- Modify: `src/db/schema/newsletter.ts`
- Create: `drizzle/0009_newsletter_archive_corrections.sql`
- Modify: `drizzle/meta/_journal.json`

**Step 1: Write the failing test**

Use the service and archive query tests in later tasks as the red phase that proves the new columns are needed.

**Step 2: Run test to verify it fails**

Run: `bun run test:unit`
Expected: sent campaign archive correction test fails because the schema and queries do not support archive-only fields.

**Step 3: Write minimal implementation**

Add the archive-only columns to the Drizzle schema and create the SQL migration for them.

**Step 4: Run test to verify it passes**

Run: `bun run tsc --noEmit`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/schema/newsletter.ts drizzle/0009_newsletter_archive_corrections.sql drizzle/meta/_journal.json
git commit -m "feat: add newsletter archive correction fields"
```

### Task 2: Add sent-campaign archive correction service tests

**Files:**
- Modify: `tests/newsletter-send.test.ts`
- Create: `tests/newsletter-archive-corrections.test.ts`

**Step 1: Write the failing test**

Add tests proving:
- normal sent campaign updates still return 409
- archive-only sent campaign updates succeed
- public archive queries prefer corrected values

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-archive-corrections.test.ts tests/newsletter-send.test.ts`
Expected: FAIL because the service has no archive-only correction path yet.

**Step 3: Write minimal implementation**

Implement only enough behavior to satisfy the sent archive correction tests.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-archive-corrections.test.ts tests/newsletter-send.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/newsletter-archive-corrections.test.ts tests/newsletter-send.test.ts src/services/newsletter.ts
git commit -m "feat: support archive-only newsletter corrections"
```

### Task 3: Extend the campaign API for archive-only sent edits

**Files:**
- Modify: `src/app/api/v1/newsletter/campaigns/[id]/route.ts`
- Create: `tests/newsletter-campaigns-route.test.ts`

**Step 1: Write the failing test**

Add a route test that PATCH with `archiveOnly: true` is accepted for sent campaigns and still rejects normal sent edits.

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-campaigns-route.test.ts`
Expected: FAIL because the route body and service call do not support `archiveOnly`.

**Step 3: Write minimal implementation**

Pass the `archiveOnly` flag through the route and enforce the service contract.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-campaigns-route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/v1/newsletter/campaigns/[id]/route.ts tests/newsletter-campaigns-route.test.ts
git commit -m "feat: add archive-only newsletter campaign updates"
```

### Task 4: Update public archive reads

**Files:**
- Modify: `src/services/newsletter.ts`
- Modify: `src/lib/newsletter-archive.ts`
- Test: `tests/newsletter-archive.test.ts`

**Step 1: Write the failing test**

Add or extend archive tests so corrected archive values are what `/news` and `/newsletters/[id]` read.

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-archive.test.ts`
Expected: FAIL because archive queries still read the original sent snapshot only.

**Step 3: Write minimal implementation**

Update `listSentNewsletterCampaigns` and `getSentNewsletterCampaignForArchive` to prefer `archive_*` overrides.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-archive.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/newsletter.ts src/lib/newsletter-archive.ts tests/newsletter-archive.test.ts
git commit -m "feat: prefer corrected archive newsletter content"
```

### Task 5: Update the admin studio for sent archive corrections

**Files:**
- Modify: `src/components/admin/NewsletterStudio.tsx`
- Modify: `tests/newsletter-studio.test.ts`

**Step 1: Write the failing test**

Add a UI logic test proving sent campaigns expose an archive correction path instead of the current disabled edit behavior.

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-studio.test.ts`
Expected: FAIL because the studio still treats sent campaigns as fully immutable in the queue editor.

**Step 3: Write minimal implementation**

Add a sent-only `Correct archive` action, archive warning copy, and make save requests send `archiveOnly: true` for sent campaigns.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-studio.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin/NewsletterStudio.tsx tests/newsletter-studio.test.ts
git commit -m "feat: allow archive-only corrections for sent newsletters"
```

### Task 6: Full verification

**Files:**
- Modify: none

**Step 1: Run typecheck**

Run: `bun run tsc --noEmit`
Expected: PASS

**Step 2: Run lint**

Run: `bun run lint`
Expected: PASS

**Step 3: Run unit tests**

Run: `bun run test:unit`
Expected: PASS

**Step 4: Run build**

Run: `bun run build`
Expected: PASS

**Step 5: Commit**

```bash
git add .
git commit -m "docs: record newsletter archive correction plan"
```
