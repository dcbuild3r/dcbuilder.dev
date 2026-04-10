ALTER TABLE "newsletter_campaigns"
  ADD COLUMN "archive_subject" text,
  ADD COLUMN "archive_preview_text" text,
  ADD COLUMN "archive_content_mode" text,
  ADD COLUMN "archive_markdown_content" text,
  ADD COLUMN "archive_manual_html" text,
  ADD COLUMN "archive_manual_text" text,
  ADD COLUMN "archive_rendered_html" text,
  ADD COLUMN "archive_rendered_text" text,
  ADD COLUMN "archive_corrected_at" timestamp,
  ADD COLUMN "archive_corrected_by" text;
