# Newsletter Preferences And Delivery Design

## Goal

Fix three newsletter regressions on `con-14-newsletter-system` without changing the public token model:

1. `Manage preferences` links in emails must open a usable subscriber page.
2. Markdown-mode campaigns must preserve unsubscribe/preferences URLs in the plain-text body.
3. Scheduled campaigns with zero eligible recipients must stop retrying forever.

## Approved Direction

Keep the existing `/api/v1/newsletter/preferences?token=...` URL stable and make its `GET` request render a real HTML preferences page. Keep `PUT` on the same route for updates so already-sent emails continue to work.

## Architecture

### Preferences Flow

The current token validation and preference update logic in `src/services/newsletter.ts` remains the source of truth. The route at `src/app/api/v1/newsletter/preferences/route.ts` changes from JSON-only on `GET` to HTML on `GET`, while `PUT` stays JSON for programmatic updates from the page.

The rendered page should:

- validate the token through `getPreferenceContext`
- display the subscriber email and current enabled newsletter types
- submit updates back to the same route with the existing token
- show a useful success/error state inline

This keeps old links valid and avoids introducing a second public route just to wrap the same token workflow.

### Markdown Text Rendering

The markdown send path currently generates text by stripping links out of rendered HTML. Instead of trying to reconstruct URLs after HTML parsing, the plain-text output should be derived directly from the rendered markdown string so link targets survive in text-only email clients.

The implementation should preserve:

- inline markdown links as `label (url)` or equivalent
- footer preference and unsubscribe URLs
- recommended-link URLs

HTML generation remains unchanged.

### Zero-Recipient Campaign Handling

When a due scheduled campaign has no active recipients, the send flow should move it into a terminal failed state with an explicit `failureReason`. That prevents cron from re-selecting and retrying the same campaign on every run.

Manual/admin sends should surface the same failure result, but the stored campaign state should still be terminal and inspectable from the admin UI.

## Error Handling

- Invalid or expired preference tokens continue to return an error response.
- Preference page submission errors should render a visible message without invalidating the token automatically.
- Zero-recipient failures should set `status = "failed"` and a human-readable `failureReason`.

## Testing Strategy

- Route test proving the preference `GET` returns HTML instead of JSON.
- Unit test proving markdown text output retains preference/unsubscribe URLs.
- Service test proving zero-recipient scheduled campaigns transition to `failed` and stop looking schedulable.

## Non-Goals

- No redesign of the broader newsletter data model.
- No separate public preferences page URL.
- No change to the token schema or email provider integration beyond these bugfixes.
