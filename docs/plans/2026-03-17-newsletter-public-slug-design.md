# Newsletter Public Slug Design

**Date:** 2026-03-17

## Goal

Make public newsletter archive URLs derive from the newsletter title plus publish date while keeping the existing internal campaign IDs stable for admin operations, send history, and recipient relationships.

## Constraints

- `newsletter_campaigns.id` is already the primary key and is referenced by recipient and send-event records.
- Existing public newsletter archive links using legacy CUID-style IDs should keep working.
- Sent campaign URLs should stay stable after publish, even if archive corrections change the visible title later.
- The change must be migration-first.

## Chosen Approach

Add a separate `public_slug` column to `newsletter_campaigns`, use it as the canonical public archive identifier, and keep `id` as the internal identifier.

## Why This Approach

- Avoids rewriting `campaign_id` references in `newsletter_campaign_recipients` and `newsletter_send_events`.
- Gives clean public URLs without coupling route identity to internal storage identity.
- Lets existing CUID archive links resolve and redirect to the canonical slug URL.
- Keeps newsletter admin and send pipeline behavior unchanged.

## URL Shape

Canonical public archive URLs become:

- `/newsletters/<public-slug>`

Example:

- `/newsletters/weekly-news-digest-2026-02-27`

Legacy URLs like `/newsletters/a16qpbbyzv3eyjerhwph17hm` should still resolve, but they should permanently redirect to the canonical slug URL.

## Slug Derivation Rules

Derive `public_slug` from:

- normalized subject
- UTC publish-date anchor

Date anchor priority:

1. `sent_at` for sent campaigns
2. `scheduled_at` when present
3. `created_at` otherwise

The normalized slug format should be:

- lowercase
- spaces and separators collapsed to `-`
- non-alphanumeric characters removed except `-`
- date suffix appended as `YYYY-MM-DD`

Example:

- subject: `Weekly News Digest`
- publish date: `2026-02-27`
- slug: `weekly-news-digest-2026-02-27`

## Collision Handling

Slugs must be unique. If two campaigns normalize to the same base slug and date, append a numeric suffix:

- `weekly-news-digest-2026-02-27`
- `weekly-news-digest-2026-02-27-2`

The suffix should be deterministic within the existing dataset and stable once written.

## Slug Lifecycle

- Draft campaigns: slug can change if subject or schedule changes.
- Scheduled campaigns: slug can change before send if subject or schedule changes.
- Sent campaigns: slug becomes immutable once the campaign is sent.
- Archive corrections: may change visible archive content, but must not change the canonical slug after publish.

## Data Model

Add to `newsletter_campaigns`:

- `public_slug text`

End-state requirements:

- non-null
- unique
- indexed for public archive lookup

## Read Path

Public archive list queries should return:

- internal `id`
- `publicSlug`
- subject/preview/sent metadata

Public archive detail lookup should:

1. try `public_slug`
2. if not found, try legacy internal `id`
3. if the legacy `id` resolves, redirect to the canonical slug URL

## Write Path

Campaign creation should assign a derived `public_slug` at insert time.

Campaign updates should:

- recalculate the slug while the campaign is still mutable
- preserve the existing slug once the campaign is `sent`

## Routing

The archive route can stay at `src/app/newsletters/[id]/page.tsx` initially, but the route parameter should be treated as an opaque identifier, not specifically an internal ID.

The page should:

- resolve the campaign by slug first
- fall back to legacy `id`
- redirect old links to the canonical slug path

## Rollout Plan

1. Add `public_slug` to the schema.
2. Backfill existing campaigns in a migration.
3. Add the unique index / non-null guarantee.
4. Update creation and update flows to maintain the slug.
5. Switch public archive links and lookups to the slug.
6. Keep legacy CUID links working through redirects.

## Testing

- Unit tests for slug generation and normalization.
- Unit tests for collision resolution.
- Service tests proving sent-campaign slugs stay immutable.
- Archive loader tests for lookup by `public_slug`.
- Route tests for legacy-ID redirect behavior.
- Regression tests for archive list links using the canonical slug.
