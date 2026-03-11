# Newsletter Preferences And Delivery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix newsletter preference links, preserve plain-text URLs for markdown campaigns, and stop zero-recipient scheduled campaigns from retrying forever.

**Architecture:** Keep the existing tokenized preferences URL and make `GET /api/v1/newsletter/preferences` render HTML, while `PUT` remains the update API. Move markdown plain-text generation to markdown-aware text rendering and mark zero-recipient scheduled campaigns as terminal failures.

**Tech Stack:** Next.js App Router route handlers, Bun tests, Drizzle ORM, TypeScript

---

### Task 1: Render A Subscriber Preferences Page On The Existing URL

**Files:**
- Modify: `src/app/api/v1/newsletter/preferences/route.ts`
- Test: `tests/newsletter-preferences-route.test.ts`

**Step 1: Write the failing test**

Add a route test that mocks `getPreferenceContext`, calls `GET /api/v1/newsletter/preferences?token=test-token`, and expects:

- `content-type` includes `text/html`
- response body includes the subscriber email
- response body includes newsletter type labels and checked state markers

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-preferences-route.test.ts`
Expected: FAIL because the route currently returns JSON.

**Step 3: Write minimal implementation**

Update the `GET` handler in `src/app/api/v1/newsletter/preferences/route.ts` to render an HTML page that:

- reads the token from the query string
- loads the context with `getPreferenceContext`
- includes a form with current preferences
- submits updates back to the same route with `fetch(..., { method: "PUT" })`
- renders success/error copy inline

Keep `PUT` JSON-based.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-preferences-route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/newsletter-preferences-route.test.ts src/app/api/v1/newsletter/preferences/route.ts
git commit -m "fix: render newsletter preferences page"
```

### Task 2: Preserve URLs In Markdown-Mode Plain Text Emails

**Files:**
- Modify: `src/services/newsletter.ts`
- Test: `tests/newsletter-markdown-text.test.ts`

**Step 1: Write the failing test**

Add a test that exercises the markdown campaign rendering path and expects the plain-text output to include:

- the preference URL
- the unsubscribe URL
- at least one rendered markdown link target

Use public service helpers where possible; otherwise add a small exported helper only if needed for testability.

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-markdown-text.test.ts`
Expected: FAIL because the current implementation strips links when converting HTML to text.

**Step 3: Write minimal implementation**

In `src/services/newsletter.ts`, derive markdown-mode text from the rendered markdown content rather than from stripped HTML. Preserve link targets in a plain-text-friendly format such as `label (url)`.

Limit the change to the markdown-mode branch; do not rework template/manual behavior unless required by the test.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-markdown-text.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/newsletter-markdown-text.test.ts src/services/newsletter.ts
git commit -m "fix: preserve markdown newsletter links in text output"
```

### Task 3: Mark Zero-Recipient Scheduled Campaigns As Terminal Failures

**Files:**
- Modify: `src/services/newsletter.ts`
- Test: `tests/newsletter-send.test.ts`

**Step 1: Write the failing test**

Add a service test covering a due scheduled campaign with zero eligible recipients. Expect:

- send result returns a conflict/error
- campaign status is updated to `failed`
- `failureReason` is set to a readable zero-recipient message

Mock DB queries narrowly around the public `sendDueNewsletterCampaigns()` or `sendNewsletterCampaignNow()` entry point.

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-send.test.ts`
Expected: FAIL because the current code restores the previous status and leaves the campaign schedulable.

**Step 3: Write minimal implementation**

In `src/services/newsletter.ts`, change the zero-recipient branch so it writes a terminal failure state instead of restoring the previous status. Keep the returned error intact for the caller.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-send.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/newsletter-send.test.ts src/services/newsletter.ts
git commit -m "fix: fail empty newsletter campaigns once"
```

### Task 4: Verify The Full Fix Set

**Files:**
- Verify only

**Step 1: Run targeted tests**

Run:

```bash
bun test tests/newsletter-preferences-route.test.ts tests/newsletter-markdown-text.test.ts tests/newsletter-send.test.ts
```

Expected: PASS

**Step 2: Run full unit suite**

Run:

```bash
bun run test:unit
```

Expected: PASS

**Step 3: Run typecheck**

Run:

```bash
bunx tsc --noEmit
```

Expected: PASS

**Step 4: Run production build**

Run:

```bash
bun run build
```

Expected: PASS

**Step 5: Commit final verification-backed changes**

```bash
git add src/app/api/v1/newsletter/preferences/route.ts src/services/newsletter.ts tests/newsletter-preferences-route.test.ts tests/newsletter-markdown-text.test.ts tests/newsletter-send.test.ts docs/plans/2026-03-09-newsletter-preferences-and-delivery-design.md docs/plans/2026-03-09-newsletter-preferences-and-delivery.md
git commit -m "fix: harden newsletter preferences and delivery flows"
```
