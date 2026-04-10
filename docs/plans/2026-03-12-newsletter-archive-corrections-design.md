# Newsletter Archive Corrections Design

**Date:** 2026-03-12

## Goal

Allow admins to correct the public archived version of a newsletter after it has already been sent, without changing the originally delivered emails, recipient history, or send lifecycle.

## Constraints

- Sent emails are immutable.
- Existing draft and scheduled campaign editing behavior must stay unchanged.
- Public archive pages must prefer corrected archive content when present.
- The change must be migration-first.

## Chosen Approach

Add archive-only override fields to `newsletter_campaigns` rather than overwriting the existing sent snapshot or creating a separate revisions table.

## Why This Approach

- Keeps the original sent snapshot intact in `subject`, `preview_text`, `rendered_html`, and `rendered_text`.
- Keeps the public archive logic simple by selecting archive overrides first and falling back to the original snapshot.
- Reuses the existing campaign editing and rendering pipeline with a small archive-only branch.
- Avoids introducing a more complex revisions model before it is needed.

## Data Model

Add nullable archive-only fields to `newsletter_campaigns`:

- `archive_subject`
- `archive_preview_text`
- `archive_content_mode`
- `archive_markdown_content`
- `archive_manual_html`
- `archive_manual_text`
- `archive_rendered_html`
- `archive_rendered_text`
- `archive_corrected_at`
- `archive_corrected_by`

## Behavior

- Draft and scheduled campaigns remain editable through the existing path.
- Sent campaigns remain immutable unless the request is explicitly marked as `archiveOnly`.
- Archive-only updates re-render canonical archive HTML/text and only write to the `archive_*` fields.
- Public archive routes use corrected archive values when present.

## Admin UI

- Sent campaigns get a `Correct archive` action instead of the current disabled edit path.
- The editor shows a clear archive-only warning that emailed content will not change.
- Send, schedule, and delete actions remain disabled for sent campaigns.

## Testing

- Service test for sent campaign archive corrections.
- Archive query test proving public archive prefers corrected values.
- API/UI coverage for the archive-only sent campaign edit path.
