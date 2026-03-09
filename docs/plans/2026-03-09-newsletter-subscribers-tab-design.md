# Newsletter Subscribers Tab Design

## Goal

Add a Subscribers view to Newsletter Studio so admin users can see every subscriber in one combined table and manage the three newsletter subscriptions (`news`, `jobs`, `candidates`) with toggles.

## Scope

This work adds:

- a new `Subscribers` mode in Newsletter Studio
- one combined table with one row per subscriber email
- three toggle columns for `News`, `Jobs`, and `Candidates`
- per-row `Save` and `Reset` actions
- one admin write endpoint for updating a subscriber's enabled newsletter types

This work does not add:

- bulk editing
- CSV export
- advanced analytics drilldowns
- a separate standalone admin page

## Current State

The branch already has:

- `GET /api/v1/newsletter/subscribers` in `src/app/api/v1/newsletter/subscribers/route.ts`
- subscriber records in `newsletter_subscribers`
- per-type preferences in `newsletter_preferences`
- Newsletter Studio modes for `Compose`, `Queue`, and `Templates`

The data model is one subscriber with multiple preferences, not three separate mailing lists. The UI should reflect that directly.

## Approved Direction

Use one combined table in Newsletter Studio.

Each row represents one subscriber and shows:

- email
- subscriber status
- toggle for `News`
- toggle for `Jobs`
- toggle for `Candidates`
- clicks in the last 7 days
- last clicked link
- created date
- row-level actions

Toggle changes stay local until the admin presses `Save` on that row. This avoids accidental live edits while still keeping the UI fast.

## Data Flow

### Read Path

`NewsletterStudio` fetches `/api/v1/newsletter/subscribers?limit=...` and normalizes each row into UI state:

- `enabledTypes: { news: boolean, jobs: boolean, candidates: boolean }`
- `draftEnabledTypes` for local edits
- `dirty` flag derived from current vs draft values

### Write Path

Add an admin write route for one subscriber, for example:

- `PATCH /api/v1/newsletter/subscribers/[id]`

Request body:

```json
{
  "newsletterTypes": ["news", "candidates"]
}
```

The handler should:

- require `admin:write`
- validate the subscriber exists
- update preferences through shared newsletter service logic
- update subscriber status using existing semantics:
  - `pending` stays `pending`
  - `active` or `unsubscribed` becomes `active` if any type remains enabled
  - `active` or `unsubscribed` becomes `unsubscribed` if all are disabled

This preserves double opt-in behavior. Admin preference edits should not silently confirm pending subscribers.

## UI Design

### Placement

Add `Subscribers` as a fourth Newsletter Studio mode next to:

- Compose
- Queue
- Templates

### Table Behavior

The initial version should be intentionally narrow:

- one combined table
- no pagination controls in the first pass beyond existing API `limit`
- row-level unsaved indicator
- row-level `Save` and `Reset`

Recommended columns:

1. `Email`
2. `Status`
3. `News`
4. `Jobs`
5. `Candidates`
6. `Clicks 7d`
7. `Last clicked`
8. `Created`
9. `Actions`

### Toggle Semantics

Each toggle changes the row draft only.

When all three toggles are off:

- the row is valid
- saving it unsubscribes the subscriber unless they are still `pending`

When one or more toggles are on:

- saving it enables exactly those types

### Feedback

Each row should surface:

- saving state
- save error state
- unsaved state

Top-level page errors should still use the existing Newsletter Studio error surface.

## Backend Logic

Add a shared service helper in `src/services/newsletter.ts`, for example:

- `adminUpdateSubscriberPreferences(subscriberId: string, newsletterTypes: string[])`

Responsibilities:

- validate subscriber exists
- normalize types through `dedupeNewsletterTypes`
- call `upsertPreferences`
- update subscriber status according to the rules above
- return the refreshed subscriber + preferences payload if helpful

This keeps token-based preference updates and admin-based preference updates aligned around the same core preference mutation behavior.

## Testing Strategy

### Backend

- route test for `PATCH /api/v1/newsletter/subscribers/[id]`
- service test for status transitions:
  - `active` + all off => `unsubscribed`
  - `unsubscribed` + any on => `active`
  - `pending` + changes => remains `pending`

### Frontend

Because `NewsletterStudio` is large, avoid full end-to-end component testing in the first pass.

Extract small pure helpers for:

- mapping subscriber API payload to toggle state
- detecting dirty rows

Test those helpers with Bun unit tests. Keep the component change straightforward and thin.

## Risks

### Risk: accidental silent confirmation

Mitigation:

- do not set `pending` subscribers to `active` from the admin subscriber table

### Risk: component sprawl in `NewsletterStudio`

Mitigation:

- add a small presentational subcomponent or helper block for the subscribers table
- keep table state separate from compose/queue/template state

### Risk: misunderstanding the model as three separate lists

Mitigation:

- keep one row per subscriber
- show all three toggles together in the same row

## Success Criteria

This feature is complete when:

- Newsletter Studio has a `Subscribers` tab
- the tab renders one combined table of subscribers
- admins can see the `News`, `Jobs`, and `Candidates` subscriptions in one place
- admins can toggle and save per-row subscription changes
- pending subscribers are not auto-confirmed by admin edits
