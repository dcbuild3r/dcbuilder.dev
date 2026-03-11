# Newsletter Subscribers Tab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Newsletter Studio subscribers tab with one combined table showing and editing `news`, `jobs`, and `candidates` subscriptions per subscriber.

**Architecture:** Extend the existing subscribers read API with a new admin write path for one subscriber, then wire a new `Subscribers` mode into Newsletter Studio. Keep edits row-local with `Save` and `Reset`, and preserve the current subscriber lifecycle semantics so pending subscribers are not silently confirmed.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Bun tests, Drizzle ORM

---

### Task 1: Add Shared Admin Preference Update Logic

**Files:**
- Modify: `src/services/newsletter.ts`
- Test: `tests/newsletter-admin-subscribers.test.ts`

**Step 1: Write the failing test**

Add a service-level test that exercises a new admin update helper and proves these status transitions:

- `active` subscriber + `[]` => status becomes `unsubscribed`
- `unsubscribed` subscriber + `["news"]` => status becomes `active`
- `pending` subscriber + `["jobs"]` => status remains `pending`

Mock the DB calls narrowly and assert the update payloads.

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-admin-subscribers.test.ts`
Expected: FAIL because the admin helper does not exist yet.

**Step 3: Write minimal implementation**

In `src/services/newsletter.ts`, add:

```ts
export async function adminUpdateSubscriberPreferences(
  subscriberId: string,
  newsletterTypes: string[],
) {
  // load subscriber
  // normalize types with dedupeNewsletterTypes()
  // upsert preferences
  // update status with pending preserved
}
```

Use the existing `upsertPreferences()` helper rather than duplicating preference write logic.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-admin-subscribers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/services/newsletter.ts tests/newsletter-admin-subscribers.test.ts
git commit -m "feat: add admin subscriber preference updates"
```

### Task 2: Add Admin Write Route For A Subscriber Row

**Files:**
- Create: `src/app/api/v1/newsletter/subscribers/[id]/route.ts`
- Modify: `src/app/api/v1/newsletter/subscribers/route.ts`
- Test: `tests/newsletter-subscribers-route.test.ts`

**Step 1: Write the failing test**

Add a route test for:

- `PATCH /api/v1/newsletter/subscribers/[id]`
- requires `admin:write`
- accepts `{ newsletterTypes: [...] }`
- calls the new service helper
- returns updated row data or `{ data: ... }`

Add one negative test for invalid JSON or missing `newsletterTypes`.

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-subscribers-route.test.ts`
Expected: FAIL because the route file does not exist yet.

**Step 3: Write minimal implementation**

Create `src/app/api/v1/newsletter/subscribers/[id]/route.ts`:

```ts
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request, "admin:write");
  // parse body
  // call adminUpdateSubscriberPreferences(id, newsletterTypes)
  // return JSON
}
```

Leave the existing list route focused on reads.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-subscribers-route.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/v1/newsletter/subscribers/[id]/route.ts src/app/api/v1/newsletter/subscribers/route.ts tests/newsletter-subscribers-route.test.ts
git commit -m "feat: add admin subscriber update route"
```

### Task 3: Add Subscriber Table Helpers

**Files:**
- Create: `src/lib/newsletter-subscribers.ts`
- Test: `tests/newsletter-subscribers.test.ts`

**Step 1: Write the failing test**

Add pure helper tests for:

- mapping API preferences into `{ news, jobs, candidates }`
- deriving whether a row is dirty
- building the outgoing `newsletterTypes` array from toggle state

Example shape:

```ts
expect(buildNewsletterTypes({ news: true, jobs: false, candidates: true })).toEqual(["news", "candidates"]);
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-subscribers.test.ts`
Expected: FAIL because the helper module does not exist yet.

**Step 3: Write minimal implementation**

Create `src/lib/newsletter-subscribers.ts` with small pure helpers such as:

```ts
export function toPreferenceFlags(preferences) { ... }
export function buildNewsletterTypes(flags) { ... }
export function isPreferenceRowDirty(current, draft) { ... }
```

Keep the API tiny and UI-focused.

**Step 4: Run test to verify it passes**

Run: `bun test tests/newsletter-subscribers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/newsletter-subscribers.ts tests/newsletter-subscribers.test.ts
git commit -m "feat: add newsletter subscriber table helpers"
```

### Task 4: Add Subscribers Mode To Newsletter Studio

**Files:**
- Modify: `src/components/admin/NewsletterStudio.tsx`
- Modify: `src/app/admin/news/page.tsx` (only if new props or wiring are needed)
- Reference: `src/app/api/v1/newsletter/subscribers/route.ts`
- Reference: `src/lib/newsletter-subscribers.ts`

**Step 1: Write the failing test**

Because `NewsletterStudio` is large and currently untested at the component level, write the smallest practical test around the extracted helpers from Task 3 rather than a full component render. The failing condition for this task is functional and manual:

- the UI should expose a `Subscribers` mode
- the mode should fetch the subscribers API
- rows should show toggles for `news`, `jobs`, `candidates`

Add any small helper test needed before the component change, but avoid introducing a big rendering harness unless required.

**Step 2: Run test to verify it fails**

Run: `bun test tests/newsletter-subscribers.test.ts`
Expected: helper tests cover the data shape; UI remains to implement.

**Step 3: Write minimal implementation**

In `src/components/admin/NewsletterStudio.tsx`:

- extend `type Mode = "compose" | "queue" | "templates"` to include `"subscribers"`
- add subscriber row types
- load subscriber data with `adminFetch("/api/v1/newsletter/subscribers?limit=200")`
- render a new `Subscribers` section with one combined table
- add three toggle columns
- track per-row draft state
- show `Unsaved`, `Save`, and `Reset`
- call `PATCH /api/v1/newsletter/subscribers/[id]` on save

Recommended row structure:

```ts
type SubscriberRowDraft = {
  id: string;
  email: string;
  status: string;
  current: PreferenceFlags;
  draft: PreferenceFlags;
  clicks7d: number;
  lastClickedLink: string | null;
  createdAt: string;
}
```

**Step 4: Run focused verification**

Run:

```bash
bun test tests/newsletter-subscribers.test.ts
```

Expected: PASS

Then manually inspect the relevant TypeScript compile path with:

```bash
bunx tsc --noEmit
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin/NewsletterStudio.tsx src/app/admin/news/page.tsx src/lib/newsletter-subscribers.ts tests/newsletter-subscribers.test.ts
git commit -m "feat: add newsletter subscribers tab"
```

### Task 5: Full Verification

**Files:**
- Verify only

**Step 1: Run targeted tests**

Run:

```bash
bun test tests/newsletter-admin-subscribers.test.ts tests/newsletter-subscribers-route.test.ts tests/newsletter-subscribers.test.ts
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

**Step 5: Commit final verified state**

```bash
git add src/services/newsletter.ts src/app/api/v1/newsletter/subscribers/[id]/route.ts src/app/api/v1/newsletter/subscribers/route.ts src/lib/newsletter-subscribers.ts src/components/admin/NewsletterStudio.tsx tests/newsletter-admin-subscribers.test.ts tests/newsletter-subscribers-route.test.ts tests/newsletter-subscribers.test.ts docs/plans/2026-03-09-newsletter-subscribers-tab-design.md docs/plans/2026-03-09-newsletter-subscribers-tab.md
git commit -m "feat: add newsletter subscribers tab"
```
