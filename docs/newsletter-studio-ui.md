# Newsletter Studio UI Redesign Spec

## Goals
- Make the Newsletter Studio feel like a purpose-built "editor" instead of a stack of forms.
- Reduce cognitive load by splitting the UI into three clear modes: Compose, Queue, Templates.
- Provide a live preview that reflects the selected type, period, and subject.
- Keep all lifecycle logic server-driven (campaign creation, scheduling, template rendering).

## Non-Goals
- Building a full WYSIWYG email builder.
- Adding new newsletter provider integrations (Resend remains the send provider).

## Information Architecture
- **Compose**
  - Create campaign drafts (and optional schedule at creation).
  - Live preview rendered from the saved template for the selected type.
  - Quick action: auto-create weekly "news" draft (deduped server-side).
- **Queue**
  - Operational view of existing campaigns.
  - Filter/search + quick schedule/send actions.
  - Clear status visibility and failure surfacing.
- **Templates**
  - Edit stored templates per newsletter type.
  - Placeholder insertion helper.
  - Preview rendering with a configurable campaign subject + period.

## Core Interactions
### Compose
- Inputs
  - Newsletter type
  - Period (days)
  - Subject
  - Preview text (optional)
  - Schedule (optional)
- Actions
  - Create draft (POST campaign)
  - Generate weekly draft (POST auto-create weekly; only valid for `news`)
  - Refresh preview (POST template preview)
- Preview
  - Tabs: HTML, Text, Subject
  - Uses server rendering, not client interpolation.
  - Displays digest context (heading/summary) to explain why output changed.

### Queue
- Filters
  - Status segmented control (all/draft/scheduled/sending/sent/failed)
  - Search by subject/type
- Row actions
  - Schedule: datetime-local input + Set button (server stores UTC)
  - Send now: triggers send endpoint (disabled for sent/sending)
- Empty state
  - Clear CTA back to Compose.

### Templates
- Inputs
  - Template type selector
  - Subject template / HTML template / Text template
  - Preview subject + period (preview context)
- Placeholders
  - Clickable tokens inserted at cursor into the focused field.
- Preview
  - Tabs: HTML, Text, Subject
  - Rendered via server preview endpoint using the current draft template content.

## Backend Requirements
- Template preview endpoint must accept an optional `campaignSubject` override to ensure live previews reflect the subject admins type in Compose/Preview.
- Auth/permissions remain enforced via `requireAuth(request, "admin:read")`.

## Rendering Safety
- HTML preview should be shown in an `iframe` with `sandbox` enabled.
- Preview links should open in a new tab (via `<base target="_blank">` in the iframe doc).

## Copy/UX Notes
- Primary CTAs use clear verbs: "Create draft", "Generate weekly draft", "Save", "Preview".
- Templates show an "Unsaved" indicator when draft differs from persisted data.

